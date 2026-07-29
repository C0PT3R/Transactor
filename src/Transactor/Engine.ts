import { LocalDate } from "@c0pt3r/local-date"
import Account from "./Account"
import Operation from "./Operation"
import Scenario from "./Scenario"
import Transaction from "./Transaction"
import { build } from "./ResultBuilder"
import type { Result } from "./types/ResultTypes"


export function run(scenario: Scenario): Result {
	const occurrenceStart = scenario.startDate.clone().addDays(-7)

	for (const operation of scenario.operations) {
		populateLedgers(scenario, operation, occurrenceStart, scenario.endDate)
	}

	resolveAutoPayments(scenario)

	for (const account of scenario.accounts) {
		account.charge(scenario.startDate, scenario.endDate)
	}

	return build(scenario.startDate, scenario.endDate, scenario.operations, scenario.accounts)
}

function populateLedgers(scenario: Scenario, operation: Operation, from: LocalDate, to: LocalDate): void {
	for (const scheduledDate of operation.schedule.occurrences(from, to)) {
		const chargeDate = operation.resolveTransactionDate(scheduledDate.clone(), scenario.calendar)

		if (!chargeDate.isBetween(scenario.startDate, scenario.endDate))
			continue

		const transaction = new Transaction(operation, scheduledDate, chargeDate)

		if (operation.from) {
			scenario.getAccount(operation.from).addLedgerEntry(transaction)
		}

		if (operation.to) {
			scenario.getAccount(operation.to).addLedgerEntry(transaction)
		}
	}
}

function resolveAutoPayments(scenario: Scenario): void {
	for (const account of scenario.accounts) {
		const automaticPayments = scenario.operations.filter(operation =>
			operation.isAutomaticPayment() && operation.to === account.id
		)

		if (automaticPayments.length === 0) continue

		if (automaticPayments.length > 1) {
			throw new Error(
				`Account "${account.name}" has more than one automatic payment operation.`
			)
		}

		resolveAutoPayment(account, automaticPayments[0])
	}
}

function resolveAutoPayment(account: Account, automaticPayment: Operation): void {
	let balanceWithoutAutoPayments = account.openingBalance
	let automaticPaymentCount = 0
	let requiredAmount = 0

	for (const entry of account.getLedgerEntries()) {
		const operation = entry.transaction.operation

		if (operation === automaticPayment) {
			automaticPaymentCount++
		} else {
			const amount = operation.getAmount()

			if (amount === null) {
				throw new Error(
					`Operation "${operation.name}" has an unresolved amount.`
				)
			}

			balanceWithoutAutoPayments += entry.direction === "inflow"
				? amount
				: -amount
		}

		if (balanceWithoutAutoPayments >= 0) continue

		if (automaticPaymentCount === 0) {
			throw new Error(
				`Account "${account.name}" becomes negative before its first automatic payment.`
			)
		}

		requiredAmount = Math.max(
			requiredAmount,
			-balanceWithoutAutoPayments / automaticPaymentCount
		)
	}

	automaticPayment.resolveAmount(Math.ceil(requiredAmount * 100) / 100)
}