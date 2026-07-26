import ScheduleData from "./ScheduleTypes"
import { ScheduleType } from "../schedules/scheduleRegistry"

export default interface OperationData {
	id?: string
    name: string
    amount: number | null
	from?: string
	to?: string
    schedule: ScheduleData
    transforms?: TransformData[]
}

export interface TransformData {
	date: date_t
	params: {
		amount?: number
		schedule?: ScheduleType
		day?: number
	}
}