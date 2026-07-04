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

}