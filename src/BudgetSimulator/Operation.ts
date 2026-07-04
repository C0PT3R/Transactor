import BiweeklySchedule from "./schedules/BiweeklySchedule.js"
import MonthlySchedule from "./schedules/MonthlySchedule.js"
import Schedule from "./schedules/Schedule.js"
import WeeklySchedule from "./schedules/WeeklySchedule.js"
import YearlySchedule from "./schedules/YearlySchedule.js"
import SimDate from "./SimDate.js"


const yearLength = 365.25

const recurrenceRatios = {
	"daily": 1,
	"weekly": 7,
	"biWeekly": 14,
	"monthly": yearLength / 12,
	"yearly": yearLength
}


export default class Operation {

	public type: operationType_t
	public name: string
	public amount: number
	public scheduleType: scheduleType_t
	public schedule: Schedule
	public delay: number
	public skipWeekend: boolean

	public constructor(type: operationType_t, params: operation_t) {
		const day = params.schedule.day || 0
		const month = params.schedule.month || 0
		const startDate = params.schedule.startDate ? new SimDate(...params.schedule.startDate) : new SimDate(0)
		const endDate = params.schedule.endDate ? new SimDate(...params.schedule.endDate) : undefined

		this.type = type
		this.name = params.name
		this.amount = params.amount
		this.scheduleType = params.schedule.type
		this.delay = params.schedule.processingDelay || 0
		this.skipWeekend = (params.schedule.skipWeekend === false) ? false : true

		switch (params.schedule.type) {
			case "weekly":   this.schedule = new WeeklySchedule(day, startDate, endDate); break
			case "biWeekly": this.schedule = new BiweeklySchedule(day, startDate, endDate); break
			case "monthly":  this.schedule = new MonthlySchedule(day, startDate, endDate); break
			case "yearly":   this.schedule = new YearlySchedule(day, month, startDate, endDate); break
			default: throw new Error(params.schedule.type + " is an unknown schedule type")
		}
	}


	public transform(params: transform_t["params"]) {
		if (undefined !== params.amount) this.amount = params.amount
		//if (undefined !== params.day)    this.#day = params.day
		//if (undefined !== params.recurrence) this.#recurrence = params.recurrence 
	}
	

	public setAmount(v: number) {
		if (v < 0) return
		this.amount = v
	}


	public get daily() {
		return this.amount ? this.amount / recurrenceRatios[this.scheduleType] : 0
	}

	public get weekly() {
		return this.daily * recurrenceRatios["weekly"]
	}

	public get biWeekly() {
		return this.daily * recurrenceRatios["biWeekly"]
	}

	public get monthly() {
		return this.daily * recurrenceRatios["monthly"]
	}

	public get yearly() {
		return this.daily * recurrenceRatios["yearly"]
	}

}