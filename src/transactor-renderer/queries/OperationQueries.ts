import type { BudgetPeriodResult, OperationResult } from "../../transactor-common"


export function isIncome(operation: OperationResult): boolean {
	return operation.from === undefined && operation.to !== undefined
}

export function isExpense(operation: OperationResult): boolean {
	return operation.from !== undefined && operation.to === undefined
}

export function getExpenseOperations(period: BudgetPeriodResult): readonly OperationResult[] {
	return period.operations
		.filter(isExpense)
		.toSorted((a, b) => b.totals.daily - a.totals.daily)
}
