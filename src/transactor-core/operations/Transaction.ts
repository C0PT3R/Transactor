import { LocalDate } from "@c0pt3r/local-date"
import { assertCents } from "../Money"
import Operation from "./Operation"


export default class Transaction {

	private amountOverride: number | null = null

	public constructor(
		public readonly operation: Operation,
		public readonly scheduledDate: LocalDate,
		public readonly chargeDate: LocalDate
	) { }

	public getAmount(): number | null {
		return this.amountOverride ?? this.operation.getAmount()
	}

	public resolveAmount(amount: number): void {
		if (this.amountOverride !== null)
			throw new Error(`Transaction already has a resolved amount.`)

		assertCents(amount, "Resolved transaction amount")

		if (amount < 0)
			throw new Error(`Amount for transaction cannot be negative.`)

		this.amountOverride = amount
	}

	/** Updates compiler-derived transaction state and returns the absolute change. */
	public updateResolvedAmount(amount: number): number {
		assertCents(amount, "Resolved transaction amount")

		if (amount < 0)
			throw new Error(`Amount for transaction cannot be negative.`)

		const previous = this.amountOverride ?? 0
		this.amountOverride = amount
		return Math.abs(amount - previous)
	}

}
