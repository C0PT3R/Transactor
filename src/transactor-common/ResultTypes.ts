export type TransactionDirection = "inflow" | "outflow"

export type OperationKind = "standard" | "interestPayment" | "funding"
export type OperationOrigin = "configured" | "generated"

export type ScheduleType =
	| "daily"
	| "weekly"
	| "biWeekly"
	| "monthly"
	| "yearly"

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
 * do not change. This is derived from operation schedule boundaries and is
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
	readonly kind: OperationKind
	readonly origin: OperationOrigin
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
	readonly transactions: readonly TransactionResult[]
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
