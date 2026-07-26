import Transaction from "./Transaction"

export type TransactionDirection = "inflow" | "outflow"

export default class LedgerEntry {
    public balanceAfter: number = 0
    public isCharged: boolean = false
	public direction: TransactionDirection

	constructor(public readonly transaction: Transaction, direction: TransactionDirection) {
		this.transaction = transaction
		this.direction = direction
	}
}