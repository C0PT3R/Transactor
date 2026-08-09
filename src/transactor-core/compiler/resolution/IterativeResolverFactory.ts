import FinancialModel from "../../model/FinancialModel"
import FundingAdjustmentOperation from "../../operations/FundingAdjustmentOperation"
import FundingOperation from "../../operations/FundingOperation"
import InterestPaymentOperation from "../../operations/InterestPaymentOperation"
import FundingAdjustmentResolver from "./FundingAdjustmentResolver"
import InterestResolver from "./InterestResolver"
import type { IterativeResolver } from "./IterativeResolver"

export function createIterativeResolvers(
	model: FinancialModel
): readonly IterativeResolver[] {
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
				new InterestResolver(
					account,
					interestOperations[0],
					model.startDate,
					model.endDate
				)
			)
		}

		const fundingOperations = model.operations.filter(
			(operation): operation is FundingOperation =>
				operation instanceof FundingOperation && operation.to === account.id
		)

		for (const fundingOperation of fundingOperations) {
			const adjustments = getFundingAdjustments(model, fundingOperation)

			if (adjustments.length === 0)
				continue

			const inflow = adjustments.find(
				adjustment => adjustment.adjustmentDirection === "inflow"
			)
			const outflow = adjustments.find(
				adjustment => adjustment.adjustmentDirection === "outflow"
			)

			if (!inflow || !outflow || adjustments.length !== 2) {
				throw new Error(
					`Funding operation "${fundingOperation.name}" must have exactly one ` +
					`inflow and one outflow initial adjustment operation.`
				)
			}

			/* Iterative adjustment resolvers require valid initial values. */
			inflow.resolveAmount(0)
			outflow.resolveAmount(0)

			adjustmentResolvers.push(
				new FundingAdjustmentResolver(
					account,
					fundingOperation,
					inflow,
					outflow
				)
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
