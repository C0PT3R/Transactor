import { LocalDate } from "@c0pt3r/local-date"
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