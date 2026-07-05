import LocalDate from "./LocalDate.js"
import Transaction from "./Transaction.js"


export default class Account {

	#balance: number
	#transactions: Transaction[]

	public constructor(initialBalance: number = 0) {
		this.#balance = initialBalance
		this.#transactions = []
	}

	public setBalance(balance: number) {
		this.#balance = balance
	}

	public getBalance() {
		return this.#balance
	}

	public getTransactions() {
		return this.sortTransactions([...this.#transactions])
	}

	public addTransaction(transaction: Transaction) {
		this.#transactions.push(transaction)
	}
	
	private sortTransactions(transactions: Transaction[]) {
		// Sort by date first and then by type, payments first
		return transactions.sort((a, b) => {
			if (a.chargeDate < b.chargeDate) return -1
			if (a.chargeDate > b.chargeDate) return 1
			if (a.operation.type < b.operation.type) return 1
			if (a.operation.type > b.operation.type) return -1
			return 0
		})
	}

	public charge(from: LocalDate, until: LocalDate) {
		this.sortTransactions([...this.#transactions]).forEach(t => {
			if (t.isCharged) return

			// Skip if transaction is outside the charging window
			if (t.chargeDate < from || t.chargeDate > until) return

			if (t.operation.isBill())
				this.#balance -= t.operation.amount
			else
				this.#balance += t.operation.amount

			t.balance = Math.round(this.#balance * 100) / 100
			t.isCharged = true
		})
	}

	public getLowestBalance(): Transaction | null {
		let result: Transaction | null = null

		this.#transactions.forEach(t => {
			if (!t.isCharged) return

			if (result === null || t.balance < result.balance)
				result = t
		})

		return result
	}

}