import FlowResult from "./FlowResult.js"
import FlowContext from "./FlowContext.js"
import FlowWindow from "./FlowWindow.js"
import HTMLRenderer from "./HTMLRenderer.js"


export default class FlowEngine {

	public constructor() { }

	public run(context: FlowContext): FlowResult {
		for (const window of context.windows) {
			this.cast(context, window)
			context.account.charge(window.startDate, window.endDate)
		}

		const lowest = context.account.getLowestBalance()
		console.log(lowest.date.toString(), lowest.balance)

		return new FlowResult({
			windows: context.windows,
			transactions: context.account.getTransactions(),
			lowestBalance: context.account.getLowestBalance()
		})
	}

	/**
	 * This is the actual forecast loop.
	 */
	private cast(context: FlowContext, window: FlowWindow): void {
		const simDate = window.startDate
			// Copy start date because we don't want to modify the original
			.duplicate()
			// Go back seven days to make sure previously postponed transactions are not skipped
			.shift(-7)

		// Loop for each day until forecast end date
		while (simDate <= window.endDate) {
			window.operations.forEach(op => {
				if (op.schedule.matches(simDate)) context.account.addTransaction(op, simDate.duplicate())
			})

			simDate.shift(1)
		}
	}

}