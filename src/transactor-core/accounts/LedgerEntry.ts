import Transaction from "../operations/Transaction"
import type { TransactionDirection } from "../../transactor-common"


export default class LedgerEntry {

	public balanceAfter = 0
	public isCharged = false
	public readonly direction: TransactionDirection

	public constructor(public readonly transaction: Transaction, accountId: string) {
		const { from, to } = transaction.operation

		if (from != null && from === to)
			throw new Error("An operation cannot transfer to the same account.")

		if (from === accountId)
			this.direction = "outflow"
		else if (to === accountId)
			this.direction = "inflow"
		else
			throw new Error("Trying to insert a transaction into the wrong account.")
	}

}
