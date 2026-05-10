import Operation from "./Operation.js"
import OperationContainer from "./OperationContainer.js"
import SimDate from "./SimDate.js"


export default class Budget {

	public payments: OperationContainer
	public bills: OperationContainer
	public startDate: SimDate
	public endDate: SimDate


	constructor(startDate: SimDate, endDate: SimDate) {
		this.payments = new OperationContainer("Payment")
		this.bills = new OperationContainer("Bill")
		this.startDate = startDate
		this.endDate = endDate
	}


	#tranform(operation: Operation, transforms: operation_t["transforms"]) {
		if (!transforms) return

		for (const tf of transforms) {
			const tfDate = new SimDate(...tf.date)
			
			if (tfDate >= this.startDate && tfDate <= this.endDate) {
				operation.transform(tf.params)
			}
		}
	}


	public createPayment(params: operation_t) {
		const operation = this.payments.create(params)
		this.#tranform(operation, params.transforms)
		return operation
	}


	public createBill(params: operation_t) {
		const operation = this.bills.create(params)
		this.#tranform(operation, params.transforms)
		return operation
	}


	public calculate() {
		this.payments.forEach(payment => {
			this.payments.totals.daily += payment.daily
			this.payments.totals.weekly += payment.weekly
			this.payments.totals.biWeekly += payment.biWeekly
			this.payments.totals.monthly += payment.monthly
			this.payments.totals.yearly += payment.yearly
		})

		this.bills.forEach(bill => {
			this.bills.totals.daily += bill.daily
			this.bills.totals.weekly += bill.weekly
			this.bills.totals.biWeekly += bill.biWeekly
			this.bills.totals.monthly += bill.monthly
			this.bills.totals.yearly += bill.yearly
		})

		// Calculate payments
		/// TODO: Do proper calculations
		this.payments.forEach(payment => {
			if (payment.amount === undefined) {
				payment.setAmount(Math.ceil(this.bills.totals[payment.recurrence] * 100) / 100)
			}
		})
	}

}