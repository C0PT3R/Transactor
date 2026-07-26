import { LocalDate } from "@c0pt3r/local-date"

import ScheduleData from "../types/ScheduleTypes"
import Schedule from "./Schedule"


export default class WeeklySchedule extends Schedule {

    #day: number

    public constructor(data: ScheduleData, startDate: LocalDate, endDate: LocalDate) {
        super(data, startDate, endDate)

        if (data.day === undefined)
            throw new Error('Parameter "day" must be defined for weekly schedule')
        
        this.#day = data.day
    }

    public matches(date: LocalDate): boolean {
        if (!this.isActive(date)) return false
        
        return date.getEpochDay() % 7 === this.#day
    }

    public *occurences(from: LocalDate, to: LocalDate): Generator<LocalDate> {
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
            (rangeStart.getEpochDay() % 7) + 7
        ) % 7

        const offset = (
            (this.#day - currentDay) + 7
        ) % 7

        rangeStart.addDays(offset)

        while (rangeStart <= rangeEnd) {
            yield rangeStart.clone()
            rangeStart.addDays(7)
        }
    }

}