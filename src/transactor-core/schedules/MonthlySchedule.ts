import { LocalDate } from "@c0pt3r/local-date"
import Schedule from "./Schedule"
import type { ScheduleData } from "../model/FinancialModelTypes"


export default class MonthlySchedule extends Schedule {

    private readonly day: number

    public constructor(data: ScheduleData, startDate: LocalDate, endDate: LocalDate) {
        super(data, startDate, endDate)

        if (data.day === undefined)
            throw new Error('Parameter "day" must be defined for monthly schedule')
        
        this.day = data.day
    }
    
    public matches(date: LocalDate): boolean {
        if (!this.isActive(date)) return false

        const lastDayOfMonth = date.daysInMonth

        const targetDay = this.day === -1
            ? lastDayOfMonth
            : Math.min(this.day, lastDayOfMonth)

        return date.day === targetDay
    }

    public *occurrences(from: LocalDate, to: LocalDate): Generator<LocalDate> {
        if (from > to) return

        let year = from.year
        let month = from.month

        while (
            year < to.year ||
            (year === to.year && month <= to.month)
        ) {
            const firstDayOfMonth = new LocalDate(year, month, 1)
            const lastDayOfMonth = firstDayOfMonth.daysInMonth

            const targetDay = this.day === -1
                ? lastDayOfMonth
                : Math.min(this.day, lastDayOfMonth)

            if (targetDay >= 1 && targetDay <= lastDayOfMonth) {
                const occurrence = new LocalDate(year, month, targetDay)

                if (
                    occurrence >= from &&
                    occurrence <= to &&
                    this.isActive(occurrence)
                ) {
                    yield occurrence
                }
            }

            if (month === 12) {
                month = 1
                year++
            } else {
                month++
            }
        }
    }

}