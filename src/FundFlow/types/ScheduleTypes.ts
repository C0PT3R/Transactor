import { BusinessDayPolicy } from "../calendar/BusinessDayPolicy"
import { ScheduleType } from "../schedules/scheduleRegistry"


export default interface ScheduleData {
	type: ScheduleType
	day?: number
	month?: number
	year?: number
	processingDelay?: number
	businessDayPolicy?: BusinessDayPolicy
	startDate?: date_t
	endDate?: date_t
}