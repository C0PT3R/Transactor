import Operation from "./Operation.js"
import SimDate from "./SimDate.js"


export default class Transaction {

	public date: SimDate
	public operation: Operation
	public balance: number
	public isCharged: boolean


	public constructor(operation: Operation, date: SimDate) {
		this.date = date
		this.operation = operation
		this.balance = 0
		this.isCharged = false
	}

}