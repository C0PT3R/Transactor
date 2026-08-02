import { LocalDate } from "@c0pt3r/local-date"
import Account from "../accounts/Account"
import LedgerEntry from "../accounts/LedgerEntry"
import Operation from "../operations/Operation"
import Transaction from "../operations/Transaction"
import IdGenerator from "../IdGenerator"
import Totals from "./Totals"

import type {
	Result,
	BudgetPeriodResult,
	OperationResult,
	AccountResult,
	TransactionResult,
	LedgerEntryResult,
	TotalsResult,
	SimulationPeriodResult
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

function createBuildContext(accounts: readonly Account[]): BuildContext {
	const entryContexts: EntryContext[] = []
	const transactionIds = new Map<Transaction, string>()
	const ledgerEntryIds = new Map<LedgerEntry, string>()
	const entriesByTransaction = new Map<Transaction, EntryContext[]>()
	const transactionsByOperation = new Map<Operation, Transaction[]>()

	for (const account of accounts) {
		for (const entry of account.getChargedLedgerEntries()) {
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

function buildAccount(account: Account, context: BuildContext): AccountResult {
	const entries = account.getChargedLedgerEntries()

	return {
		id: account.id,
		name: account.name,
		openingBalance: account.openingBalance,
		closingBalance: entries.at(-1)?.balanceAfter ?? account.openingBalance,
		ledgerEntryIds: entries.map(entry => requireLedgerEntryId(context, entry))
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
		periods: buildBudgetPeriods(startDate, endDate, operations),
		accounts: accounts.map(account => buildAccount(account, context)),
		operations: operations.map(operation => buildOperation(operation, context)),
		transactions: transactions.map(transaction => buildTransaction(transaction, context)),
		ledgerEntries: context.entryContexts.map(entry => buildLedgerEntry(entry, context))
	}
}

function buildBudgetPeriods(simulationStart: LocalDate, simulationEnd: LocalDate, operations: readonly Operation[]): BudgetPeriodResult[] {
	const boundaries = collectPeriodBoundaries(simulationStart, simulationEnd, operations)

	return boundaries.map((periodStart, index) => {
		const nextStart = boundaries[index + 1]
		const periodEnd = nextStart ? nextStart.clone().addDays(-1) : simulationEnd.clone()

		const activeOperations = operations.filter(operation =>
			operation.schedule.startDate <= periodStart &&
			operation.schedule.endDate >= periodStart
		)

		const inflow = Totals.fromOperations(
			activeOperations.filter(operation => operation.isIncome())
		)

		const outflow = Totals.fromOperations(
			activeOperations.filter(operation => operation.isExpense())
		)

		return {
			startDate: periodStart.toJSON(),
			endDate: periodEnd.toJSON(),
			operationIds: activeOperations.map(operation => operation.id),
			inflow: buildTotals(inflow),
			outflow: buildTotals(outflow),
			net: buildTotals(inflow.subtract(outflow))
		}
	})
}

function collectPeriodBoundaries(simulationStart: LocalDate, simulationEnd: LocalDate, operations: readonly Operation[]): LocalDate[] {
	const boundaries = new Map<number, LocalDate>()

	const addBoundary = (date: LocalDate): void => {
		if (!date.isBetween(simulationStart, simulationEnd))
			return

		boundaries.set(date.getEpochDay(), date.clone())
	}

	addBoundary(simulationStart)

	for (const operation of operations) {
		const operationStart = operation.schedule.startDate
		const operationEnd = operation.schedule.endDate

		if (operationEnd < simulationStart || operationStart > simulationEnd)
			continue

		addBoundary((operationStart < simulationStart) ? simulationStart : operationStart)

		if (operationEnd < simulationEnd)
			addBoundary(operationEnd.clone().addDays(1))
	}

	return [...boundaries.values()].toSorted((a, b) => a.getEpochDay() - b.getEpochDay())
}
