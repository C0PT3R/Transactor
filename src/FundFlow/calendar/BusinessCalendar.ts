import SimDate from "../SimDate"


export abstract class BusinessCalendar {

	public isWeekend(date: SimDate): boolean {
		return -1 != [0, 6].indexOf(date.getWeekDay())
	}

    public isBusinessDay(date: SimDate): boolean {
        return !this.isWeekend(date) && !this.isHoliday(date)
    }

    protected abstract isHoliday(date: SimDate): boolean

}