import Operation from "./Operation.js"
import LocalDate from "./LocalDate.js"


export default class Transaction {

	public operation: Operation
	public scheduledDate: LocalDate
	public chargeDate: LocalDate
	/** The balance in the account after the transaction is charged */ 
	public balance: number
	public isCharged: boolean

	public constructor(operation: Operation, scheduledDate: LocalDate, chargeDate: LocalDate) {
		this.operation = operation
		this.scheduledDate = scheduledDate
		this.chargeDate = chargeDate
		this.balance = 0
		this.isCharged = false
	}

}