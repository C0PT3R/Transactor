import ScheduleData from "./ScheduleTypes.js"
import { ScheduleType } from "../schedules/scheduleRegistry.js"

export default interface OperationData {
    name: string
    amount: number
    schedule: ScheduleData
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