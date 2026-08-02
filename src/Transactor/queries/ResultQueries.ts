import { dateDuringPeriod } from "./DateQueries"
import { isExpense, isIncome } from "./OperationQueries"

import type { BudgetPeriodResult, OperationResult, Result } from "../results/ResultTypes"


export interface OperationChargedTotal {
	readonly operation: OperationResult
	readonly total: number
}

function getOperationMap(periods: readonly BudgetPeriodResult[]): ReadonlyMap<string, OperationResult> {
	const operations = new Map<string, OperationResult>()

	for (const period of periods) {
		for (const operation of period.operations) {
			if (!operations.has(operation.id))
				operations.set(operation.id, operation)
		}
	}

	return operations
}

export function getChargedOperationTotals(result: Result): readonly OperationChargedTotal[] {
	const operations = getOperationMap(result.periods)
	const totals = new Map<string, number>()

	for (const account of result.accounts) {
		for (const transaction of account.transactions) {
			if (!dateDuringPeriod(transaction.chargedDate, result.period))
				continue

			const operation = operations.get(transaction.operationId)

			if (!operation || (!isIncome(operation) && !isExpense(operation)))
				continue

			totals.set(operation.id, (totals.get(operation.id) ?? 0) + transaction.amount)
		}
	}

	return Array.from(totals, ([operationId, total]) => ({
		operation: operations.get(operationId)!,
		total
	})).toSorted((a, b) =>
		a.operation.name.localeCompare(b.operation.name, "fr") ||
		a.operation.startDate.localeCompare(b.operation.startDate) ||
		a.operation.id.localeCompare(b.operation.id)
	)
}
