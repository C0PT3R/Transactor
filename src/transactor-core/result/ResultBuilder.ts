import { LocalDate } from "@c0pt3r/local-date"
import Account from "../accounts/Account"
import LedgerEntry from "../accounts/LedgerEntry"
import Operation from "../operations/Operation"
import Transaction from "../operations/Transaction"
import IdGenerator from "../IdGenerator"
import Totals from "./Totals"
import { buildModelPeriods } from "../model/ModelPeriod"

import type {
	Result,
	OperationResult,
	AccountResult,
	TransactionResult,
	LedgerEntryResult,
	TotalsResult,
	SimulationPeriodResult,
	ModelPeriodResult
} from "../../transactor-common"

interface EntryContext {
	readonly account: Account
	readonly entry: LedgerEntry
}

interface BuildContext {
	readonly entryContexts: readonly EntryContext[]
	readonly transactionIds: ReadonlyMap<Transaction, string>
	readonly ledgerEntryIds: ReadonlyMap<LedgerEntry, string>
	readonly entriesByTransaction: ReadonlyMap<Transaction, readonly EntryContext[]>
	readonly transactionsByOperation: ReadonlyMap<Operation, readonly Transaction[]>
}

function buildTotals(totals: Totals): TotalsResult {
	return {
		daily: totals.daily,
		weekly: totals.weekly,
		biWeekly: totals.biWeekly,
		monthly: totals.monthly,
		yearly: totals.yearly
	}
}

function buildSimulationPeriod(startDate: LocalDate, endDate: LocalDate): SimulationPeriodResult {
	return {
		startDate: startDate.toJSON(),
		endDate: endDate.toJSON()
	}
}

function buildModelPeriodResults(
	startDate: LocalDate,
	endDate: LocalDate,
	operations: readonly Operation[]
): readonly ModelPeriodResult[] {
	return buildModelPeriods(startDate, endDate, operations).map(period => {
		const inflow = Totals.fromOperations(period.operations.filter(operation => operation.isIncome()))
		const outflow = Totals.fromOperations(period.operations.filter(operation => operation.isExpense()))

		return {
			startDate: period.startDate.toJSON(),
			endDate: period.endDate.toJSON(),
			dayCount: period.dayCount,
			operationIds: period.operations.map(operation => operation.id),
			inflow: buildTotals(inflow),
			outflow: buildTotals(outflow),
			net: buildTotals(inflow.subtract(outflow))
		}
	})
}

function createBuildContext(accounts: readonly Account[]): BuildContext {
	const entryContexts: EntryContext[] = []
	const transactionIds = new Map<Transaction, string>()
	const ledgerEntryIds = new Map<LedgerEntry, string>()
	const entriesByTransaction = new Map<Transaction, EntryContext[]>()
	const transactionsByOperation = new Map<Operation, Transaction[]>()

	for (const account of accounts) {
		for (const entry of account.getChargedLedgerEntries()) {
			const amount = entry.transaction.getAmount()

			// Zero-value transactions remain valid compiler state but are omitted
			// from the public result because they have no financial effect.
			if (amount === 0)
				continue

			const context = { account, entry }
			entryContexts.push(context)
			ledgerEntryIds.set(entry, IdGenerator.generate())

			const transaction = entry.transaction

			if (!transactionIds.has(transaction)) {
				transactionIds.set(transaction, IdGenerator.generate())
				const operationTransactions = transactionsByOperation.get(transaction.operation) ?? []
				operationTransactions.push(transaction)
				transactionsByOperation.set(transaction.operation, operationTransactions)
			}

			const transactionEntries = entriesByTransaction.get(transaction) ?? []
			transactionEntries.push(context)
			entriesByTransaction.set(transaction, transactionEntries)
		}
	}

	return {
		entryContexts,
		transactionIds,
		ledgerEntryIds,
		entriesByTransaction,
		transactionsByOperation
	}
}

function buildOperation(operation: Operation, context: BuildContext): OperationResult {
	const transactions = context.transactionsByOperation.get(operation) ?? []

	return {
		id: operation.id,
		name: operation.name,
		from: operation.from,
		to: operation.to,
		amount: operation.getAmount(),
		kind: operation.kind,
		origin: operation.origin,
		scheduleType: operation.getScheduleType(),
		startDate: operation.schedule.startDate.toJSON(),
		endDate: operation.schedule.endDate.toJSON(),
		transactionIds: transactions.map(transaction => requireTransactionId(context, transaction)),
		totals: buildTotals(Totals.fromOperations([operation]))
	}
}

function visibleChargedEntries(account: Account): readonly LedgerEntry[] {
	return account.getChargedLedgerEntries().filter(entry => entry.transaction.getAmount() !== 0)
}

function buildAccount(account: Account, context: BuildContext): AccountResult {
	const visibleEntries = visibleChargedEntries(account)
	const allEntries = account.getChargedLedgerEntries()

	return {
		id: account.id,
		name: account.name,
		openingBalance: account.openingBalance,
		closingBalance: allEntries.at(-1)?.balanceAfter ?? account.openingBalance,
		ledgerEntryIds: visibleEntries.map(entry => requireLedgerEntryId(context, entry))
	}
}

function buildTransaction(transaction: Transaction, context: BuildContext): TransactionResult {
	const entries = context.entriesByTransaction.get(transaction) ?? []

	return {
		id: requireTransactionId(context, transaction),
		operationId: transaction.operation.id,
		scheduledDate: transaction.scheduledDate.toJSON(),
		chargedDate: transaction.chargeDate.toJSON(),
		ledgerEntryIds: entries.map(({ entry }) => requireLedgerEntryId(context, entry))
	}
}

function buildLedgerEntry({ account, entry }: EntryContext, context: BuildContext): LedgerEntryResult {
	const amount = entry.transaction.getAmount()

	if (amount === null)
		throw new Error(`Transaction belongs to unresolved operation "${entry.transaction.operation.name}".`)

	return {
		id: requireLedgerEntryId(context, entry),
		transactionId: requireTransactionId(context, entry.transaction),
		accountId: account.id,
		amount,
		direction: entry.direction,
		balanceAfter: entry.balanceAfter
	}
}

function requireTransactionId(context: BuildContext, transaction: Transaction): string {
	const id = context.transactionIds.get(transaction)
	if (!id) throw new Error("Transaction was not registered while building the result.")
	return id
}

function requireLedgerEntryId(context: BuildContext, entry: LedgerEntry): string {
	const id = context.ledgerEntryIds.get(entry)
	if (!id) throw new Error("Ledger entry was not registered while building the result.")
	return id
}

export function build(
	startDate: LocalDate, endDate: LocalDate,
	operations: readonly Operation[], accounts: readonly Account[]
): Result {
	const context = createBuildContext(accounts)
	const transactions = Array.from(context.transactionIds.keys())

	return {
		period: buildSimulationPeriod(startDate, endDate),
		modelPeriods: buildModelPeriodResults(startDate, endDate, operations),
		accounts: accounts.map(account => buildAccount(account, context)),
		operations: operations.map(operation => buildOperation(operation, context)),
		transactions: transactions.map(transaction => buildTransaction(transaction, context)),
		ledgerEntries: context.entryContexts.map(entry => buildLedgerEntry(entry, context))
	}
}
