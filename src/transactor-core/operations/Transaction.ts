import { LocalDate } from "@c0pt3r/local-date"
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

		if (!Number.isFinite(amount) || amount < 0)
			throw new Error(`Amount for transaction must be a non-negative finite number.`)

		this.amountOverride = amount
	}

}
