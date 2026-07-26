import ScheduleData from "../types/ScheduleTypes"
import LocalDate from "../LocalDate"
import { ScheduleType } from "./scheduleRegistry"
import { BusinessDayPolicy } from "../calendar/BusinessDayPolicy"
import Freezable from "../Freezable"


export default abstract class Schedule extends Freezable {

    public readonly type: ScheduleType
    public readonly startDate: LocalDate | undefined
    public readonly endDate: LocalDate | undefined
    public readonly processingDelay: number
    public readonly businessDayPolicy: BusinessDayPolicy

    public constructor(data: ScheduleData) {
        super()
        this.type = data.type
        this.startDate = data.startDate ? new LocalDate(...data.startDate) : undefined
        this.endDate = data.endDate ? new LocalDate(...data.endDate) : undefined
		this.processingDelay = data.processingDelay ?? 0
        this.businessDayPolicy = data.businessDayPolicy ?? "none"
    }

    public abstract matches(date: LocalDate): boolean

    public abstract occurences(from: LocalDate, to: LocalDate): Generator<LocalDate>

    protected onFreeze() { }

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