import Account from "./Account"
import OperationContainer from "./OperationContainer"


export default class Simulation {

	#account: Account
	#periodDay: { weekly: number, biWeekly: number }


	public constructor(account: Account) {
		this.#account = account
	}


	public run(container: OperationContainer): void {
		const simDate = container.startDate
			// Copy budget.startDate because we don't want it to change
			.copy()
			// Go back seven days to make sure previous postponed transactions are not skipped
			.move(-7)

		// Loop for each day until simulation end date
		while (simDate <= container.endDate) {
			const cDate = simDate.copy()

			// Apply payments
			container.forEach(payment => {
				if (payment.period == "monthly" && payment.day == cDate.getDay()) {
					this.#account.createTransaction(payment, cDate)
				}
				else if (payment.day == cDate.getWeekDay(payment.period)) {
					this.#account.createTransaction(payment, cDate)
				}
			})

			// Apply bills
			container.bills.forEach(bill => {
				if (bill.period == "monthly") {
					const billDay = (bill.day == -1) ? cDate.lastDayOfMonth() : bill.day

					if (cDate.getDay() == billDay) {
						this.#account.createTransaction(bill, cDate)
					}
				}
				else if (bill.day == cDate.getWeekDay(bill.period)) {
					this.#account.createTransaction(bill, cDate)
				}
			})

			simDate.move(1)
		}
	}

}