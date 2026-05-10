import SimDate from "../SimDate.js"


export default abstract class Schedule {

	protected startDate: SimDate | null
	protected endDate: SimDate | null

	constructor(
		startDate?: SimDate | null,
		endDate?: SimDate | null
	) {
		this.startDate = startDate || null
		this.endDate = endDate || null
	}

	public isActive(date: SimDate): boolean {
		if (this.startDate && date < this.startDate) {
			return false
		}

		if (this.endDate && date > this.endDate) {
			return false
		}

		return true
	}

	public abstract matches(date: SimDate): boolean

}