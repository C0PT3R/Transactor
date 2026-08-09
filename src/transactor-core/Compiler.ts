import { LocalDate } from "@c0pt3r/local-date"
import Account from "./accounts/Account"
import FinancialModel from "./model/FinancialModel"
import InterestPaymentOperation from "./operations/InterestPaymentOperation"
import FundingOperation from "./operations/FundingOperation"
import FundingAdjustmentOperation from "./operations/FundingAdjustmentOperation"
import { buildModelPeriods } from "./model/ModelPeriod"
import Operation from "./operations/Operation"
import Transaction from "./operations/Transaction"
import { build } from "./result/ResultBuilder"
import InterestResolver from "./resolution/InterestResolver"
import FundingAdjustmentResolver from "./resolution/FundingAdjustmentResolver"
import { runIterativeResolution } from "./resolution/IterativeResolver"
import type { IterativeResolver } from "./resolution/IterativeResolver"
import type { Result } from "../transactor-common"


export function compile(model: FinancialModel): Result {
	const occurrenceStart = model.startDate.plusDays(-7)

	for (const operation of model.operations) {
		populateLedgers(model, operation, occurrenceStart, model.endDate)
	}

	/* Recurring funding is deterministic and resolved once. */
	resolveFunding(model)

	/*
	 * Feedback-driven values are resolved together until no value changes by a
	 * cent. Interest depends on balances, while initial funding adjustments depend
	 * on the final minimum balance, including interest.
	 */
	runIterativeResolution(createIterativeResolvers(model))
	validateTransactions(model)

	for (const account of model.accounts) {
		account.charge(model.startDate, model.endDate)
	}

	return build(model.startDate, model.endDate, model.operations, model.accounts)
}

function populateLedgers(
	model: FinancialModel,
	operation: Operation,
	from: LocalDate,
	to: LocalDate
): void {
	for (const scheduledDate of operation.schedule.occurrences(from, to)) {
		const chargeDate = operation.resolveTransactionDate(
			scheduledDate,
			model.calendar
		)

		if (!chargeDate.isBetween(model.startDate, model.endDate))
			continue

		const transaction = new Transaction(operation, scheduledDate, chargeDate)

		if (operation.from)
			model.getAccount(operation.from).addLedgerEntry(transaction)

		if (operation.to)
			model.getAccount(operation.to).addLedgerEntry(transaction)
	}
}

function resolveFunding(model: FinancialModel): void {
	const modelPeriods = buildModelPeriods(model.startDate, model.endDate, model.operations)

	for (const account of model.accounts) {
		const fundingOperations = model.operations
			.filter((operation): operation is FundingOperation =>
				operation instanceof FundingOperation && operation.to === account.id
			)
			.toSorted((a, b) =>
				a.schedule.startDate.epochDay - b.schedule.startDate.epochDay
			)

		assertFundingPeriodsDoNotOverlap(account, fundingOperations)

		for (const fundingOperation of fundingOperations) {
			resolveEvenPaymentsFunding(account, fundingOperation, modelPeriods)

			// Iterative adjustment resolvers require a valid initial value.
			for (const adjustment of getFundingAdjustments(model, fundingOperation))
				adjustment.resolveAmount(0)
		}
	}
}

