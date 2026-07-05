import Operation, { OperationType } from "./Operation.js"
import OperationData from "./types/OperationTypes.js"
import LocalDate from "./LocalDate.js"
import Totals from "./Totals.js"


export default class Frame {

	public operations: Operation[]
	public paymentsTotals: Totals
	public billsTotals: Totals
	public startDate: LocalDate
	public endDate: LocalDate

	constructor(startDate: LocalDate, endDate: LocalDate) {
		this.operations = []
		this.paymentsTotals = new Totals()
		this.billsTotals = new Totals()
		this.startDate = startDate
		this.endDate = endDate
	}

	#checkForTransforms(operation: Operation, transforms: OperationData["transforms"]) {
		if (!transforms) return

		for (const tf of transforms) {
			const tfDate = new LocalDate(...tf.date)
			
			if (tfDate >= this.startDate && tfDate <= this.endDate) {
				operation.transform(tf.params)
			}
		}
	}

	public addOperation(type: OperationType, data: OperationData) {
		const operation = new Operation(type, data)
		this.#checkForTransforms(operation, data.transforms)
		this.operations.push(operation)
		return operation
	}

	public calculate() {
		this.paymentsTotals = new Totals()
		this.billsTotals = new Totals()

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