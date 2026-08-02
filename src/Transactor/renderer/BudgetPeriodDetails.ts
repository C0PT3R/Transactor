import { LitElement, css, html, nothing } from "lit"
import { customElement, property } from "lit/decorators.js"
import { getExpenseOperations } from "../queries/OperationQueries"
import { money, periodString } from "./Formatters"

import type { BudgetPeriodResult, OperationResult, TotalsResult } from "../types/ResultTypes"


@customElement("budget-period-details")
export class BudgetPeriodDetails extends LitElement {

	@property({ attribute: false })
	public period?: BudgetPeriodResult

	public static styles = css`
		:host {
			display: block; margin: 10px;
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
		th:first-child {
			text-align: left;
		}
		td {
			text-align: right;
		}
		.date-column {
			min-width: 180px;
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
		.summary-row {
			font-weight: 600;
		}
		.net-row {
			font-weight: 700;
		}
	`

	protected render() {
		if (!this.period)
			return nothing

		return html`
			<details>
				<summary>${periodString(this.period)}</summary>
				${this.renderTable(this.period)}
			</details>
		`
	}

	private renderTable(period: BudgetPeriodResult) {
		const expenses = getExpenseOperations(period)

		return html`
			<table>
				<thead>
					<tr>
						<th class="date-column">${periodString(period)}</th>
						<th class="amount-column">Journalier</th>
						<th class="amount-column">Hebdomadaire</th>
						<th class="amount-column">Bihebdomadaire</th>
						<th class="amount-column">Mensuel</th>
						<th class="amount-column">Annuel</th>
					</tr>
				</thead>
				<tbody>
					${expenses.map(operation => this.renderOperationRow(operation))}

					${expenses.length > 0
						? html`<tr class="spacer"><td colspan="6"></td></tr>`
						: nothing
					}

					${this.renderTotalsRow("Totaux", period.outflow, true, "summary-row")}
				</tbody>
			</table>
		`
	}

	private renderOperationRow(operation: OperationResult) {
		return html`
			<tr>
				<th>${operation.name}</th>
				<td>${money(operation.totals.daily)}</td>
				<td>${money(operation.totals.weekly)}</td>
				<td>${money(operation.totals.biWeekly)}</td>
				<td>${money(operation.totals.monthly)}</td>
				<td>${money(operation.totals.yearly)}</td>
			</tr>
		`
	}

	private renderTotalsRow(
		label: string,
		totals: TotalsResult,
		roundWeekly: boolean = false,
		className: string = ""
	) {
		return html`
			<tr class=${className}>
				<th>${label}</th>
				<td>${money(totals.daily)}</td>
				<td>${money(totals.weekly, roundWeekly)}</td>
				<td>${money(totals.biWeekly)}</td>
				<td>${money(totals.monthly)}</td>
				<td>${money(totals.yearly)}</td>
			</tr>
		`
	}
}
