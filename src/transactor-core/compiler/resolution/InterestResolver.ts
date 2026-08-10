import { LocalDate } from "@c0pt3r/local-date"
import Account from "../../accounts/Account"
import InterestPaymentOperation from "../../operations/InterestPaymentOperation"
import type LedgerEntry from "../../accounts/LedgerEntry"
import type { IterativeResolver, ResolutionResult } from "./IterativeResolver"
import { resolutionResult } from "./IterativeResolver"

export default class InterestResolver implements IterativeResolver {
	public readonly name: string
	private readonly entriesByDate = new Map<number, LedgerEntry[]>()

	public constructor(
		private readonly account: Account,
		private readonly interestOperation: InterestPaymentOperation,
		private readonly startDate: LocalDate,
		private readonly endDate: LocalDate
	) {
		this.name = `Interest: ${account.name}`

		for (const entry of account.getLedgerEntries()) {
			const epochDay = entry.transaction.chargeDate.epochDay
			const entries = this.entriesByDate.get(epochDay) ?? []
			entries.push(entry)
			this.entriesByDate.set(epochDay, entries)
		}
	}

	public resolve(): ResolutionResult {
		let balance = this.account.openingBalance
		let accruedInterest = 0
		let date = this.startDate
		let maxDeltaCents = 0

		while (date <= this.endDate) {
			const entries = this.entriesByDate.get(date.epochDay) ?? []
			const interestEntries = entries.filter(
				entry => entry.transaction.operation === this.interestOperation
			)

			if (interestEntries.length > 1) {
				throw new Error(
					`Interest policy for account "${this.account.name}" generated more than one ` +
					`payment on ${date.toJSON()}.`
				)
			}

			/* A payment today contains interest accrued through yesterday. */
			for (const entry of interestEntries) {
				const amount = Math.round(accruedInterest)
				maxDeltaCents = Math.max(
					maxDeltaCents,
					entry.transaction.updateResolvedAmount(amount)
				)
				balance += amount
				accruedInterest = 0
			}

			for (const entry of entries) {
				if (entry.transaction.operation === this.interestOperation) continue

				const amount = entry.transaction.getAmount()

				if (amount === null) {
					throw new Error(
						`Transaction for operation "${entry.transaction.operation.name}" has an unresolved amount.`
					)
				}

				balance += entry.direction === "inflow" ? amount : -amount
			}

			if (balance > 0)
				accruedInterest += balance * this.interestOperation.rate / date.daysInYear

			date = date.plusDays(1)
		}

		return resolutionResult(maxDeltaCents)
	}
}
