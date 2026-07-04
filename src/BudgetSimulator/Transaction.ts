import Operation from "./Operation.js"
import SimDate from "./SimDate.js"


export default class Transaction {

	public operation: Operation
	public date: SimDate
	/** The balance in the account after the transaction is charged */ 
	public balance: number
	public isCharged: boolean


	public constructor(operation: Operation, date: SimDate) {
		this.operation = operation
		this.date = date
		this.balance = 0
		this.isCharged = false
	}

}