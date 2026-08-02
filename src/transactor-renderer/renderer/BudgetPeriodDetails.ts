import { LitElement, css, html, nothing } from "lit"
import { customElement, property } from "lit/decorators.js"
import { getExpenseOperations } from "../queries/OperationQueries"
import { money, periodString } from "./Formatters"

import type { BudgetPeriodResult, OperationResult, Result, TotalsResult } from "../../transactor-common"


@customElement("budget-period-details")
export class BudgetPeriodDetails extends LitElement {

	@property({ attribute: false })
	public period?: BudgetPeriodResult

	@property({ attribute: false })
	public result?: Result

	public static styles = css`
		:host { display: block; }
		:host + :host { margin-top: 10px; }
		details {
			display: block;
			border: 1px solid var(--border, #e4e8ef);
			border-radius: 12px;
			overflow: hidden;
		}
		summary {
			cursor: pointer;
			padding: 14px 16px;
			background: var(--surface-soft, #0d1929);
			font-weight: 720;
			color: var(--text, #172033);
		}
		table {
			width: 100%;
			border-collapse: collapse;
			font-size: .86rem;
		}
		th, td {
			padding: 10px 13px;
			border-top: 1px solid var(--border, #e4e8ef);
			white-space: nowrap;
		}
		th:first-child { text-align: left; }
		td { text-align: right; font-variant-numeric: tabular-nums; }
		thead th {
			background: var(--surface, #101c2d);
			font-size: .7rem;
			letter-spacing: .04em;
			text-transform: uppercase;
			color: var(--muted, #687386);
		}
		.date-column { min-width: 200px; }
		.amount-column { min-width: 125px; text-align: right; }
		.spacer td { height: 8px; padding: 0; background: var(--surface-soft, #0d1929); }
		.summary-row { background: var(--surface-soft, #0d1929); font-weight: 700; }
		.net-row { font-weight: 780; }
	`

	protected render() {
		if (!this.period || !this.result)
			return nothing

		return html`
			<details>
				<summary>${periodString(this.period)}</summary>
				${this.renderTable(this.period)}
			</details>
		`
	}

	private renderTable(period: BudgetPeriodResult) {
		const expenses = getExpenseOperations(this.result!, period)

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
