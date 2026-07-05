import Result from "./Result.js"
import Frame from "./Frame.js"
import Transaction from "./Transaction.js"
import LocalDate from "./LocalDate.js"

const monthNames = [
	"Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
	"Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]

type FrameOperationView = {
	name: string
	daily: number
	weekly: number
	biWeekly: number
	monthly: number
	yearly: number
}

export default class Renderer {

	constructor() {}

	public static render(result: Result, printer: printer_t) {
		for (const frame of result.frames) {
			this.renderFrameDetails(frame, printer)
		}

		this.renderTransactions(result.transactions, printer)
	}

	public static renderDateString(date: LocalDate): string {
		return `${date.getDay()} ${this.renderMonthName(date)} ${date.getYear()}`
	}

	/**
	 * Generates an HTML string containing calculator results in the form of an HTML table.
	 * @param printer A function which receives the generated HTML string
	 */
	public static renderFrameDetails(frame: Frame, printer: printer_t) {
		printer(this.renderFrameDetailsTable(frame))
	}

	/**
	 * Generates an HTML string representing the transactions.
	 * @param printer A function which receives the generated HTML string
	 */
	public static renderTransactions(transactions: Transaction[], printer: printer_t) {
		printer(this.renderTransactionTables(transactions))
	}

	private static renderFrameDetailsTable(frame: Frame): string {
		const billRows = frame.operations
			.toSorted((a, b) => b.daily - a.daily)
			.filter(operation => operation.type === "bill")
			.map(operation => this.renderFrameOperationRow(operation))

		return this.html(`
			<table style="margin:10px" border="1" cellspacing="0">
				${this.renderFrameHeaderRow(frame)}
				${billRows.join("")}
				${this.renderFrameTotalsRow(frame)}
			</table>
		`)
	}

	private static renderFrameHeaderRow(frame: Frame): string {
		return this.html(`
			<tr>
				<th width="100">${this.renderDateString(frame.startDate)}</th>
				<th width="120">Journalier</th>
				<th width="120">Hebdomadaire</th>
				<th width="120">Bi-hebdomadaire</th>
				<th width="120">Mensuel</th>
				<th width="120">Annuel</th>
			</tr>
		`)
	}

	private static renderFrameOperationRow(operation: FrameOperationView): string {
		return this.html(`
			<tr>
				<th>${operation.name}</th>
				<td>${this.money(operation.daily)}</td>
				<td>${this.money(operation.weekly)}</td>
				<td>${this.money(operation.biWeekly)}</td>
				<td>${this.money(operation.monthly)}</td>
				<td>${this.money(operation.yearly)}</td>
			</tr>
		`)
	}

	private static renderFrameTotalsRow(frame: Frame): string {
		return this.html(`
			<tr>
				<td colspan="6"></td>
			</tr>
			<tr>
				<th>Totaux</th>
				<td>${this.money(frame.billsTotals.daily)}</td>
				<td>${this.money(frame.billsTotals.weekly, true)}</td>
				<td>${this.money(frame.billsTotals.biWeekly)}</td>
				<td>${this.money(frame.billsTotals.monthly)}</td>
				<td>${this.money(frame.billsTotals.yearly)}</td>
			</tr>
		`)
	}

	private static renderTransactionTables(transactions: Transaction[]): string {
		const tables: string[] = []
		let rows: string[] = []
		let currentMonthKey: string | null = null
		let currentMonthTitle = ""

		for (const transaction of transactions) {
			if (!transaction.isCharged) continue

			const monthKey = this.renderMonthKey(transaction.chargeDate)

			if (monthKey !== currentMonthKey) {
				if (rows.length > 0) {
					tables.push(this.renderTransactionTable(currentMonthTitle, rows))
				}

				rows = []
				currentMonthKey = monthKey
				currentMonthTitle = this.renderMonthTitle(transaction.chargeDate)
			}

			rows.push(this.renderTransactionRow(transaction))
		}

		if (rows.length > 0) {
			tables.push(this.renderTransactionTable(currentMonthTitle, rows))
		}

		return tables.join("")
	}

	private static renderTransactionTable(title: string, rows: string[]): string {
		return this.html(`
			<table style="display:inline-flex; margin:10px" border="1" cellspacing="0" cellpadding="2">
				<tr>
					<th colspan="4">${title}</th>
				</tr>
				${rows.join("")}
			</table>
		`)
	}

	private static renderTransactionRow(transaction: Transaction): string {
		return this.html(`
			<tr bgcolor="${transaction.balance < 0 ? "#F66" : "lightgreen"}">
				<td width="20" style="text-align:center">${transaction.chargeDate.getDay()}</td>
				<td width="100" style="text-align:left">${transaction.operation.name}</td>
				<td width="75">${this.renderOperationAmount(transaction)}</td>
				<td width="75">${this.money(transaction.balance)}</td>
			</tr>
		`)
	}

	private static renderOperationAmount(transaction: Transaction): string {
		const sign = transaction.operation.isBill() ? "-" : ""
		return `${sign}${this.money(transaction.operation.amount)}`
	}

	private static renderMonthTitle(date: LocalDate): string {
		return `${this.renderMonthName(date)} ${date.getYear()}`
	}

	private static renderMonthKey(date: LocalDate): string {
		return `${date.getYear()}-${date.getMonth()}`
	}

	private static renderMonthName(date: LocalDate): string {
		return monthNames[date.getMonth() - 1]
	}

	private static money(amount: number, roundUp: boolean = false): string {
		const value = roundUp ? Math.ceil(amount * 100) / 100 : amount
		return `${value.toFixed(2)} $`
	}

	private static html(content: string): string {
		return content.replace(/[\t\n\r]+/g, "")
	}

}
