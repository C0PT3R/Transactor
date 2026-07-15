import Operation, { OperationType } from "./Operation"
import OperationData from "./types/OperationTypes"
import LocalDate from "./LocalDate"
import Totals from "./Totals"


export default class Frame {

	public readonly operations: Operation[]
	public readonly startDate: LocalDate
	public readonly endDate: LocalDate
	public readonly paymentsTotals: Totals
	public readonly billsTotals: Totals

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

	private addOperation(type: OperationType, data: OperationData) {
		const operation = new Operation(type, data)
		this.#checkForTransforms(operation, data.transforms)
		this.operations.push(operation)
	}

	public addPayment(data: OperationData) {
		this.addOperation("payment", data)
	}

	public addBill(data: OperationData) {
		this.addOperation("bill", data)
	}

	public calculate() {
		this.paymentsTotals.reset()
		this.billsTotals.reset()

		this.operations.forEach(op => {
			const totals = (op.type === "payment") ? this.paymentsTotals : this.billsTotals
			totals.addOperation(op)
		})

		this.resolveAutoPayments()
	}

	/**
	 * Calculate payments
	 * /// TODO: Do proper calculations
	 */
	private resolveAutoPayments() {
		for (const op of this.operations) {
			if (op.type === "payment" && op.getAmount() === undefined) {
				op.setAmount(op.getAmount() ?? Math.ceil(this.billsTotals[op.schedule.type] * 100) / 100)
			}
		}
	}

}