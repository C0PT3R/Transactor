import SimDate from "../SimDate.js"
import Schedule from "./Schedule.js"


export default class WeeklySchedule extends Schedule {

	#weekday: number

	constructor(
		startDate: SimDate,
		endDate?: SimDate | null
	) {
		super(startDate, endDate)

		this.#weekday = startDate.getWeekDay(false)
	}

	public matches(date: SimDate): boolean {
		if (!this.isActive(date)) {
			return false
		}

		return date.getWeekDay(false) === this.#weekday
	}

}