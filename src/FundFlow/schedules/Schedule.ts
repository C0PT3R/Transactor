import SimDate from "../SimDate.js"
import { ScheduleParams, ScheduleType } from "./scheduleRegistry.js"


export default abstract class Schedule {

    public type: ScheduleType
    public startDate: SimDate | undefined
    public endDate: SimDate | undefined
    public processingDelay: number
    public skipWeekend: boolean

    public constructor(scheduleParams: ScheduleParams) {
        this.type = scheduleParams.type
        this.startDate = scheduleParams.startDate ? new SimDate(...scheduleParams.startDate) : undefined
        this.endDate = scheduleParams.endDate ? new SimDate(...scheduleParams.endDate) : undefined
		this.processingDelay = scheduleParams.processingDelay ?? 0
		this.skipWeekend = scheduleParams.skipWeekend ?? true
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