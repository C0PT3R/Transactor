import Result from "./Result"
import Scenario from "./Scenario"
import Frame from "./Frame"
import Transaction from "./Transaction"


export default class Engine {

	public static run(scenario: Scenario): Result {
		for (let i = 0; i < scenario.frames.length; i++) {
			const frame = scenario.frames[i]

			this.generateTransactions(scenario, frame, i === 0)

			for (const account of scenario.accounts) {
				account.charge(frame.startDate, frame.endDate)
			}
		}

		/// TODO: Currently refactoring. Multiple accounts supported, but UI expects only one...
		const uiAccount = scenario.getAccount("bills")

		return new Result(
			scenario.frames,
			uiAccount.getLedgerEntries(),
			uiAccount.getLowestBalance()
		)
	}

	private static generateTransactions(scenario: Scenario, frame: Frame, includePreviousTransactions: boolean): void {
		const from = frame.startDate.clone()

		if (includePreviousTransactions) {
			// Generate earlier scheduled dates whose postponed charge date
			// may fall inside the simulation.
			from.addDays(-7)
		}

		for (const operation of frame.operations) {
			for (const scheduledDate of operation.schedule.occurences(from, frame.endDate)) {
				const chargeDate = operation.resolveTransactionDate(scheduledDate.clone(), scenario.calendar)

				if (includePreviousTransactions && chargeDate < frame.startDate)
					continue

				const transaction = new Transaction(operation, scheduledDate, chargeDate)

				if (operation.from)
					scenario.getAccount(operation.from).addLedgerEntry(transaction)

				if (operation.to)
					scenario.getAccount(operation.to).addLedgerEntry(transaction)
			}
		}
	}

}