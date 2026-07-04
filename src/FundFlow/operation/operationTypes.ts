import { ScheduleParams, ScheduleType } from "../schedules/scheduleRegistry.js"

export type OperationType = "payment" | "bill"

export interface OperationParams {
    name: string
    amount: number
    schedule: ScheduleParams
    transforms?: Transform[]
}

export interface Transform {
	date: date_t
	params: {
		amount?: number
		schedule?: ScheduleType
		day?: number
	}
}