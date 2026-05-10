import Account from "./Account.js"
import Budget from "./Budget.js"
import SimDate from "./SimDate.js"


export default class BudgetSimulator {

	/** Used to prevent direct instantiation, even from JS runtime. */
	static #localConstruct_f: boolean = false

	readonly #account: Account
	readonly #config: config_t


	private constructor(config: config_t) {
		// Stop execution if callee is outside the class.
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
			if (billParams.startDate) {
				const opStart = new SimDate(...billParams.startDate)
				if (opStart >= simStart && opStart < simEnd) {
					transformDates.push(opStart)
				}
			}

			// Check if operation will end after today AND before simulation end
			if (billParams.endDate) {
				const opEnd = new SimDate(...billParams.endDate)
				if (opEnd >= simStart && opEnd < simEnd) {
					transformDates.push(opEnd)
				}
			}

			// Check if operation has set transformations
			if (billParams.transforms) {
				for (const tr of billParams.transforms) {
					const trDate = new SimDate(...tr.date)

					// Skip if there's already a transformation on the same day...
					if (transformDates.find(date => date === trDate)) continue

					// Add to the list if it's inside simulation schedule
					if (trDate >= simStart && trDate < simEnd)
						transformDates.push(trDate)
				}
			}
		}

		// Return list sorted by date
		return transformDates.sort((a, b) => a.time - b.time)
	}


	async #createBudgets(): Promise<Budget[]> {
		const transformDates = this.#seekTransformDates()
		const budgets = new Array<Budget>()

		for (let i = 1; i < transformDates.length; i++) {
			const budgetStart = transformDates[i - 1]
			const budgetEnd = (i == transformDates.length - 1) ? transformDates[i] : transformDates[i].copy().shift(-1)

			const budget = new Budget(budgetStart, budgetEnd)

			for (const opParams of this.#config.payments) {
				budget.createPayment(opParams)
			}

			for (const opParams of this.#config.bills) {
				


				/*
				* WARNING: EXPERIMENTAL !!!
				*/

				// Incorporate sub-budgets
				if (opParams.source) {
					const bs = await BudgetSimulator.fromFile(opParams.source)
					const r = await bs.simulate()
					opParams.amount = r[0].bills.totals[opParams.recurrence || "monthly"]
				}



				// Skip bill if it's out of budget's schedule...
				if (
					(opParams.startDate && new SimDate(...opParams.startDate) > budgetStart)
					||
					(opParams.endDate && new SimDate(...opParams.endDate) < budgetEnd)
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
			if (printer) this.#printBudget(budget, printer)
			this.#run(budget)
			this.#account.charge(budget.startDate, budget.endDate)
		}

		if (printer) {
			this.#printTransactions(printer)

			const lowest = this.#account.getLowestBalance()
			console.log(lowest.date.toString(), lowest.balance)
		}

		return budgets
	}


	#run(budget: Budget): void {
		const simDate = budget.startDate
			// Copy start date because we don't want to modify the original
			.copy()
			// Go back seven days to make sure previously postponed transactions are not skipped
			.shift(-7)

		// Loop for each day until simulation end date
		while (simDate <= budget.endDate) {
			// Apply payments
			budget.payments.forEach(payment => {
				if (payment.recurrence == "monthly" && payment.day == simDate.day) {
					this.#account.createTransaction(payment, simDate.copy())
				}
				else if (payment.startDate && payment.startDate.getWeekDay(payment.recurrence === "biWeekly") === simDate.getWeekDay(payment.recurrence === "biWeekly")) {
					this.#account.createTransaction(payment, simDate.copy())
				}
			})

			// Apply bills
			budget.bills.forEach(bill => {
				if (bill.recurrence == "monthly") {
					const billDay = (bill.day == -1) ? simDate.lastDayOfMonth : bill.day

					if (simDate.day == billDay) {
						this.#account.createTransaction(bill, simDate.copy())
					}
				}
				else if (bill.recurrence == "yearly") {
					if (bill.day == simDate.day && bill.month == simDate.month) {
						this.#account.createTransaction(bill, simDate.copy())
					}
				}
				else if (bill.startDate && bill.startDate.getWeekDay(bill.recurrence === "biWeekly") === simDate.getWeekDay(bill.recurrence === "biWeekly")) {
					this.#account.createTransaction(bill, simDate.copy())
				}
			})

			simDate.shift(1)
		}
	}


	/**
	 * Generates an HTML string containing calculator results in the form of an HTML table.
	 * @param printer A function which receives the generated HTML string
	 */
	#printBudget(budget: Budget, printer: printer_t) {
		// Inner formatting function
		const f = (a: number, c: boolean = false) => {
			if (c) a = (Math.ceil(a * 100) / 100)
			return a.toFixed(2)
		}

		let content = `
			<table style="margin:10px" border="1" cellspacing="0">
				<tr>
					<th width="100">${budget.startDate}</th>
					<th width="120">Journalier</th>
					<th width="120">Hebdomadaire</th>
					<th width="120">Bi-hebdomadaire</th>
					<th width="120">Mensuel</th>
					<th width="120">Annuel</th>
				</tr>
		`

		budget.bills.toSorted((a, b) => b.daily - a.daily).forEach(bill => {
			content += `
					<tr>
						<th>${bill.name}</th>
						<td>${f(bill.daily)} $</td>
						<td>${f(bill.weekly)} $</td>
						<td>${f(bill.biWeekly)} $</td>
						<td>${f(bill.monthly)} $</td>
						<td>${f(bill.yearly)} $</td>
					</tr>
				`
		})

		content += `
				<tr>
					<td colspan="6"></td>
				</tr>
				<tr>
					<th>Totaux</th>
					<td>${f(budget.bills.totals.daily)} $</td>
					<td>${f(budget.bills.totals.weekly, true)} $</td>
					<td>${f(budget.bills.totals.biWeekly)} $</td>
					<td>${f(budget.bills.totals.monthly)} $</td>
					<td>${f(budget.bills.totals.yearly)} $</td>
				</tr>
			</table>
		`

		printer(content.replace(/[\t\n\r]+/g, ''))
	}


	/**
	 * Generates an HTML string representing the transactions.
	 * @param printer A function which receives the generated HTML string
	 */
	#printTransactions(printer: printer_t) {
		let currentMonth = -1
		let month: number
		let content: string = ""

		this.#account.getTransactions().forEach(t => {
			// Skip not charged transactions
			if (!t.isCharged) return

			month = t.date.month

			// Show month header on each new month
			if (month != currentMonth) {
				if (currentMonth !== -1) {
					content += "</table>"
				}
				currentMonth = month
				content += `
					<table style="display:inline-flex; margin:10px" border="1" cellspacing="0" cellpadding="2">
						<tr>
							<th colspan="4">${t.date.monthName + " " + t.date.year}</th>
						</tr>
					`
			}

			content += `
				<tr bgcolor="${t.balance < 0 ? '#F66' : 'lightgreen'}">
					<td width="20" style="text-align:center">${t.date.day}</td>
					<td width="100" style="text-align:left">${t.operation.name}</td>
					<td width="75">${t.operation.type == "Bill" ? '-' : ''}${t.operation.amount.toFixed(2)} $</td>
					<td width="75">${t.balance.toFixed(2)} $</td>
				</tr>
			`
		})

		content += `</table>`

		printer(content.replace(/[\t\n\r]+/g, ''))
	}

}
