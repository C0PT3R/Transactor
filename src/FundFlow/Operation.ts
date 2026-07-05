import OperationData, { Transform } from "./types/OperationTypes.js";
import Schedule from "./schedules/Schedule.js"
import ScheduleFactory from "./schedules/ScheduleFactory.js"
import { applyBusinessDayPolicy, BusinessDayPolicy } from "./calendar/BusinessDayPolicy.js";
import { BusinessCalendar } from "./calendar/BusinessCalendar.js";
import SimDate from "./SimDate.js";

export type OperationType = "payment" | "bill"

const YEAR_DAYS = 365.25

const PERIOD_DAYS = {
	daily: 1,
	weekly: 7,
	biWeekly: 14,
	monthly: YEAR_DAYS / 12,
	yearly: YEAR_DAYS,
} as const;


export default class Operation {

	public type: OperationType
	public name: string
	public amount: number
	public schedule: Schedule

	public constructor(type: OperationType, data: OperationData) {
		this.type = type
		this.name = data.name
		this.amount = data.amount
		this.schedule = ScheduleFactory.create(data.schedule)
	}

	public transform(params: Transform["params"]) {
		if (undefined !== params.amount) this.setAmount(params.amount)
		//if (undefined !== params.day)    this.#day = params.day
		//if (undefined !== params.recurrence) this.#recurrence = params.recurrence 
	}

	public resolveTransactionDate(scheduledDate: SimDate, calendar: BusinessCalendar): SimDate {
		const adjustedDate = applyBusinessDayPolicy(
			scheduledDate,
			this.schedule.businessDayPolicy,
			calendar
		)

		adjustedDate.addDays(this.schedule.processingDelay)

		return applyBusinessDayPolicy(
			adjustedDate,
			this.schedule.businessDayPolicy,
			calendar
		)
	}

	public isPayment() {
		return this.type === "payment"
	}

	public isBill() {
		return this.type === "bill"
	}
	
	public setAmount(v: number) {
		if (v < 0) throw new Error("Amount cannot be negative")
		this.amount = v
	}

	public get daily() {
		return this.amount / PERIOD_DAYS[this.schedule.type]
	}

	public get weekly() {
		return this.daily * PERIOD_DAYS.weekly
	}

	public get biWeekly() {
		return this.daily * PERIOD_DAYS.biWeekly
	}

	public get monthly() {
		return this.daily * PERIOD_DAYS.monthly
	}

	public get yearly() {
		return this.daily * PERIOD_DAYS.yearly
	}

}