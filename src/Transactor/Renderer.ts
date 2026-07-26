import { LitElement, css, html, nothing } from "lit"
import { render as litRender } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { LocalDate } from "@c0pt3r/local-date"

import Result from "./Result"
import Frame from "./Frame"
import Transaction from "./Transaction"
import Operation from "./Operation"
import LedgerEntry from "./LedgerEntry"

const monthNames = [
	"Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
	"Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]

type HtmlTarget = HTMLElement | DocumentFragment

function monthName(date: LocalDate): string {
	return monthNames[date.getMonth() - 1]
}

function dateString(date: LocalDate): string {
	return `${date.getDay()} ${monthName(date)} ${date.getYear()}`
}

function monthTitle(date: LocalDate): string {
	return `${monthName(date)} ${date.getYear()}`
}

function monthKey(date: LocalDate): string {
	return `${date.getYear()}-${date.getMonth()}`
}

function money(amount: number, roundUp: boolean = false): string {
	const value = roundUp ? Math.ceil(amount * 100) / 100 : amount
	return `${value.toFixed(2)} $`
}

function expenseOperations(frame: Frame): Operation[] {
	return frame.operations
		.toSorted((a, b) => b.convertTo("daily") - a.convertTo("daily"))
		.filter(operation => operation.from && !operation.to)
}

function chargedTransactionsByMonth(entries: LedgerEntry[]): Map<string, LedgerEntry[]> {
	const months = new Map<string, LedgerEntry[]>()

	for (const entry of entries) {
		if (!entry.isCharged) continue

		const key = monthKey(entry.transaction.chargeDate)
		const monthTransactions = months.get(key) ?? []

		monthTransactions.push(entry)
		months.set(key, monthTransactions)
	}

	return months
}

@customElement("budget-report")
export class BudgetReport extends LitElement {
	@property({ attribute: false })
	public result?: Result

	public static styles = css`
		:host {
			display: block;
			font-family: system-ui, sans-serif;
		}

		.report-section {
			display: block;
			margin-bottom: 16px;
		}
	`

	protected render() {
		if (!this.result) return nothing

		return html`
			<section class="report-section">
				${this.result.frames.map(frame => html`
					<frame-details .frame=${frame}></frame-details>
				`)}
			</section>

			<section class="report-section">
				<transaction-ledger .entries=${this.result.transactions}></transaction-ledger>
			</section>
		`
	}
}

@customElement("frame-details")
export class FrameDetails extends LitElement {
	@property({ attribute: false })
	public frame?: Frame

	@state()
	private collapsed = false

	public static styles = css`
		:host {
			display: block;
			margin: 10px;
		}

		details {
			display: inline-block;
		}

		summary {
			cursor: pointer;
			font-weight: 700;
			margin-bottom: 4px;
		}

		table {
			border-collapse: collapse;
			background-color: #DDD;
		}

		th, td {
			border: 1px solid black;
			padding: 2px 4px;
			white-space: nowrap;
		}

		td {
			text-align: right;
		}

		.date-column {
			width: 100px;
		}

		.amount-column {
			width: 120px;
			text-align: right;
		}

		.spacer td {
			border-left: 1px solid black;
			border-right: 1px solid black;
			height: 1em;
		}
	`

	protected render() {
		if (!this.frame) return nothing

		return html`
			<details open @toggle=${this.onToggle}>
				<summary>${dateString(this.frame.startDate)}</summary>
				${this.collapsed ? nothing : this.renderTable(this.frame)}
			</details>
		`
	}

	private onToggle(event: Event) {
		this.collapsed = !(event.currentTarget as HTMLDetailsElement).open
	}

	private renderTable(frame: Frame) {
		return html`
			<table>
				<thead>
					<tr>
						<th class="date-column">${dateString(frame.startDate)}</th>
						<th class="amount-column">Journalier</th>
						<th class="amount-column">Hebdomadaire</th>
						<th class="amount-column">Bi-hebdomadaire</th>
						<th class="amount-column">Mensuel</th>
						<th class="amount-column">Annuel</th>
					</tr>
				</thead>
				<tbody>
					${expenseOperations(frame).map(operation => this.renderOperationRow(operation))}
					<tr class="spacer"><td colspan="6"></td></tr>
					${this.renderTotalsRow(frame)}
				</tbody>
			</table>
		`
	}

	private renderOperationRow(operation: Operation) {
		return html`
			<tr>
				<th>${operation.name}</th>
				<td>${money(operation.convertTo("daily"))}</td>
				<td>${money(operation.convertTo("weekly"))}</td>
				<td>${money(operation.convertTo("biWeekly"))}</td>
				<td>${money(operation.convertTo("monthly"))}</td>
				<td>${money(operation.convertTo("yearly"))}</td>
			</tr>
		`
	}

	private renderTotalsRow(frame: Frame) {
		return html`
			<tr>
				<th>Totaux</th>
				<td>${money(frame.outflow.daily)}</td>
				<td>${money(frame.outflow.weekly, true)}</td>
				<td>${money(frame.outflow.biWeekly)}</td>
				<td>${money(frame.outflow.monthly)}</td>
				<td>${money(frame.outflow.yearly)}</td>
			</tr>
		`
	}
}

@customElement("transaction-ledger")
export class TransactionLedger extends LitElement {
	@property({ attribute: false })
	public entries: LedgerEntry[] = []

	public static styles = css`
		:host {
			display: block;
		}

		.month-table {
			display: inline-table;
			background-color: #DDD;
			border-collapse: collapse;
			margin: 10px;
			vertical-align: top;
		}

		th, td {
			border: 1px solid black;
			padding: 2px;
			white-space: nowrap;
		}

		.day-column {
			width: 20px;
			text-align: center;
		}

		.name-column {
			width: 100px;
			text-align: left;
		}

		.amount-column {
			width: 75px;
			text-align: right;
		}

		.positive {
			background: lightgreen;
		}

		.negative {
			background: #F66;
		}
	`

	protected render() {
		const months = chargedTransactionsByMonth(this.entries)

		return html`
			${Array.from(months.values()).map(transactions => this.renderMonthTable(transactions))}
		`
	}

	private renderMonthTable(entries: LedgerEntry[]) {
		const first = entries[0]
		if (!first) return nothing

		return html`
			<table class="month-table">
				<thead>
					<tr>
						<th colspan="4">${monthTitle(first.transaction.chargeDate)}</th>
					</tr>
				</thead>
				<tbody>
					${entries.map(entry => this.renderTransactionRow(entry))}
				</tbody>
			</table>
		`
	}

	private renderTransactionRow(entry: LedgerEntry) {
		return html`
			<tr class=${entry.balanceAfter < 0 ? "negative" : "positive"}>
				<td class="day-column">${entry.transaction.chargeDate.getDay()}</td>
				<td class="name-column">${entry.transaction.operation.name}</td>
				<td class="amount-column">${this.renderOperationAmount(entry.transaction)}</td>
				<td class="amount-column">${money(entry.balanceAfter)}</td>
			</tr>
		`
	}

	private renderOperationAmount(transaction: Transaction): string {
		const sign = transaction.operation.from ? "-" : ""
		return `${sign}${money(transaction.operation.getAmount())}`
	}
}

export default class Renderer {
	constructor() {}

	/**
	 * New preferred API: render directly into a DOM element with Lit.
	 */
	public static renderInto(result: Result, target: HtmlTarget) {
		litRender(html`<budget-report .result=${result}></budget-report>`, target)
	}

	/**
	 * Kept for existing code that still calls Renderer.render(result, writer).
	 * Lit needs a DOM target, so this wrapper creates a temporary element and sends
	 * its HTML to the old writer callback after Lit has rendered.
	 *
	 * Prefer renderInto(...) for new UI code.
	 */
	public static render(result: Result, writer: printer_t) {
		const container = document.createElement("div")
		this.renderInto(result, container)
		writer(container.innerHTML)
	}

	public static renderDateString(date: LocalDate): string {
		return dateString(date)
	}
}
