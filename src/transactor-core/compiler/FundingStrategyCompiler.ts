import Account from "../accounts/Account"
import FinancialModel from "../model/FinancialModel"
import { buildModelPeriods } from "../model/ModelPeriod"
import type { ModelPeriod } from "../model/ModelPeriod"
import FundingOperation from "../operations/FundingOperation"
import { prorateAnnualAmount } from "../Annualization"

export function resolveDeterministicFunding(model: FinancialModel): void {
	const modelPeriods = buildModelPeriods(
		model.startDate,
		model.endDate,
		model.operations
	)

	for (const account of model.accounts) {
		const fundingOperations = getFundingOperations(model, account)

		assertFundingPeriodsDoNotOverlap(account, fundingOperations)

		for (const fundingOperation of fundingOperations)
			resolveEvenPaymentsFunding(account, fundingOperation, modelPeriods)
	}
}

function getFundingOperations(
	model: FinancialModel,
	account: Account
): readonly FundingOperation[] {
	return model.operations
		.filter((operation): operation is FundingOperation =>
			operation instanceof FundingOperation && operation.to === account.id
		)
		.toSorted((a, b) =>
			a.schedule.startDate.epochDay - b.schedule.startDate.epochDay
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
	modelPeriods: readonly ModelPeriod[]
): void {
	let totalRequirement = 0
	let hasCoveredDays = false

	for (const period of modelPeriods) {
		const startDate = period.startDate > fundingOperation.schedule.startDate
			? period.startDate
			: fundingOperation.schedule.startDate
		const endDate = period.endDate < fundingOperation.schedule.endDate
			? period.endDate
			: fundingOperation.schedule.endDate

		if (startDate > endDate)
			continue

		hasCoveredDays = true
		const dayCount = endDate.epochDay - startDate.epochDay + 1

		for (const operation of period.operations) {
			if (operation.isFunding() || operation.isInterestPayment())
				continue

			let requirement: number

			if (operation.schedule.type === "daily") {
				const amount = operation.getAmount() ?? 0
				requirement = amount * dayCount
			} else {
				const yearlyAmount = operation.convertTo("yearly", startDate)
				requirement = prorateAnnualAmount(yearlyAmount, startDate, endDate)
			}

			if (operation.from === account.id)
				totalRequirement += requirement
			else if (operation.to === account.id)
				totalRequirement -= requirement
		}
	}

	if (!hasCoveredDays) {
		fundingOperation.resolveAmount(0)
		return
	}

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
