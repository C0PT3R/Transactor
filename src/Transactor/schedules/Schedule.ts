import { LocalDate } from "@c0pt3r/local-date"
import type { BusinessDayPolicy } from "../calendar/BusinessDayPolicy"
import type { ScheduleType } from "./scheduleRegistry"
import type { ScheduleData } from "../model/FinancialModelTypes"


export default abstract class Schedule {

    public readonly type: ScheduleType
    public readonly startDate: LocalDate
    public readonly endDate: LocalDate
    public readonly processingDelay: number
    public readonly businessDayPolicy: BusinessDayPolicy

    public constructor(data: ScheduleData, startDate: LocalDate, endDate: LocalDate) {
        this.type = data.period
        this.startDate = startDate
        this.endDate = endDate
		this.processingDelay = data.processingDelay ?? 0
        this.businessDayPolicy = data.businessDayPolicy ?? "none"
    }

    public abstract matches(date: LocalDate): boolean

    public abstract occurrences(from: LocalDate, to: LocalDate): Generator<LocalDate>

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