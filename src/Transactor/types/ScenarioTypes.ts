import { BusinessDayPolicy } from "../calendar/BusinessDayPolicy"
import { ScheduleType } from "../schedules/scheduleRegistry"


export interface ScenarioData {
    readonly options: ScenarioOptions
    readonly accounts: readonly AccountData[]
    readonly operations: readonly OperationData[]
}

export interface ScenarioOptions {
    readonly startDate?: date_t
    readonly endDate: date_t
}

export interface AccountData {
    readonly id?: string
    readonly name: string
    readonly openingBalance?: number
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
	readonly date: date_t
	readonly params: {
		readonly amount?: number
		readonly schedule?: ScheduleType
		readonly day?: number
	}
}

export interface ScheduleData {
	readonly type: ScheduleType
	readonly day?: number
	readonly month?: number
	readonly year?: number
	readonly processingDelay?: number
	readonly businessDayPolicy?: BusinessDayPolicy
	readonly startDate?: date_t
	readonly endDate?: date_t
}