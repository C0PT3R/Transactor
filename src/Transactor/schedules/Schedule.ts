import { LocalDate } from "@c0pt3r/local-date"

import ScheduleData from "../types/ScheduleTypes"
import { ScheduleType } from "./scheduleRegistry"
import { BusinessDayPolicy } from "../calendar/BusinessDayPolicy"


export default abstract class Schedule {

    public readonly type: ScheduleType
    public readonly startDate: LocalDate | undefined
    public readonly endDate: LocalDate | undefined
    public readonly processingDelay: number
    public readonly businessDayPolicy: BusinessDayPolicy

    public constructor(data: ScheduleData) {
        this.type = data.type
        this.startDate = data.startDate ? new LocalDate(...data.startDate) : undefined
        this.endDate = data.endDate ? new LocalDate(...data.endDate) : undefined
		this.processingDelay = data.processingDelay ?? 0
        this.businessDayPolicy = data.businessDayPolicy ?? "none"
    }

    public abstract matches(date: LocalDate): boolean

    public abstract occurences(from: LocalDate, to: LocalDate): Generator<LocalDate>

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