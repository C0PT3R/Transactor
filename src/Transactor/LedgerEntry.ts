import Transaction from "./Transaction"


export default class LedgerEntry {
    public balanceAfter: number = 0
    public isCharged: boolean = false

	constructor(public readonly transaction: Transaction) {
		this.transaction = transaction
	}
}