import type { BusinessDayPolicy } from "../calendar/BusinessDayPolicy"
import type { ScheduleType } from "../../transactor-common"

export interface FinancialModelData {
	readonly options: FinancialModelOptions
	readonly accounts: readonly AccountData[]
	readonly operations: readonly OperationData[]
	readonly strategies?: readonly PlanningStrategyData[]
}

export interface FinancialModelOptions {
	readonly startDate?: DateData
	readonly endDate: DateData
}

/** Monetary configuration values are expressed in major currency units. */
export interface AccountData {
	readonly id?: string
	readonly name: string
	readonly openingBalance?: number
	readonly policies?: readonly AccountPolicyData[]

	/** @deprecated Use policies with kind "interest". */
	readonly interestPolicy?: Omit<InterestPolicyData, "kind">
}

export type AccountPolicyData = InterestPolicyData | FeePolicyData

export interface InterestPolicyData {
	readonly kind: "interest"
	readonly rate: number
	readonly calculationPeriod?: "daily"
	readonly paymentSchedule?: Partial<ScheduleData>
}

export interface FeePolicyData {
	readonly kind: "fee"
	readonly name?: string
	readonly amount: number
	readonly schedule: ScheduleData
}

export type PlanningStrategyData = EvenPaymentsStrategyData

export interface EvenPaymentsStrategyData {
	readonly kind: "evenPayments"
	readonly name?: string
	readonly target: string
	readonly from?: string
	readonly schedule: ScheduleData
}

/** Monetary configuration values are expressed in major currency units. */
export interface OperationData {
	readonly id?: string
	readonly name: string
	readonly amount: number | null
	readonly from?: string
	readonly to?: string
	readonly schedule: ScheduleData
	readonly transforms?: readonly TransformData[]
}

export interface TransformData {
	readonly date: DateData
	readonly params: {
		readonly amount?: number
		readonly schedule?: ScheduleType
		readonly day?: number
	}
}

export interface ScheduleData {
	readonly period: ScheduleType
	readonly day?: number
	readonly month?: number
	readonly year?: number
	readonly processingDelay?: number
	readonly businessDayPolicy?: BusinessDayPolicy
	readonly startDate?: DateData
	readonly endDate?: DateData
}

export type DateData = string
