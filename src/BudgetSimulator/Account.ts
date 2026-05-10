import Operation from "./Operation.js"
import SimDate from "./SimDate.js"
import Transaction from "./Transaction.js"


export default class Account {

	#balance: number
	#transactions: Transaction[]


	public constructor(balance: number = 0) {
		this.#balance = balance
		this.#transactions = []
	}


	public setBalance(balance: number) {
		this.#balance = balance
	}


	public getBalance() {
		return this.#balance
	}


	public getTransactions() {
		return this.#transactions
	}


	public createTransaction(operation: Operation, date: SimDate): Transaction {
		// Postpone to next business day if required...
		if (operation.skipWeekend) date.toNextBusinessDay()

		// ... and THEN add delay if specified
		date.shift(operation.delay)

		const transaction = new Transaction(operation, date)
		this.#transactions.push(transaction)
		return transaction
	}


	public charge(from: SimDate, until: SimDate) {
		this.#transactions
			// Sort by date first and then by type
			.sort((a, b) => {
				if (a.date < b.date) return -1
				if (a.date > b.date) return 1
				if (a.operation.type < b.operation.type) return 1
				if (a.operation.type > b.operation.type) return -1
				return 0
			})
			.forEach(t => {
				// Skip if transaction is not on schedule
				if (t.date < from || t.date > until) return

				switch (t.operation.type) {
					case "Payment":
						this.#balance += t.operation.amount; break
					case "Bill":
						this.#balance -= t.operation.amount; break
					default:
						return
				}

				t.balance = Math.round(this.#balance * 100) / 100
				t.isCharged = true
			})
	}


	public getLowestBalance(): Transaction {
		let result: Transaction
		let first = true

		this.#transactions.forEach(t => {
			if (!t.isCharged) return

			if (first) {
				first = false
				result = t
			}
			else {
				if (t.balance < result.balance)
					result = t
			}
		})

		return result
	}

}