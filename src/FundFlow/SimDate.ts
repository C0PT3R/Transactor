const monthNames = [
	"Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
	"Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]


export default class SimDate {

	#date: Date

	// Epoch of the first UNIX Sunday
	static readonly #fUS = new SimDate(1970, 1, 4).#date.getTime()


	/**
	 * Creates a SimDate representing today's date
	 */
	public constructor()

	/**
	 * Creates a SimDate representing the specified date
	 * @param time The number of elapsed days since the first UNIX Sunday
	 */
	public constructor(time: number)

	/**
	 * Creates a SimDate representing the specified date
	 * @param year The year.
	 * @param month The month (1 - 12).
	 * @param day The day (optionnal). Default is 1
	 */
	public constructor(year: number, month: number, day?: number)
	
	/* Main constructor */
	public constructor(yearOrTime?: number, month?: number, day?: number) {
		if (arguments.length == 0) {
			this.#date = new Date()
			this.#date.setHours(0, 0, 0, 0)
		} else if (arguments.length == 1) {
			this.#date = new Date()
			this.setTime(yearOrTime as number)
		} else {
			month = month ? month - 1 : 0
			day = day || 1
			this.#date = new Date(yearOrTime as number, month, day, 0, 0, 0, 0)
		}
	}


	/**
	 * Sets the time of the SimDate
	 * @param time The number of elapsed days since the first UNIX Sunday.
	 * @returns Self.
	 */
	public setTime(time: number): this {
		this.#date.setTime((time * 864e5) + SimDate.#fUS)
		this.#date.setHours(0, 0, 0, 0)
		return this
	}


	/**
	 * Sets the day of month
	 * @returns Self.
	 */
	public setDay(day: number): this {
		this.#date.setDate(day)
		return this
	}


	/**
	 * Sets the month
	 * @returns Self.
	 */
	public setMonth(month: number): this {
		this.#date.setMonth(month - 1)
		return this
	}


	/**
	 * Sets the year
	 * @returns Self.
	 */
	public setYear(year: number): this {
		this.#date.setFullYear(year)
		return this
	}


	/**
	 * Sets the complete date
	 * @returns Self.
	 */
	public setDate(year: number, month: number, day: number): this {
		this.#date.setFullYear(year, month - 1, day)
		return this
	}


	/**
	 * Gets the day of week, from 0 and 6 (or 0 to 13 if bi-weekly), starting from Sunday
	 * @param biWeekly (optional) If true, uses a bi-weekly period. Defaults to false.
	 * @returns The day of the week
	 */
	public getWeekDay(biWeekly: boolean = false): number {
		return biWeekly ? this.time % 14 : this.time % 7
	}


	/**
	 * Creates a copy of the SimDate. Useful if you want to modify a date without affecting the original one.
	 * @returns A copy of self
	 */
	public duplicate(): SimDate {
		return new SimDate(this.time)
	}


	/**
	 * Checks if the SimDate is on week end.
	 * @returns true or false, depending on the SimDate
	 */
	public isWeekend(): boolean {
		return -1 != [0, 6].indexOf(this.getWeekDay())
	}


	/**
	 * Move date of numDays
	 * @param numDays Number of days (can be positive or negative)
	 * @returns Self
	 */
	public shift(numDays: number): this {
		this.#date.setDate(this.#date.getDate() + numDays)
		return this
	}


	/**
	 * Postpones a SimDate to the next business day. If the SimDate is on a business day, it doesn't change.
	 * @returns Self.
	 */
	public toNextBusinessDay(): this {
		if (this.getWeekDay() == 0) this.shift(1)
		else if (this.getWeekDay() == 6) this.shift(2)
		return this
	}


	/**
	 * The number of elapsed days since the first UNIX Sunday
	 */
	public get time(): number {
		// Result is rounded to compensate for DST
		return Math.round((this.#date.getTime() - SimDate.#fUS) / 864e5)
	}


	/**
	 * The day of month
	 */
	public get day(): number {
		return this.#date.getDate()
	}


	/**
	 * The month
	 */
	public get month(): number {
		return this.#date.getMonth() + 1
	}


	/**
	 * The month's name (in french)
	 */
	public get monthName() {
		return monthNames[this.#date.getMonth()]
	}


	/**
	 * The year
	 */
	public get year(): number {
		return this.#date.getFullYear()
	}

	/**
	 * The last day of the month
	 */
	public get lastDayOfMonth(): number {
		const d = new Date(this.year, this.month, 0)
		return d.getDate()
	}


	public valueOf(): number {
		return this.time
	}


	public toString(): string {
		return this.day + " " + monthNames[this.month - 1] + " " + this.year
	}

}