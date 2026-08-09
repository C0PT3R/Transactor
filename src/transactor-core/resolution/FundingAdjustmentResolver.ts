import { LocalDate } from "@c0pt3r/local-date"
import Account from "../accounts/Account"
import FundingOperation from "../operations/FundingOperation"
import FundingAdjustmentOperation from "../operations/FundingAdjustmentOperation"
import type LedgerEntry from "../accounts/LedgerEntry"
import type { IterativeResolver, ResolutionResult } from "./IterativeResolver"
import { resolutionResult } from "./IterativeResolver"

interface FundingSolution {
	readonly recurringAmount: number
	readonly signedAdjustment: number
	readonly score: number
}

/**
 * Resolves the two degrees of freedom of an even-payments strategy together:
 * the constant recurring payment and the one-time signed initial adjustment.
 *
 * For a fixed set of interest transactions, every candidate recurring payment
 * has exactly one adjustment that moves its lowest balance to minimumBalance.
 * The best candidate is the one with the smallest time-weighted excess balance
 * above minimumBalance over the strategy lifetime.
 */
export default class FundingAdjustmentResolver implements IterativeResolver {
	public readonly name: string
	private readonly entriesByDate = new Map<number, LedgerEntry[]>()
	private readonly preStartEntries: readonly LedgerEntry[]

	public constructor(
		private readonly account: Account,
		private readonly fundingOperation: FundingOperation,
		private readonly inflowAdjustment: FundingAdjustmentOperation,
		private readonly outflowAdjustment: FundingAdjustmentOperation
	) {
		this.name = `Even funding: ${fundingOperation.name} -> ${account.name}`

		const preStartEntries: LedgerEntry[] = []

		for (const entry of account.getLedgerEntries()) {
			const transaction = entry.transaction

			if (
				transaction.operation === inflowAdjustment ||
				transaction.operation === outflowAdjustment
			)
				continue

			if (transaction.chargeDate < fundingOperation.schedule.startDate) {
				preStartEntries.push(entry)
				continue
			}

			if (transaction.chargeDate > fundingOperation.schedule.endDate)
				continue

			const epochDay = transaction.chargeDate.epochDay
			const entries = this.entriesByDate.get(epochDay) ?? []
			entries.push(entry)
			this.entriesByDate.set(epochDay, entries)
		}

		this.preStartEntries = preStartEntries
	}

	public resolve(): ResolutionResult {
		const solution = this.findBestSolution()
		const inflowAmount = Math.max(0, solution.signedAdjustment)
		const outflowAmount = Math.max(0, -solution.signedAdjustment)

		const fundingDelta = this.fundingOperation.updateResolvedAmount(
			solution.recurringAmount
		)
		const inflowDelta = this.inflowAdjustment.updateResolvedAmount(inflowAmount)
		const outflowDelta = this.outflowAdjustment.updateResolvedAmount(outflowAmount)

		return resolutionResult(Math.max(fundingDelta, inflowDelta, outflowDelta))
	}

	private findBestSolution(): FundingSolution {
		const cache = new Map<number, FundingSolution>()
		const evaluate = (recurringAmount: number): FundingSolution => {
			const amount = Math.max(0, Math.trunc(recurringAmount))
			const cached = cache.get(amount)
			if (cached) return cached

			const solution = this.evaluate(amount)
			cache.set(amount, solution)
			return solution
		}

		/*
		 * With interest held fixed during one iterative pass, every account balance
		 * is affine in the recurring payment. After translating the whole path so
		 * its minimum equals minimumBalance, the time-weighted excess-balance score
		 * is convex. We can therefore bracket the minimum and use a discrete ternary
		 * search, then inspect the remaining cent values exactly.
		 */
		const seed = Math.max(1, this.fundingOperation.getAmount() ?? 1)
		let upper = Math.max(2, seed * 2)
		let upperSolution = evaluate(upper)

		for (let expansion = 0; expansion < 32; expansion++) {
			const doubled = upper * 2

			if (!Number.isSafeInteger(doubled))
				break

			const doubledSolution = evaluate(doubled)

			if (!isBetter(doubledSolution, upperSolution))
				break

			upper = doubled
			upperSolution = doubledSolution
		}

		let low = 0
		let high = upper

		while (high - low > 12) {
			const third = Math.floor((high - low) / 3)
			const left = low + third
			const right = high - third
			const leftSolution = evaluate(left)
			const rightSolution = evaluate(right)

			if (compareSolutions(leftSolution, rightSolution) <= 0)
				high = right - 1
			else
				low = left + 1
		}

		let best = evaluate(low)

		for (let amount = low + 1; amount <= high; amount++) {
			const candidate = evaluate(amount)
			if (isBetter(candidate, best)) best = candidate
		}

		return best
	}

	private evaluate(recurringAmount: number): FundingSolution {
		let balance = this.account.openingBalance

		for (const entry of this.preStartEntries)
			balance += this.signedAmount(entry, recurringAmount)

		let lowestBalance = balance
		let sumEndOfDayBalance = 0
		let dayCount = 0
		let date = this.fundingOperation.schedule.startDate

		while (date <= this.fundingOperation.schedule.endDate) {
			for (const entry of this.entriesByDate.get(date.epochDay) ?? []) {
				balance += this.signedAmount(entry, recurringAmount)
				lowestBalance = Math.min(lowestBalance, balance)
			}

			sumEndOfDayBalance += balance
			dayCount++
			date = date.plusDays(1)
		}

		const signedAdjustment = this.fundingOperation.minimumBalance - lowestBalance
		const score = dayCount === 0
			? 0
			: sumEndOfDayBalance + signedAdjustment * dayCount -
				this.fundingOperation.minimumBalance * dayCount

		return {
			recurringAmount,
			signedAdjustment,
			score
		}
	}

	private signedAmount(entry: LedgerEntry, recurringAmount: number): number {
		const transaction = entry.transaction
		const amount = transaction.operation === this.fundingOperation
			? recurringAmount
			: transaction.getAmount()

		if (amount === null) {
			throw new Error(
				`Transaction for operation "${transaction.operation.name}" has an unresolved amount.`
			)
		}

		return entry.direction === "inflow" ? amount : -amount
	}
}

function isBetter(candidate: FundingSolution, current: FundingSolution): boolean {
	return compareSolutions(candidate, current) < 0
}

function compareSolutions(a: FundingSolution, b: FundingSolution): number {
	if (a.score !== b.score)
		return a.score - b.score

	const aAdjustment = Math.abs(a.signedAdjustment)
	const bAdjustment = Math.abs(b.signedAdjustment)

	if (aAdjustment !== bAdjustment)
		return aAdjustment - bAdjustment

	return a.recurringAmount - b.recurringAmount
}
