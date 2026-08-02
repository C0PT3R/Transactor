import { dateDuringPeriod } from "./DateQueries"
import { isExpense, isIncome } from "./OperationQueries"

import type {
	AccountResult,
	LedgerEntryResult,
	OperationResult,
	Result,
	TransactionResult
} from "../../transactor-common"

export interface OperationChargedTotal {
	readonly operation: OperationResult
	readonly total: number
}

export interface AccountLedgerEntry {
	readonly account: AccountResult
	readonly ledgerEntry: LedgerEntryResult
	readonly transaction: TransactionResult
	readonly operation: OperationResult
}

export function getOperation(result: Result, operationId: string): OperationResult {
	const operation = result.operations.find(operation => operation.id === operationId)
	if (!operation) throw new RangeError(`Unknown operation id: ${operationId}`)
	return operation
}

export function getTransaction(result: Result, transactionId: string): TransactionResult {
	const transaction = result.transactions.find(transaction => transaction.id === transactionId)
	if (!transaction) throw new RangeError(`Unknown transaction id: ${transactionId}`)
	return transaction
}

export function getLedgerEntry(result: Result, ledgerEntryId: string): LedgerEntryResult {
	const entry = result.ledgerEntries.find(entry => entry.id === ledgerEntryId)
	if (!entry) throw new RangeError(`Unknown ledger entry id: ${ledgerEntryId}`)
	return entry
}

export function getAccountLedger(result: Result, accountId: string): readonly AccountLedgerEntry[] {
	const account = result.accounts.find(account => account.id === accountId)
	if (!account) throw new RangeError(`Unknown account id: ${accountId}`)

	return account.ledgerEntryIds.map(id => {
		const ledgerEntry = getLedgerEntry(result, id)
		const transaction = getTransaction(result, ledgerEntry.transactionId)
		const operation = getOperation(result, transaction.operationId)
		return { account, ledgerEntry, transaction, operation }
	})
}

export function getChargedOperationTotals(result: Result): readonly OperationChargedTotal[] {
	const totals = new Map<string, number>()

	for (const transaction of result.transactions) {
		if (!dateDuringPeriod(transaction.chargedDate, result.period))
			continue

		const operation = getOperation(result, transaction.operationId)

		if (!isIncome(operation) && !isExpense(operation))
			continue

		const entry = transaction.ledgerEntryIds
			.map(id => getLedgerEntry(result, id))
			.find(entry =>
				(isIncome(operation) && entry.direction === "inflow") ||
				(isExpense(operation) && entry.direction === "outflow")
			)

		if (!entry) continue
		totals.set(operation.id, (totals.get(operation.id) ?? 0) + entry.amount)
	}

	return Array.from(totals, ([operationId, total]) => ({
		operation: getOperation(result, operationId),
		total
	})).toSorted((a, b) =>
		a.operation.name.localeCompare(b.operation.name, "fr") ||
		a.operation.startDate.localeCompare(b.operation.startDate) ||
		a.operation.id.localeCompare(b.operation.id)
	)
}
