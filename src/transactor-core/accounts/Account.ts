import { LocalDate } from "@c0pt3r/local-date"
import LedgerEntry from "./LedgerEntry"
import Transaction from "../operations/Transaction"
import IdGenerator from "../IdGenerator"
import { currencyToCents } from "../Money"
import InterestPolicy from "./policies/InterestPolicy"
import FeePolicy from "./policies/FeePolicy"
import type Operation from "../operations/Operation"
import type { default as AccountPolicy, AccountPolicyContext } from "./policies/AccountPolicy"
import type { AccountData, AccountPolicyData, InterestPolicyData } from "../model/FinancialModelTypes"

export default class Account {

	public readonly id: string
	public readonly name: string
	public readonly openingBalance: number
	public readonly policies: readonly AccountPolicy[]
	private readonly ledger: LedgerEntry[] = []
	private balance: number

	public constructor(data: AccountData) {
		this.id = data.id ?? IdGenerator.generate()
		this.name = data.name
		this.openingBalance = currencyToCents(data.openingBalance ?? 0, `Opening balance for account "${this.name}"`)
		this.balance = this.openingBalance

		const legacyInterestPolicy: InterestPolicyData[] = data.interestPolicy
			? [{ kind: "interest", ...data.interestPolicy }]
			: []

		this.policies = [
			...(data.policies ?? []),
			...legacyInterestPolicy
		].map(createAccountPolicy)
	}

	public generatePolicyOperations(context: AccountPolicyContext): readonly Operation[] {
		return this.policies.flatMap(policy => policy.generateOperations(this, context))
	}

	public getLedgerEntries(): readonly LedgerEntry[] {
		return this.ledger.toSorted((a, b) => {
			if (a.transaction.chargeDate < b.transaction.chargeDate) return -1
			if (a.transaction.chargeDate > b.transaction.chargeDate) return 1

			/*
			 * Interest paid today represents accrual through yesterday and must be
			 * applied before any other transaction charged today.
			 */
			const aInterest = a.transaction.operation.isInterestPayment()
			const bInterest = b.transaction.operation.isInterestPayment()
			if (aInterest !== bInterest) return aInterest ? -1 : 1

			// For all other same-day entries, incoming transactions precede outgoing ones.
			const aIncoming = a.transaction.operation.to === this.id
			const bIncoming = b.transaction.operation.to === this.id

			if (aIncoming !== bIncoming)
				return aIncoming ? -1 : 1

			return 0
		})
	}

	public getChargedLedgerEntries(): readonly LedgerEntry[] {
		return this.getLedgerEntries().filter(entry => entry.isCharged)
	}

	public addLedgerEntry(transaction: Transaction): void {
		this.ledger.push(new LedgerEntry(transaction, this.id))
	}

	public charge(from: LocalDate, until: LocalDate): void {
		for (const entry of this.getLedgerEntries()) {
			if (entry.isCharged) continue

			const transaction = entry.transaction
			const inChargingWindow = transaction.chargeDate.isBetween(from, until)

			if (!inChargingWindow) continue

			const amount = transaction.getAmount()

			if (amount == null)
				throw new Error("Cannot charge a transaction with an unresolved amount.")

			switch (entry.direction) {
				case "inflow":
					this.balance += amount
					break

				case "outflow":
					this.balance -= amount
					break
			}

			entry.balanceAfter = this.balance
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

function createAccountPolicy(data: AccountPolicyData): AccountPolicy {
	switch (data.kind) {
		case "interest":
			return new InterestPolicy(data)
		case "fee":
			return new FeePolicy(data)
	}
}
