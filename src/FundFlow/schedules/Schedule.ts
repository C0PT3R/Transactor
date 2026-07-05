import ScheduleData from "../types/ScheduleTypes.js"
import LocalDate from "../LocalDate.js"
import { ScheduleType } from "./scheduleRegistry.js"
import { BusinessDayPolicy } from "../calendar/BusinessDayPolicy.js"


export default abstract class Schedule {

    public type: ScheduleType
    public startDate: LocalDate | undefined
    public endDate: LocalDate | undefined
    public processingDelay: number
    public businessDayPolicy: BusinessDayPolicy

    public constructor(data: ScheduleData) {
        this.type = data.type
        this.startDate = data.startDate ? new LocalDate(...data.startDate) : undefined
        this.endDate = data.endDate ? new LocalDate(...data.endDate) : undefined
		this.processingDelay = data.processingDelay ?? 0
        this.businessDayPolicy = data.businessDayPolicy ?? "none"
    }

    public abstract matches(date: LocalDate): boolean

    public isActive(date: LocalDate): boolean {
        if (this.startDate && date < this.startDate) {
            return false
        }
        if (this.endDate && date > this.endDate) {
            return false
        }
        return true
    }

}