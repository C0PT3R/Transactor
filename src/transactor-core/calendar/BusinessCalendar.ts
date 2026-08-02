import { LocalDate } from "@c0pt3r/local-date"


export abstract class BusinessCalendar {

	public isWeekend(date: LocalDate): boolean {
		return -1 != [6, 7].indexOf(date.dayOfWeek)
	}

    public isBusinessDay(date: LocalDate): boolean {
        return !this.isWeekend(date) && !this.isHoliday(date)
    }

    protected abstract isHoliday(date: LocalDate): boolean

}