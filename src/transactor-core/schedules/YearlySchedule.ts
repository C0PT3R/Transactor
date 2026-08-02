import { LocalDate } from "@c0pt3r/local-date"
import Schedule from "./Schedule"
import type { ScheduleData } from "../model/FinancialModelTypes"


export default class YearlySchedule extends Schedule {

    private readonly day: number
    private readonly month: number

    public constructor(data: ScheduleData, startDate: LocalDate, endDate: LocalDate) {
        super(data, startDate, endDate)

        if (data.day === undefined || data.month === undefined)
            throw new Error('Parameters "day" and "month" must both be defined for yearly schedule')
        
        this.day = data.day
        this.month = data.month
    }

    public matches(date: LocalDate): boolean {
        if (!this.isActive(date)) return false
        
        return (date.getMonth() === this.month && date.getDay() === this.day)
    }
    
    public *occurrences(from: LocalDate, to: LocalDate): Generator<LocalDate> {
        const rangeStart = (
            this.startDate && this.startDate > from
                ? this.startDate
                : from
        )

        const rangeEnd = (
            this.endDate && this.endDate < to
                ? this.endDate
                : to
        )

        if (rangeStart > rangeEnd) return

        for (let year = rangeStart.getYear(); year <= rangeEnd.getYear(); year++) {
            const month = new LocalDate(year, this.month)
            const lastDayOfMonth = month.getLastDayOfMonth()

            const targetDay = this.day === -1
                ? lastDayOfMonth
                : Math.min(this.day, lastDayOfMonth)

            const occurrence = new LocalDate(year, this.month, targetDay)

            if (occurrence >= rangeStart && occurrence <= rangeEnd)
                yield occurrence
        }
    }

}