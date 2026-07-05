import { BusinessDayPolicy } from "../calendar/BusinessDayPolicy.js"
import { ScheduleType } from "../schedules/scheduleRegistry.js"


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