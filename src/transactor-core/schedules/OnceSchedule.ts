import { LocalDate } from "@c0pt3r/local-date"
import Schedule from "./Schedule"
import type { ScheduleData } from "../model/FinancialModelTypes"


export default class OnceSchedule extends Schedule {

    private readonly date: LocalDate

    public constructor(data: ScheduleData, startDate: LocalDate, endDate: LocalDate) {
        super(data, startDate, endDate)

        if (!data.date)
            throw new Error('Parameter "date" must be defined for once schedule')

        this.date = LocalDate.fromISO(data.date)
    }

    public matches(date: LocalDate): boolean {
        return this.isActive(date) && date.equals(this.date)
    }

    public *occurrences(from: LocalDate, to: LocalDate): Generator<LocalDate> {
        if (
            this.date >= from &&
            this.date <= to &&
            this.isActive(this.date)
        ) {
            yield this.date
        }
    }
}
