import { LitElement, css, html, nothing } from "lit"
import { customElement, property } from "lit/decorators.js"
import { dateString, dayString, money, monthKey, monthTitle } from "./Formatters"

import type { TransactionResult } from "../../transactor-common"


function transactionsByMonth(entries: readonly TransactionResult[]): Map<string, TransactionResult[]> {
	const months = new Map<string, TransactionResult[]>()

	for (const entry of entries) {
		const key = monthKey(entry.chargedDate)
		const monthEntries = months.get(key) ?? []

		monthEntries.push(entry)
		months.set(key, monthEntries)
	}

	return months
}

@customElement("transaction-ledger")
export class TransactionLedger extends LitElement {

	@property({ attribute: false })
	public entries: readonly TransactionResult[] = []

	public static styles = css`
		:host { display: block; }
		.month-table {
			display: inline-table;
			background-color: #DDD;
			border-collapse: collapse;
			margin: 10px 10px 10px 0;
			vertical-align: top;
		}
		th, td { border: 1px solid black; padding: 2px; white-space: nowrap; }
		.day-column { width: 20px; text-align: center; }
		.name-column { width: 100px; text-align: left; }
		.amount-column { width: 75px; text-align: right; }
		.positive { background: lightgreen; }
		.negative { background: #F66; }
	`

	protected render() {
		const months = transactionsByMonth(this.entries)

		return html`
			${Array.from(months.values()).map(entries => this.renderMonthTable(entries))}
		`
	}

	private renderMonthTable(entries: readonly TransactionResult[]) {
		const first = entries[0]

		if (!first)
			return nothing

		return html`
			<table class="month-table">
				<thead>
					<tr><th colspan="4">${monthTitle(first.chargedDate)}</th></tr>
				</thead>
				<tbody>
					${entries.map(entry => this.renderTransactionRow(entry))}
				</tbody>
			</table>
		`
	}

	private renderTransactionRow(entry: TransactionResult) {
		const title = entry.scheduledDate !== entry.chargedDate
			? `Date prévue : ${dateString(entry.scheduledDate)}`
			: nothing

		return html`
			<tr class=${entry.balanceAfter < 0 ? "negative" : "positive"} title=${title}>
				<td class="day-column">${dayString(entry.chargedDate)}</td>
				<td class="name-column">${entry.operationName}</td>
				<td class="amount-column">${this.renderTransactionAmount(entry)}</td>
				<td class="amount-column">${money(entry.balanceAfter)}</td>
			</tr>
		`
	}

	private renderTransactionAmount(entry: TransactionResult): string {
		const amount = entry.direction === "outflow" ? -entry.amount : entry.amount
		return money(amount)
	}
}
