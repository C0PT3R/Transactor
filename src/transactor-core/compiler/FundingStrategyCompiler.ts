import Account from "../accounts/Account"
import FinancialModel from "../model/FinancialModel"
import { buildModelPeriods } from "../model/ModelPeriod"
import type { ModelPeriod } from "../model/ModelPeriod"
import FundingOperation from "../operations/FundingOperation"

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
