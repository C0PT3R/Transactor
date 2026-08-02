import { LocalDate } from "@c0pt3r/local-date"
import Schedule from "./Schedule"
import type { ScheduleData } from "../types/FinancialModelTypes"


export default class BiweeklySchedule extends Schedule {

    private readonly day: number

    public constructor(data: ScheduleData, startDate: LocalDate, endDate: LocalDate) {
        super(data, startDate, endDate)

        if (data.day === undefined)
            throw new Error('Parameter "day" must be defined for bi-weekly schedule')
        
        this.day = data.day
    }

    public matches(date: LocalDate): boolean {
        if (!this.isActive(date)) return false
        
        return date.getEpochDay() % 14 === this.day
    }
    
    public *occurrences(from: LocalDate, to: LocalDate): Generator<LocalDate> {
        const rangeStart = (
            this.startDate && this.startDate > from
                ? this.startDate
                : from
        ).clone()

        const rangeEnd = (
            this.endDate && this.endDate < to
                ? this.endDate
                : to
        )

        if (rangeStart > rangeEnd) return

        const currentDay = (
            (rangeStart.getEpochDay() % 14) + 14
        ) % 14

        const offset = (
            (this.day - currentDay) + 14
        ) % 14

        rangeStart.addDays(offset)

        while (rangeStart <= rangeEnd) {
            yield rangeStart.clone()
            rangeStart.addDays(14)
        }
    }

}