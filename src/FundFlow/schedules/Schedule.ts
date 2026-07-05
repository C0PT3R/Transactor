import ScheduleData from "../types/ScheduleTypes.js"
import SimDate from "../SimDate.js"
import { ScheduleType } from "./scheduleRegistry.js"
import { BusinessDayPolicy } from "../calendar/BusinessDayPolicy.js"


export default abstract class Schedule {

    public type: ScheduleType
    public startDate: SimDate | undefined
    public endDate: SimDate | undefined
    public processingDelay: number
    public businessDayPolicy: BusinessDayPolicy

    public constructor(data: ScheduleData) {
        this.type = data.type
        this.startDate = data.startDate ? new SimDate(...data.startDate) : undefined
        this.endDate = data.endDate ? new SimDate(...data.endDate) : undefined
		this.processingDelay = data.processingDelay ?? 0
        this.businessDayPolicy = data.businessDayPolicy ?? "none"
    }

    public abstract matches(date: SimDate): boolean

    public isActive(date: SimDate): boolean {
        if (this.startDate && date < this.startDate) {
            return false
        }
        if (this.endDate && date > this.endDate) {
            return false
        }
        return true
    }

}