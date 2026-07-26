import { LocalDate } from "@c0pt3r/local-date"
import Account from "../Account"
import LedgerEntry, { TransactionDirection } from "../LedgerEntry"
import Operation from "../Operation"
import Totals from "../Totals"
import type { ScheduleType } from "../schedules/scheduleRegistry"


export interface Result {
	readonly period: SimulationPeriodResult
	readonly periods: readonly BudgetPeriodResult[]
	readonly accounts: readonly AccountResult[]
}

export interface SimulationPeriodResult {
	readonly startDate: string
	readonly endDate: string
}

/**
 * Presentation-only interval during which the active compiled operations
 * do not change. This is derived from Operation schedule boundaries and is
 * not part of the simulation's domain model.
 */
export interface BudgetPeriodResult {
	readonly startDate: string
	readonly endDate: string
	readonly operations: readonly OperationResult[]
	readonly inflow: TotalsResult
	readonly outflow: TotalsResult
	readonly net: TotalsResult
}

export interface OperationResult {
	readonly id: string
	readonly name: string
	readonly from?: string
	readonly to?: string
	readonly amount: number | null
	readonly scheduleType: ScheduleType
	readonly startDate: string
	readonly endDate: string
	readonly totals: TotalsResult
}

export interface AccountResult {
	readonly id: string
	readonly name: string
	readonly openingBalance: number
	readonly closingBalance: number
	readonly ledger: readonly TransactionResult[]
}

export interface TransactionResult {
	readonly id: string
	readonly operationId: string
	readonly operationName: string
	readonly amount: number
	readonly direction: TransactionDirection
	readonly scheduledDate: string
	readonly chargedDate: string
	readonly balanceAfter: number
}

export interface TotalsResult {
	readonly daily: number
	readonly weekly: number
	readonly biWeekly: number
	readonly monthly: number
	readonly yearly: number
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
			operations: activeOperations.map(buildOperation),
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

		if (operationEnd < simulationEnd) {
			addBoundary(operationEnd.clone().addDays(1))
		}
	}

	return [...boundaries.values()].toSorted((a, b) => a.getEpochDay() - b.getEpochDay())
}

function buildOperation(operation: Operation): OperationResult {
	return {
		id: operation.id,
		name: operation.name,
		from: operation.from,
		to: operation.to,
		amount: operation.getAmount(),
		scheduleType: operation.getScheduleType(),
		startDate: operation.schedule.startDate.toJSON(),
		endDate: operation.schedule.endDate.toJSON(),
		totals: buildTotals(Totals.fromOperations([operation]))
	}
}

function buildAccount(account: Account): AccountResult {
	const entries = account.getChargedLedgerEntries()

	return {
		id: account.id,
		name: account.name,
		openingBalance: account.openingBalance,
		closingBalance: entries.at(-1)?.balanceAfter ?? account.openingBalance,
		ledger: entries.map(buildTransaction)
	}
}

function buildTransaction(entry: LedgerEntry): TransactionResult {
	const {transaction, balanceAfter} = entry
	const { operation } = transaction
	const amount = operation.getAmount()

	if (amount === null)
		throw new Error(`Transaction "${transaction.id}" belongs to unresolved operation "${operation.name}".`)

	return {
		id: transaction.id,
		operationId: operation.id,
		operationName: operation.name,
		amount,
		direction: entry.direction,
		scheduledDate: transaction.scheduledDate.toJSON(),
		chargedDate: transaction.chargeDate.toJSON(),
		balanceAfter
	}
}

export function build(startDate: LocalDate, endDate: LocalDate, operations: Operation[], accounts: Account[]): Result {
	return {
		period: buildSimulationPeriod(startDate, endDate),
		periods: buildBudgetPeriods(startDate, endDate, operations),
		accounts: accounts.map(buildAccount)
	}
}