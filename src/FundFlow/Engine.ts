import Result from "./Result"
import Scenario from "./Scenario"
import Frame from "./Frame"
import Transaction from "./Transaction"


export default class Engine {

	public static run(scenario: Scenario): Result {
		for (const frame of scenario.frames) {
			this.cast(scenario, frame)
			scenario.account.charge(frame.startDate, frame.endDate)
		}

		return new Result(
			scenario.frames,
			scenario.account.getTransactions(),
			scenario.account.getLowestBalance()
		)
	}

	private static cast(scenario: Scenario, frame: Frame): void {
		const simDate = frame.startDate
			// Copy start date because we don't want to modify the original
			.clone()
			// Go back seven days to make sure previously postponed transactions are not skipped
			.addDays(-7)

		// Loop for each day until forecast end date
		while (simDate <= frame.endDate) {
			frame.operations.forEach(operation => {
				if (!operation.schedule.matches(simDate)) return

				const scheduledDate = simDate.clone()
				const chargeDate = operation.resolveTransactionDate(scheduledDate, scenario.calendar)
				const transaction = new Transaction(operation, scheduledDate, chargeDate)

				scenario.account.addTransaction(transaction)
			})

			simDate.addDays(1)
		}
	}

}