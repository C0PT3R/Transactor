import { build, type Result } from "./result/ResultBuilder"
import Scenario from "./Scenario"
import Frame from "./Frame"
import Transaction from "./Transaction"


export function run(scenario: Scenario): Result {
	for (let i = 0; i < scenario.frames.length; i++) {
		const frame = scenario.frames[i]

		generateTransactions(scenario, frame, i === 0)

		for (const account of scenario.accounts) {
			account.charge(frame.startDate, frame.endDate)
		}
	}

	return build(scenario.frames, scenario.accounts)
}

function generateTransactions(scenario: Scenario, frame: Frame, isFirstFrame: boolean): void {
	const from = frame.startDate.clone()

	if (isFirstFrame) {
		// Generate earlier scheduled dates whose postponed charge date
		// may fall inside the simulation.
		from.addDays(-7)
	}

	for (const operation of frame.operations) {
		for (const scheduledDate of operation.schedule.occurences(from, frame.endDate)) {
			const chargeDate = operation.resolveTransactionDate(scheduledDate.clone(), scenario.calendar)

			if (isFirstFrame && chargeDate < frame.startDate)
				continue

			const transaction = new Transaction(operation, scheduledDate, chargeDate)

			if (operation.from) {
				scenario.getAccount(operation.from).addLedgerEntry(transaction, "outflow")
			}

			if (operation.to) {
				scenario.getAccount(operation.to).addLedgerEntry(transaction, "inflow")
			}
		}
	}
}