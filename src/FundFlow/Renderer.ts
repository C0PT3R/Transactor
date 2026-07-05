import Result from "./Result.js"
import Frame from "./Frame.js"
import Transaction from "./Transaction.js"
import LocalDate from "./LocalDate.js"

const monthNames = [
	"Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
	"Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]

export default class Renderer {

    constructor() {}

	public static render(result: Result, printer: printer_t) {
		for (const frame of result.frames) {
			this.renderFrameDetails(frame, printer)
		}
		this.renderTransactions(result.transactions, printer)
	}

	public static renderDateString(date: LocalDate): string {
		return `${date.getDay()} ${monthNames[date.getMonth() - 1]} ${date.getYear()}`
	}

	/**
	 * Generates an HTML string containing calculator results in the form of an HTML table.
	 * @param printer A function which receives the generated HTML string
	 */
	public static renderFrameDetails(frame: Frame, printer: printer_t) {
		// Inner formatting function
		const f = (a: number, c: boolean = false) => {
			if (c) a = (Math.ceil(a * 100) / 100)
			return a.toFixed(2)
		}

		let content = `
			<table style="margin:10px" border="1" cellspacing="0">
				<tr>
					<th width="100">${this.renderDateString(frame.startDate)}</th>
					<th width="120">Journalier</th>
					<th width="120">Hebdomadaire</th>
					<th width="120">Bi-hebdomadaire</th>
					<th width="120">Mensuel</th>
					<th width="120">Annuel</th>
				</tr>
		`

		frame.operations.toSorted((a, b) => b.daily - a.daily).forEach(bill => {
			if (bill.type !== "bill") return

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
					<td>${f(frame.billsTotals.daily)} $</td>
					<td>${f(frame.billsTotals.weekly, true)} $</td>
					<td>${f(frame.billsTotals.biWeekly)} $</td>
					<td>${f(frame.billsTotals.monthly)} $</td>
					<td>${f(frame.billsTotals.yearly)} $</td>
				</tr>
			</table>
		`

		printer(content.replace(/[\t\n\r]+/g, ''))
	}

	/**
	 * Generates an HTML string representing the transactions.
	 * @param printer A function which receives the generated HTML string
	 */
	public static renderTransactions(transactions: Transaction[], printer: printer_t) {
		let currentMonth = -1
		let month: number
		let content: string = ""

		transactions.forEach(t => {
			// Skip not charged transactions
			if (!t.isCharged) return

			month = t.chargeDate.getMonth()

			// Show month header on each new month
			if (month != currentMonth) {
				if (currentMonth !== -1) {
					content += "</table>"
				}
				currentMonth = month
				content += `
					<table style="display:inline-flex; margin:10px" border="1" cellspacing="0" cellpadding="2">
						<tr>
							<th colspan="4">${monthNames[t.chargeDate.getMonth() - 1] + " " + t.chargeDate.getYear()}</th>
						</tr>
					`
			}

			content += `
				<tr bgcolor="${t.balance < 0 ? '#F66' : 'lightgreen'}">
					<td width="20" style="text-align:center">${t.chargeDate.getDay()}</td>
					<td width="100" style="text-align:left">${t.operation.name}</td>
					<td width="75">${t.operation.isBill() ? '-' : ''}${t.operation.amount.toFixed(2)} $</td>
					<td width="75">${t.balance.toFixed(2)} $</td>
				</tr>
			`
		})

		content += `</table>`

		printer(content.replace(/[\t\n\r]+/g, ''))
	}

}