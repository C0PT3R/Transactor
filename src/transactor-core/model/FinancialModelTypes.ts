import type { BusinessDayPolicy } from "../calendar/BusinessDayPolicy"
import type { ScheduleType } from "../../transactor-common"


export interface FinancialModelData {
	readonly options: FinancialModelOptions
	readonly accounts: readonly AccountData[]
	readonly operations: readonly OperationData[]
}

export interface FinancialModelOptions {
	readonly startDate?: DateData
	readonly endDate: DateData
}

export interface AccountData {
	readonly id?: string
	readonly name: string
	readonly openingBalance?: number
	readonly interestPolicy?: InterestPolicyData
	readonly fundingStrategies?: readonly FundingStrategyData[]
}

export interface InterestPolicyData {
	readonly rate: number
	readonly calculationPeriod?: "daily"
	readonly paymentSchedule?: Partial<ScheduleData>
}

export type FundingStrategyData = EvenPaymentsFundingStrategyData

export interface EvenPaymentsFundingStrategyData {
	readonly kind: "evenPayments"
	readonly name?: string
	readonly from?: string
	readonly schedule: ScheduleData
}

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
