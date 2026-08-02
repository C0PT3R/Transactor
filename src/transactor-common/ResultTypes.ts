export type TransactionDirection = "inflow" | "outflow"

export type OperationKind =
	| "standard"
	| "interestPayment"
	| "funding"

export type OperationOrigin =
	| "configured"
	| "generated"

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
	readonly operations: readonly OperationResult[]
	readonly transactions: readonly TransactionResult[]
	readonly ledgerEntries: readonly LedgerEntryResult[]
}


export interface SimulationPeriodResult {
	readonly startDate: string
	readonly endDate: string
}


/**
 * Presentation-oriented interval during which the active compiled
 * operations do not change.
 */
export interface BudgetPeriodResult {
	readonly startDate: string
	readonly endDate: string
	readonly operationIds: readonly string[]
	readonly inflow: TotalsResult
	readonly outflow: TotalsResult
	readonly net: TotalsResult
}


export interface AccountResult {
	readonly id: string
	readonly name: string
	readonly openingBalance: number
	readonly closingBalance: number
	readonly ledgerEntryIds: readonly string[]
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
	readonly transactionIds: readonly string[]
	readonly totals: TotalsResult
}


export interface TransactionResult {
	readonly id: string
	readonly operationId: string
	readonly scheduledDate: string
	readonly chargedDate: string
	readonly ledgerEntryIds: readonly string[]
}


export interface LedgerEntryResult {
	readonly id: string
	readonly transactionId: string
	readonly accountId: string
	readonly amount: number
	readonly direction: TransactionDirection
	readonly balanceAfter: number
}


export interface TotalsResult {
	readonly daily: number
	readonly weekly: number
	readonly biWeekly: number
	readonly monthly: number
	readonly yearly: number
}