import FinancialModel from "../model/FinancialModel"
import { build } from "../result/ResultBuilder"
import { runIterativeResolution } from "./resolution/IterativeResolver"
import { populateLedgers } from "./LedgerCompiler"
import { resolveDeterministicFunding } from "./FundingStrategyCompiler"
import { createIterativeResolvers } from "./resolution/IterativeResolverFactory"
import { validateModel } from "./ModelValidator"
import type { Result } from "../../transactor-common"

export function compile(model: FinancialModel): Result {
	populateLedgers(model)
	resolveDeterministicFunding(model)

	/* Resolve feedback-driven values such as interest and funding adjustments. */
	runIterativeResolution(createIterativeResolvers(model))

	validateModel(model)
	chargeAccounts(model)

	return build(model.startDate, model.endDate, model.operations, model.accounts)
}

function chargeAccounts(model: FinancialModel): void {
	for (const account of model.accounts)
		account.charge(model.startDate, model.endDate)
}