function createIterativeResolvers(model: FinancialModel): readonly IterativeResolver[] {
	const interestResolvers: IterativeResolver[] = []
	const adjustmentResolvers: IterativeResolver[] = []

	for (const account of model.accounts) {
		const interestOperations = model.operations.filter(
			(operation): operation is InterestPaymentOperation =>
				operation instanceof InterestPaymentOperation && operation.to === account.id
		)

		if (interestOperations.length > 1) {
			throw new Error(
				`Account "${account.name}" has more than one interest payment operation.`
			)
		}

		if (interestOperations.length === 1) {
			interestResolvers.push(
				new InterestResolver(account, interestOperations[0], model.startDate, model.endDate)
			)
		}

		const fundingOperations = model.operations.filter(
			(operation): operation is FundingOperation =>
				operation instanceof FundingOperation && operation.to === account.id
		)

		for (const fundingOperation of fundingOperations) {
			const adjustments = getFundingAdjustments(model, fundingOperation)

			if (adjustments.length === 0) continue

			const inflow = adjustments.find(adjustment => adjustment.adjustmentDirection === "inflow")
			const outflow = adjustments.find(adjustment => adjustment.adjustmentDirection === "outflow")

			if (!inflow || !outflow || adjustments.length !== 2) {
				throw new Error(
					`Funding operation "${fundingOperation.name}" must have exactly one ` +
					`inflow and one outflow initial adjustment operation.`
				)
			}

			adjustmentResolvers.push(
				new FundingAdjustmentResolver(account, fundingOperation, inflow, outflow)
			)
		}
	}

	/* Interest runs first so adjustment resolvers always inspect current interest. */
	return [...interestResolvers, ...adjustmentResolvers]
}

function getFundingAdjustments(
	model: FinancialModel,
	fundingOperation: FundingOperation
): readonly FundingAdjustmentOperation[] {
	return model.operations.filter(
		(operation): operation is FundingAdjustmentOperation =>
			operation instanceof FundingAdjustmentOperation &&
			operation.fundingOperation === fundingOperation
	)
}

function assertFundingPeriodsDoNotOverlap(
	account: Account,
	operations: readonly FundingOperation[]
): void {
	for (let index = 1; index < operations.length; index++) {
		const previous = operations[index - 1]
		const current = operations[index]

		if (current.schedule.startDate <= previous.schedule.endDate) {
			throw new Error(
				`Account "${account.name}" has overlapping funding strategies. ` +
				`This iteration only supports non-overlapping effective periods.`
			)
		}
	}
}

function resolveEvenPaymentsFunding(
	account: Account,
	fundingOperation: FundingOperation,
	modelPeriods: ReturnType<typeof buildModelPeriods>
): void {
	let weightedAnnualRequirement = 0
	let totalDays = 0

	for (const period of modelPeriods) {
		const startDate = period.startDate > fundingOperation.schedule.startDate
			? period.startDate
			: fundingOperation.schedule.startDate
		const endDate = period.endDate < fundingOperation.schedule.endDate
			? period.endDate
			: fundingOperation.schedule.endDate

		if (startDate > endDate)
			continue

		const dayCount = endDate.epochDay - startDate.epochDay + 1
		let annualRequirement = 0

		for (const operation of period.operations) {
			if (operation.isFunding() || operation.isInterestPayment())
				continue

			const yearlyAmount = operation.convertTo("yearly")

			if (operation.from === account.id)
				annualRequirement += yearlyAmount
			else if (operation.to === account.id)
				annualRequirement -= yearlyAmount
		}

		weightedAnnualRequirement += annualRequirement * dayCount
		totalDays += dayCount
	}

	if (totalDays === 0) {
		fundingOperation.resolveAmount(0)
		return
	}

	const averageAnnualRequirement = weightedAnnualRequirement / totalDays
	const totalRequirement = averageAnnualRequirement * totalDays / 365.25
	const fundingPaymentCount = account.getLedgerEntries().filter(
		entry => entry.transaction.operation === fundingOperation
	).length

	if (fundingPaymentCount === 0) {
		fundingOperation.resolveAmount(0)
		return
	}

	const recurringAmount = Math.max(
		0,
		Math.ceil(totalRequirement / fundingPaymentCount)
	)

	fundingOperation.resolveAmount(recurringAmount)
}

function validateTransactions(model: FinancialModel): void {
	for (const account of model.accounts) {
		for (const entry of account.getLedgerEntries()) {
			if (entry.transaction.getAmount() !== null) continue

			throw new Error(
				`Transaction for operation "${entry.transaction.operation.name}" has an unresolved amount.`
			)
		}
	}
}
