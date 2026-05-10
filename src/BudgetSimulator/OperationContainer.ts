<<<<<<< HEAD
import Operation from "./Operation.js"


class Totals {
	daily: number
	weekly: number
	biWeekly: number
	monthly: number
	yearly: number

	constructor() {
		this.daily = 0
		this.weekly = 0
		this.biWeekly = 0
		this.monthly = 0
		this.yearly = 0
	}
}

export default class OperationContainer extends Array<Operation> {

	#type: operationType_t
	public totals: Totals


	public constructor(type: operationType_t) {
		super()

		this.#type = type
		this.totals = new Totals
	}


	public override push(...operations: Operation[]): number {
		for (const operation of operations) {
			if (operation.type != this.#type)
				throw new Error("Operations in this container must be of type \"" + this.#type + "\"")
		}

		return super.push(...operations)
	}


	public create(params: operation_t): Operation {
		const operation = new Operation(this.#type, params)
		this.push(operation)
		return operation
	}

=======
import Operation from "./Operation"
import SimDate from "./SimDate"


export default class OperationContainer extends Array<Operation> {

	#type: operationType_t
	public daily: number
	public weekly: number
	public biWeekly: number
	public monthly: number
	public annual: number
	public startDate: SimDate
	public endDate: SimDate


	public constructor(type: operationType_t, startDate: SimDate, endDate: SimDate) {
		super()

		this.#type = type
		this.daily = 0
		this.weekly = 0
		this.biWeekly = 0
		this.monthly = 0
		this.annual = 0
		this.startDate = startDate
		this.endDate = endDate
	}


	public override push(...operations: Operation[]): number {
		for (const operation of operations) {
			if (operation.type != this.#type)
				throw new Error("Operations in this container must be of type \"" + this.#type + "\"")
		}

		return super.push(...operations)
	}


	public create(params: operation_t): Operation {
		const operation = new Operation(this.#type, params)

		if (params.transforms) {
			for (const tr of params.transforms) {
				if (this.startDate.getTime() == new SimDate(...tr.date).getTime()) {
					if (tr.params.amount) operation.amount = tr.params.amount
					if (tr.params.day) operation.day = tr.params.day
					if (tr.params.period) operation.period = tr.params.period
				}
			}
		}
		
		this.push(operation)
		return operation
	}


	public calculate() {
		this.forEach(payment => {
			this.daily += payment.daily
			this.weekly += payment.weekly
			this.biWeekly += payment.biWeekly
			this.monthly += payment.monthly
			this.annual += payment.annual
		})

		// Calculate payment auto-amounts
		this.forEach(payment => {
			//if (payment.amount === 0) {
			this[0].amount = Math.ceil(this[payment.period] * 100) / 100
			//}
		})
	}

>>>>>>> test
}