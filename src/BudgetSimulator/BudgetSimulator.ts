/**
 * 
 * A small event-sourced cash-flow engine, where operations can have independent frequencies, start/end dates,
 * and future parameter changes.
 * 
 */

import Account from "./Account.js"
import Budget from "./Budget.js"
import HTMLRenderer from "./HTMLRenderer.js"
import SimDate from "./SimDate.js"


export default class BudgetSimulator {

	/** Used to prevent direct instantiation, even from JS runtime. */
	static #localConstruct_f: boolean = false

	readonly #account: Account
	readonly #config: config_t


	private constructor(config: config_t) {
		// Prevent execution if callee is external.
		if (!BudgetSimulator.#localConstruct_f)
			throw new Error("Constructor is private. Use \"BudgetSimulator.fromFile(...)\" instead.")

		BudgetSimulator.#localConstruct_f = false

		this.#account = new Account(config.options.initialBalance)
		this.#config = config
	}


	public static async fromFile(path: string): Promise<BudgetSimulator> {
		BudgetSimulator.#localConstruct_f = true

		const response = await fetch(path)
		const config: config_t = await response.json()

		// TODO: Config validation...

		return new this(config)
	}


	/**
	 * Seeks the dates on when changes will occur during simulation
	 * @returns A sorted array of dates
	 */
	#seekTransformDates(): SimDate[] {
		const transformDates = new Array<SimDate>()
		const simStart = new SimDate().shift(1) // Start simulation tomorrow
		const simEnd = new SimDate(...this.#config.options.endDate)

		transformDates.push(simStart, simEnd) // Add simulation start and end dates

		for (const billParams of this.#config.bills) {
			// Check if operation will start after today AND before simulation end
			if (billParams.schedule.startDate) {
				const opStart = new SimDate(...billParams.schedule.startDate)
				if (opStart >= simStart && opStart < simEnd) {
					transformDates.push(opStart)
				}
			}

			// Check if operation will end after today AND before simulation end
			if (billParams.schedule.endDate) {
				const opEnd = new SimDate(...billParams.schedule.endDate)
				if (opEnd >= simStart && opEnd < simEnd) {
					transformDates.push(opEnd)
				}
			}

			// Check if operation has set transformations
			if (billParams.transforms) {
				for (const tr of billParams.transforms) {
					const trDate = new SimDate(...tr.date)

					// Add to the list if it's inside simulation schedule
					if (trDate >= simStart && trDate < simEnd)
						transformDates.push(trDate)
				}
			}
		}

		const uniqueDates = [...new Map(
			transformDates.map(date => [date.time, date])
		).values()]

		// Return list sorted by date
		return uniqueDates.sort((a, b) => a.time - b.time)
	}


	async #createBudgets(): Promise<Budget[]> {
		const transformDates = this.#seekTransformDates()
		const budgets = new Array<Budget>()

		for (let i = 1; i < transformDates.length; i++) {
			const budgetStart = transformDates[i - 1]
			const budgetEnd = (i == transformDates.length - 1) ? transformDates[i] : transformDates[i].duplicate().shift(-1)

			const budget = new Budget(budgetStart, budgetEnd)

			for (const opParams of this.#config.payments) {
				budget.createPayment(opParams)
			}

			for (const opParams of this.#config.bills) {
				// Skip bill if it's out of budget's schedule...
				if (
					(opParams.schedule.startDate && new SimDate(...opParams.schedule.startDate) > budgetStart)
					||
					(opParams.schedule.endDate && new SimDate(...opParams.schedule.endDate) < budgetEnd)
				) continue

				// ... or else add bill to budget
				budget.createBill(opParams)
			}

			budget.calculate()

			budgets.push(budget)
		}

		return budgets
	}


	public async simulate(printer: printer_t | null = null): Promise<Budget[]> {
		const budgets = await this.#createBudgets()
		for (const budget of budgets) {
			if (printer) HTMLRenderer.printBudget(budget, printer)
			this.#run(budget)
			this.#account.charge(budget.startDate, budget.endDate)
		}

		if (printer) {
			HTMLRenderer.printTransactions(this.#account, printer)

			const lowest = this.#account.getLowestBalance()
			console.log(lowest.date.toString(), lowest.balance)
		}

		return budgets
	}


	/**
	 * This is the actual simulation loop.
	 */
	#run(budget: Budget): void {
		const simDate = budget.startDate
			// Copy start date because we don't want to modify the original
			.duplicate()
			// Go back seven days to make sure previously postponed transactions are not skipped
			.shift(-7)

		// Loop for each day until simulation end date
		while (simDate <= budget.endDate) {
			// Apply payments
			budget.payments.forEach(payment => {
				if (payment.schedule.matches(simDate)) this.#account.addTransaction(payment, simDate.duplicate())
			})

			// Apply bills
			budget.bills.forEach(bill => {
				if (bill.schedule.matches(simDate)) this.#account.addTransaction(bill, simDate.duplicate())
			})

			simDate.shift(1)
		}
	}

}
