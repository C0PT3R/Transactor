import { LocalDate } from "@c0pt3r/local-date"

import type {
	AccountResult,
	LedgerEntryResult,
	OperationResult,
	Result,
	ModelPeriodResult,
	TransactionResult
} from "../../transactor-common"

export interface DateRange {
	readonly startDate: string
	readonly endDate: string
}


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


export default class ResultInterpreter {
	private static readonly instances = new WeakMap<Result, ResultInterpreter>()

	public static for(result: Result): ResultInterpreter {
		let interpreter = this.instances.get(result)

		if (!interpreter) {
			interpreter = new ResultInterpreter(result)
			this.instances.set(result, interpreter)
		}

		return interpreter
	}

	private readonly accountsById: ReadonlyMap<string, AccountResult>
	private readonly operationsById: ReadonlyMap<string, OperationResult>
	private readonly transactionsById: ReadonlyMap<string, TransactionResult>
	private readonly ledgerEntriesById: ReadonlyMap<string, LedgerEntryResult>

	private constructor(public readonly result: Result) {
		this.accountsById = new Map(result.accounts.map(account => [account.id, account]))
		this.operationsById = new Map(result.operations.map(operation => [operation.id, operation]))
		this.transactionsById = new Map(result.transactions.map(transaction => [transaction.id, transaction]))
		this.ledgerEntriesById = new Map(result.ledgerEntries.map(entry => [entry.id, entry]))
	}

	public getAccount(accountId: string): AccountResult {
		const account = this.accountsById.get(accountId)
		if (!account) throw new RangeError(`Unknown account id: ${accountId}`)
		return account
	}

	public getOperation(operationId: string): OperationResult {
		const operation = this.operationsById.get(operationId)
		if (!operation) throw new RangeError(`Unknown operation id: ${operationId}`)
		return operation
	}

	public getTransaction(transactionId: string): TransactionResult {
		const transaction = this.transactionsById.get(transactionId)
		if (!transaction) throw new RangeError(`Unknown transaction id: ${transactionId}`)
		return transaction
	}

	public getLedgerEntry(ledgerEntryId: string): LedgerEntryResult {
		const entry = this.ledgerEntriesById.get(ledgerEntryId)
		if (!entry) throw new RangeError(`Unknown ledger entry id: ${ledgerEntryId}`)
		return entry
	}

	public getAccountLedger(accountId: string): readonly AccountLedgerEntry[] {
		const account = this.getAccount(accountId)

		return account.ledgerEntryIds.map(id => {
			const ledgerEntry = this.getLedgerEntry(id)
			const transaction = this.getTransaction(ledgerEntry.transactionId)
			const operation = this.getOperation(transaction.operationId)
			return { account, ledgerEntry, transaction, operation }
		})
	}

	public getProjectedBalance(accountId: string, date: string): number {
		const account = this.getAccount(accountId)

		if (!this.dateDuringPeriod(date, this.result.period)) {
			throw new RangeError(
				`Date ${date} is outside the simulation period ` +
				`${this.result.period.startDate} - ${this.result.period.endDate}.`
			)
		}

		const entry = this.getAccountLedger(accountId)
			.findLast(entry => entry.transaction.chargedDate <= date)

		return entry?.ledgerEntry.balanceAfter ?? account.openingBalance
	}

	public getLowestBalanceEntry(accountId: string): AccountLedgerEntry | undefined {
		return this.getAccountLedger(accountId).reduce<AccountLedgerEntry | undefined>(
			(lowest, entry) => !lowest || entry.ledgerEntry.balanceAfter < lowest.ledgerEntry.balanceAfter
				? entry
				: lowest,
			undefined
		)
	}

	public isIncome(operation: OperationResult): boolean {
		return operation.from === undefined && operation.to !== undefined
	}

	public isExpense(operation: OperationResult): boolean {
		return operation.from !== undefined && operation.to === undefined
	}

	public getChargedOperationTotals(): readonly OperationChargedTotal[] {
		const totals = new Map<string, number>()

		for (const transaction of this.result.transactions) {
			if (!this.dateDuringPeriod(transaction.chargedDate, this.result.period))
				continue

			const operation = this.getOperation(transaction.operationId)

			if (!this.isIncome(operation) && !this.isExpense(operation))
				continue

			const entry = transaction.ledgerEntryIds
				.map(id => this.getLedgerEntry(id))
				.find(entry =>
					(this.isIncome(operation) && entry.direction === "inflow") ||
					(this.isExpense(operation) && entry.direction === "outflow")
				)

			if (!entry) continue
			totals.set(operation.id, (totals.get(operation.id) ?? 0) + entry.amount)
		}

		return Array.from(totals, ([operationId, total]) => ({
			operation: this.getOperation(operationId),
			total
		})).toSorted((a, b) =>
			a.operation.name.localeCompare(b.operation.name, "fr") ||
			a.operation.startDate.localeCompare(b.operation.startDate) ||
			a.operation.id.localeCompare(b.operation.id)
		)
	}

	public getModelPeriods(): readonly ModelPeriodResult[] {
		return this.result.modelPeriods
	}

	public getExpenseOperations(period: ModelPeriodResult): readonly OperationResult[] {
		const operationIds = new Set(period.operationIds)

		return this.result.operations
			.filter(operation => operationIds.has(operation.id))
			.filter(operation => this.isExpense(operation))
			.toSorted((a, b) => b.totals.daily - a.totals.daily)
	}

	public dateDuringPeriod(date: string, period: DateRange): boolean {
		const value = LocalDate.fromISO(date)
		const startDate = LocalDate.fromISO(period.startDate)
		const endDate = LocalDate.fromISO(period.endDate)

		return value !== null && startDate !== null && endDate !== null &&
			value.isBetween(startDate, endDate)
	}

}
