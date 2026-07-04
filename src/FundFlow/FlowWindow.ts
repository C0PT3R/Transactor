import Operation from "./operation/Operation.js"
import { OperationParams, OperationType } from "./operation/operationTypes.js"
import SimDate from "./SimDate.js"
import Totals from "./Totals.js"


export default class FlowWindow {

	public operations: Operation[]
	public paymentsTotals: Totals
	public billsTotals: Totals
	public startDate: SimDate
	public endDate: SimDate

	constructor(startDate: SimDate, endDate: SimDate) {
		this.operations = []
		this.paymentsTotals = new Totals()
		this.billsTotals = new Totals()
		this.startDate = startDate
		this.endDate = endDate
	}

	#checkForTransforms(operation: Operation, transforms: OperationParams["transforms"]) {
		if (!transforms) return

		for (const tf of transforms) {
			const tfDate = new SimDate(...tf.date)
			
			if (tfDate >= this.startDate && tfDate <= this.endDate) {
				operation.transform(tf.params)
			}
		}
	}

	public addOperation(type: OperationType, params: OperationParams) {
		const operation = new Operation(type, params)
		this.#checkForTransforms(operation, params.transforms)
		this.operations.push(operation)
		return operation
	}

	public calculate() {
		this.operations.forEach(op => {
			if (op.type === "payment") {
				this.paymentsTotals.daily += op.daily
				this.paymentsTotals.weekly += op.weekly
				this.paymentsTotals.biWeekly += op.biWeekly
				this.paymentsTotals.monthly += op.monthly
				this.paymentsTotals.yearly += op.yearly
			} else {
				this.billsTotals.daily += op.daily
				this.billsTotals.weekly += op.weekly
				this.billsTotals.biWeekly += op.biWeekly
				this.billsTotals.monthly += op.monthly
				this.billsTotals.yearly += op.yearly
			}
		})

		// Calculate payments
		/// TODO: Do proper calculations
		this.operations.forEach(op => {
			if (op.type === "payment" && op.amount === undefined) {
				op.setAmount(Math.ceil(this.billsTotals[op.schedule.type] * 100) / 100)
			}
		})
	}

}