import { LocalDate } from "@c0pt3r/local-date"
import Operation from "./Operation"
import IdGenerator from "./IdGenerator"


export default class Transaction {

	public readonly id: string
	private amountOverride: number | null = null

	public constructor(
		public readonly operation: Operation,
		public readonly scheduledDate: LocalDate,
		public readonly chargeDate: LocalDate
	) {
		this.id = IdGenerator.generate()
	}

	public getAmount(): number | null {
		return this.amountOverride ?? this.operation.getAmount()
	}

	public resolveAmount(amount: number): void {
		if (this.amountOverride !== null)
			throw new Error(`Transaction "${this.id}" already has a resolved amount.`)

		if (!Number.isFinite(amount) || amount < 0)
			throw new Error(`Amount for transaction "${this.id}" must be a non-negative finite number.`)

		this.amountOverride = amount
	}

}
