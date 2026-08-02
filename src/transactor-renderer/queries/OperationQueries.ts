import type { BudgetPeriodResult, OperationResult, Result } from "../../transactor-common"

export function isIncome(operation: OperationResult): boolean {
	return operation.from === undefined && operation.to !== undefined
}

export function isExpense(operation: OperationResult): boolean {
	return operation.from !== undefined && operation.to === undefined
}

export function getExpenseOperations(result: Result, period: BudgetPeriodResult): readonly OperationResult[] {
	const operationIds = new Set(period.operationIds)

	return result.operations
		.filter(operation => operationIds.has(operation.id))
		.filter(isExpense)
		.toSorted((a, b) => b.totals.daily - a.totals.daily)
}
