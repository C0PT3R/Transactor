import Schedule from "./schedules/Schedule.js"
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

	#type: operationType_t
	#name: string
	#amount: number | undefined
	//#schedule: Schedule
	#recurrence: recurrence_t
	#day: number
	#month: number
	#startDate: SimDate | null
	#endDate: SimDate | null
	#delay: number
	#skipWeekend: boolean


	public constructor(type: operationType_t, params: operation_t) {
		this.#type = type
		this.#name = params.name
		this.#amount = params.amount
		//this.#schedule = params.schedule
		this.#recurrence = params.recurrence || "monthly"
		this.#day = params.day
		this.#month = params.month || 0
		this.#delay = params.delay || 0
		this.#startDate = params.startDate ? new SimDate(...params.startDate) : null
		this.#endDate = params.endDate ? new SimDate(...params.endDate) : null
		this.#skipWeekend = (params.skipWeekend === false) ? false : true
	}


	public transform(params: transform_t["params"]) {
		if (undefined !== params.amount) this.#amount = params.amount
		if (undefined !== params.day)    this.#day = params.day
		if (undefined !== params.recurrence) this.#recurrence = params.recurrence 
	}
	

	public setAmount(v: number) {
		if (v < 0) return
		this.#amount = v
	}


	public get daily() {
		return this.#amount / recurrenceRatios[this.#recurrence]
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
	
	public get type()        { return this.#type }
	public get name()        { return this.#name }
	public get amount()      { return this.#amount }
	public get recurrence()  { return this.#recurrence }
	public get day()         { return this.#day }
	public get month()       { return this.#month }
	public get delay()       { return this.#delay }
	public get startDate()   { return this.#startDate }
	public get endDate()     { return this.#endDate }
	public get skipWeekend() { return this.#skipWeekend }

}