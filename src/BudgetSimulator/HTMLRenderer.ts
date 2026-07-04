import Account from "./Account"
import Budget from "./Budget"


export default class HTMLRenderer {

    constructor() {}

    
	/**
	 * Generates an HTML string containing calculator results in the form of an HTML table.
	 * @param printer A function which receives the generated HTML string
	 */
	public static printBudget(budget: Budget, printer: printer_t) {
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
	public static printTransactions(account: Account, printer: printer_t) {
		let currentMonth = -1
		let month: number
		let content: string = ""

		account.getTransactions().forEach(t => {
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