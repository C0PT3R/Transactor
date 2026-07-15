import Operation from "./Operation"
import LocalDate from "./LocalDate"


export default class Transaction {

	/** The balance in the account after the transaction is charged */ 
	public balance: number
	public isCharged: boolean

	public constructor(
		public readonly operation: Operation,
		public readonly scheduledDate: LocalDate,
		public readonly chargeDate: LocalDate
	) {
		this.balance = 0
		this.isCharged = false
	}

}