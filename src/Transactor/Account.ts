import { LocalDate } from "@c0pt3r/local-date"

import LedgerEntry, { TransactionDirection } from "./LedgerEntry"
import Transaction from "./Transaction"
import AccountData from "./types/AccountTypes"
import IdGenerator from "./IdGenerator"


export default class Account {

	public readonly id: string
	public readonly name: string
	public readonly openingBalance: number
	private readonly ledger: LedgerEntry[] = []
	private balance: number

	public constructor(data: AccountData) {
		this.id = data.id ?? IdGenerator.generate()
		this.name = data.name
		this.openingBalance = data.openingBalance ?? 0
		this.balance = this.openingBalance
	}

	public getLedgerEntries(): readonly LedgerEntry[] {
		return this.ledger.toSorted((a, b) => {
			// Sort by date first, then incoming before outgoing
			if (a.transaction.chargeDate < b.transaction.chargeDate) return -1
			if (a.transaction.chargeDate > b.transaction.chargeDate) return 1

			const aIncoming = a.transaction.operation.to === this.id
			const bIncoming = b.transaction.operation.to === this.id

			if (aIncoming !== bIncoming)
				return aIncoming ? -1 : 1

			return 0
		})
	}

	public getChargedLedgerEntries() {
		return this.getLedgerEntries().filter(entry => entry.isCharged)
	}

	public addLedgerEntry(transaction: Transaction, direction: TransactionDirection): void {
		const entry = new LedgerEntry(transaction, direction)
		this.ledger.push(entry)
	}

	public charge(from: LocalDate, until: LocalDate): void {
		for (const entry of this.getLedgerEntries()) {
			if (entry.isCharged) continue

			const transaction = entry.transaction
			const operation = transaction.operation
			const inChargingWindow = transaction.chargeDate.isBetween(from, until)

			if (!inChargingWindow) continue

			const amount = operation.getAmount()

			if (amount == null)
				throw new Error("Cannot charge a transaction with an unresolved amount.")

			if (operation.from === this.id)
				this.balance -= amount

			if (operation.to === this.id)
				this.balance += amount

			entry.balanceAfter = Math.round(this.balance * 100) / 100
			entry.isCharged = true
		}
	}

	public getLowestBalance(): LedgerEntry | null {
		let result: LedgerEntry | null = null

		for (const entry of this.ledger) {
			if (!entry.isCharged) continue

			if (result === null || entry.balanceAfter < result.balanceAfter)
				result = entry
		}

		return result
	}

}