import Operation from "./Operation.js"
import SimDate from "./SimDate.js"


export default class Transaction {

	public operation: Operation
	public scheduledDate: SimDate
	public chargeDate: SimDate
	/** The balance in the account after the transaction is charged */ 
	public balance: number
	public isCharged: boolean

	public constructor(operation: Operation, scheduledDate: SimDate, chargeDate: SimDate) {
		this.operation = operation
		this.scheduledDate = scheduledDate
		this.chargeDate = chargeDate
		this.balance = 0
		this.isCharged = false
	}

}