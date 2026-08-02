import { LitElement, css, html, nothing } from "lit"
import { customElement, property } from "lit/decorators.js"
import { dateString, dayString, money, monthKey, monthTitle } from "./Formatters"

import type { AccountLedgerEntry } from "../interpreter"

function entriesByMonth(entries: readonly AccountLedgerEntry[]): Map<string, AccountLedgerEntry[]> {
	const months = new Map<string, AccountLedgerEntry[]>()

	for (const entry of entries) {
		const key = monthKey(entry.transaction.chargedDate)
		const monthEntries = months.get(key) ?? []
		monthEntries.push(entry)
		months.set(key, monthEntries)
	}

	return months
}

@customElement("transaction-ledger")
export class TransactionLedger extends LitElement {
	@property({ attribute: false })
	public entries: readonly AccountLedgerEntry[] = []

	public static styles = css`
		:host { display: block; }
		.month-table { display: inline-table; min-width: 320px; margin: 0 12px 12px 0; vertical-align: top; border-collapse: separate; border-spacing: 0; border: 1px solid var(--border, #e4e8ef); border-radius: 12px; overflow: hidden; background: var(--surface, #101c2d); font-size: .82rem; }
		th, td { padding: 9px 10px; border-bottom: 1px solid var(--border, #e4e8ef); white-space: nowrap; }
		tr:last-child td { border-bottom: 0; }
		thead th { background: var(--surface-soft, #0d1929); text-align: left; font-size: .78rem; font-weight: 750; color: var(--text, #172033); }
		.day-column { width: 28px; text-align: center; color: var(--muted, #687386); }
		.name-column { min-width: 130px; text-align: left; }
		.amount-column { min-width: 95px; text-align: right; font-variant-numeric: tabular-nums; }
		.positive { background: var(--surface, #101c2d); }
		.negative { background: rgb(255 95 95 / 7%); }
		.negative .amount-column:last-child { color: var(--negative, #c63131); font-weight: 700; }
	`

	protected render() {
		const months = entriesByMonth(this.entries)
		return html`${Array.from(months.values()).map(entries => this.renderMonthTable(entries))}`
	}

	private renderMonthTable(entries: readonly AccountLedgerEntry[]) {
		const first = entries[0]
		if (!first) return nothing

		return html`
			<table class="month-table">
				<thead><tr><th colspan="4">${monthTitle(first.transaction.chargedDate)}</th></tr></thead>
				<tbody>${entries.map(entry => this.renderEntryRow(entry))}</tbody>
			</table>
		`
	}

	private renderEntryRow(entry: AccountLedgerEntry) {
		const { transaction, operation, ledgerEntry } = entry
		const title = transaction.scheduledDate !== transaction.chargedDate
			? `Date prévue : ${dateString(transaction.scheduledDate)}`
			: nothing

		return html`
			<tr class=${ledgerEntry.balanceAfter < 0 ? "negative" : "positive"} title=${title}>
				<td class="day-column">${dayString(transaction.chargedDate)}</td>
				<td class="name-column">${operation.name}</td>
				<td class="amount-column">${money(ledgerEntry.direction === "outflow" ? -ledgerEntry.amount : ledgerEntry.amount)}</td>
				<td class="amount-column">${money(ledgerEntry.balanceAfter)}</td>
			</tr>
		`
	}
}
