import { LocalDate } from "@c0pt3r/local-date"
import Schedule from "./Schedule"
import type { ScheduleData } from "../model/FinancialModelTypes"


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
        
        return floorMod(date.epochDay - 3, 14) === this.day
    }
    
    public *occurrences(from: LocalDate, to: LocalDate): Generator<LocalDate> {
        let rangeStart = (
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

        const currentDay = floorMod(rangeStart.epochDay - 3, 14)

        const offset = (
            (this.day - currentDay) + 14
        ) % 14

        rangeStart = rangeStart.plusDays(offset)

        while (rangeStart <= rangeEnd) {
            yield rangeStart
            rangeStart = rangeStart.plusDays(14)
        }
    }

}

function floorMod(value: number, divisor: number): number {
    return ((value % divisor) + divisor) % divisor
}
