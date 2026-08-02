import { LocalDate } from "@c0pt3r/local-date"

import type {
	AccountResult,
	LedgerEntryResult,
	OperationResult,
	Result,
	TotalsResult,
	TransactionResult
} from "../../transactor-common"

export interface DateRange {
	readonly startDate: string
	readonly endDate: string
}

export interface BudgetPeriod extends DateRange {
	readonly operationIds: readonly string[]
	readonly inflow: TotalsResult
	readonly outflow: TotalsResult
	readonly net: TotalsResult
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

const zeroTotals = (): TotalsResult => ({
	daily: 0,
	weekly: 0,
	biWeekly: 0,
	monthly: 0,
	yearly: 0
})

function addTotals(left: TotalsResult, right: TotalsResult): TotalsResult {
	return {
		daily: left.daily + right.daily,
		weekly: left.weekly + right.weekly,
		biWeekly: left.biWeekly + right.biWeekly,
		monthly: left.monthly + right.monthly,
		yearly: left.yearly + right.yearly
	}
}

function subtractTotals(left: TotalsResult, right: TotalsResult): TotalsResult {
	return {
		daily: left.daily - right.daily,
		weekly: left.weekly - right.weekly,
		biWeekly: left.biWeekly - right.biWeekly,
		monthly: left.monthly - right.monthly,
		yearly: left.yearly - right.yearly
	}
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
	private budgetPeriods?: readonly BudgetPeriod[]

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

	public getBudgetPeriods(): readonly BudgetPeriod[] {
		if (this.budgetPeriods)
			return this.budgetPeriods

		const start = LocalDate.fromISO(this.result.period.startDate)
		const end = LocalDate.fromISO(this.result.period.endDate)

		if (!start || !end)
			throw new Error("The result contains an invalid simulation period.")

		const boundaries = this.collectPeriodBoundaries(start, end)

		this.budgetPeriods = boundaries.map((periodStart, index) => {
			const nextStart = boundaries[index + 1]
			const periodEnd = nextStart ? nextStart.clone().addDays(-1) : end.clone()
			const startDate = periodStart.toJSON()

			const activeOperations = this.result.operations.filter(operation =>
				operation.startDate <= startDate && operation.endDate >= startDate
			)

			const inflow = this.sumOperationTotals(activeOperations.filter(operation => this.isIncome(operation)))
			const outflow = this.sumOperationTotals(activeOperations.filter(operation => this.isExpense(operation)))

			return {
				startDate,
				endDate: periodEnd.toJSON(),
				operationIds: activeOperations.map(operation => operation.id),
				inflow,
				outflow,
				net: subtractTotals(inflow, outflow)
			}
		})

		return this.budgetPeriods
	}

	public getExpenseOperations(period: BudgetPeriod): readonly OperationResult[] {
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

	private sumOperationTotals(operations: readonly OperationResult[]): TotalsResult {
		return operations.reduce(
			(totals, operation) => addTotals(totals, operation.totals),
			zeroTotals()
		)
	}

	private collectPeriodBoundaries(simulationStart: LocalDate, simulationEnd: LocalDate): LocalDate[] {
		const boundaries = new Map<number, LocalDate>()

		const addBoundary = (date: LocalDate): void => {
			if (!date.isBetween(simulationStart, simulationEnd))
				return

			boundaries.set(date.getEpochDay(), date.clone())
		}

		addBoundary(simulationStart)

		for (const operation of this.result.operations) {
			const operationStart = LocalDate.fromISO(operation.startDate)
			const operationEnd = LocalDate.fromISO(operation.endDate)

			if (!operationStart || !operationEnd)
				throw new Error(`Operation "${operation.name}" contains an invalid active period.`)

			if (operationEnd < simulationStart || operationStart > simulationEnd)
				continue

			addBoundary(operationStart < simulationStart ? simulationStart : operationStart)

			if (operationEnd < simulationEnd)
				addBoundary(operationEnd.clone().addDays(1))
		}

		return [...boundaries.values()].toSorted((a, b) => a.getEpochDay() - b.getEpochDay())
	}
}
