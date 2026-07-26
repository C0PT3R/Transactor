import { LocalDate } from "@c0pt3r/local-date"

import Operation from "./Operation"
import OperationData from "./types/OperationTypes"
import Totals from "./Totals"


export default class Frame {

	public readonly operations: Operation[]
	public readonly startDate: LocalDate
	public readonly endDate: LocalDate
	public readonly inflow: Totals
	public readonly outflow: Totals

	constructor(startDate: LocalDate, endDate: LocalDate) {
		this.operations = []
		this.inflow = new Totals()
		this.outflow = new Totals()
		this.startDate = startDate
		this.endDate = endDate
	}

	public addOperation(data: OperationData) {
		this.operations.push(new Operation(data, this.startDate, this.endDate))
	}

	public resolve() {
		for (const op of this.operations) {
			if (op.getAmount() === undefined) continue

			if (op.isIncome()) {
				this.inflow.add(op)
			} else if (op.isExpense()) {
				this.outflow.add(op)
			}
		}

		this.resolveAutoPayments()
	}

	/**
	 * Calculate automatic payment amount. There can only be one automatic payment per frame.
	 */
	private resolveAutoPayments() {
		const autoPayments = this.operations.filter(
			op => op.isAutomaticPayment()
		)

		if (autoPayments.length > 1)
			throw new Error("Cannot automatically resolve more than one payment without an allocation rule.")

		const autoPayment = autoPayments[0]

		if (!autoPayment)
			return

		const period = autoPayment.getScheduleType()

		const requiredPayment = this.outflow[period] - this.inflow[period]

		autoPayment.setAmount(
			Math.ceil(Math.max(0, requiredPayment) * 100) / 100
		)

		this.inflow.add(autoPayment)
	}

}