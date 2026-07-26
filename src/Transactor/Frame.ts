import { LocalDate } from "@c0pt3r/local-date"

import Operation from "./Operation"
import OperationData from "./types/OperationTypes"
import Totals from "./Totals"
import Freezable from "./Freezable"


export default class Frame extends Freezable {

	public readonly operations: Operation[]
	public readonly startDate: LocalDate
	public readonly endDate: LocalDate
	public readonly inflow: Totals
	public readonly outflow: Totals

	constructor(startDate: LocalDate, endDate: LocalDate) {
		super()
		this.operations = []
		this.inflow = new Totals()
		this.outflow = new Totals()
		this.startDate = startDate
		this.endDate = endDate
	}

	protected onFreeze() {
		for (const operation of this.operations)
			operation.freeze()

		Object.freeze(this.operations)
		Object.freeze(this.inflow)
		Object.freeze(this.outflow)
	}

	public addOperation(data: OperationData) {
		if (this.frozen)
			throw new Error("Cannot modify a frozen frame.")

		this.operations.push(new Operation(data, this.startDate, this.endDate))
	}

	public resolve() {
		if (this.frozen)
      		throw new Error("Frame has already been resolved")

		for (const op of this.operations) {
			if (op.getAmount() === undefined) continue

			if (op.isIncome()) {
				this.inflow.add(op)
			} else if (op.isExpense()) {
				this.outflow.add(op)
			}
		}

		this.resolveAutoPayments()

		this.freeze()
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