import { LitElement, css, html, nothing } from "lit"
import { customElement, property } from "lit/decorators.js"
import { isExpense, isIncome } from "../queries/OperationQueries"
import { getChargedOperationTotals } from "../queries/ResultQueries"
import { money, periodString } from "./Formatters"

import type { OperationChargedTotal } from "../queries/ResultQueries"
import type { Result } from "../../transactor-common"


@customElement("simulation-transaction-totals")
export class SimulationTransactionTotals extends LitElement {

	@property({ attribute: false })
	public result?: Result

	public static styles = css`
		:host { display: block; }
		table {
			width: 100%;
			border-collapse: separate;
			border-spacing: 0;
			font-size: .88rem;
		}
		th, td {
			padding: 12px 14px;
			border-bottom: 1px solid var(--border, #e4e8ef);
			white-space: nowrap;
		}
		thead th {
			background: var(--surface-soft, #0d1929);
			font-size: .72rem;
			font-weight: 750;
			letter-spacing: .045em;
			text-transform: uppercase;
			color: var(--muted, #687386);
			text-align: left;
		}
		thead th:first-child { border-radius: 10px 0 0 10px; }
		thead th:last-child { border-radius: 0 10px 10px 0; }
		tbody tr:hover:not(.summary-row):not(.net-row) { background: rgb(255 255 255 / 3%); }
		tbody tr:last-child th,
		tbody tr:last-child td { border-bottom: 0; }
		.amount-column {
			width: 150px;
			text-align: right;
			font-variant-numeric: tabular-nums;
		}
		.period-column { min-width: 220px; }
		.type-column { min-width: 90px; }
		.summary-row { background: var(--surface-soft, #0d1929); font-weight: 650; }
		.net-row { background: var(--accent-soft, rgb(155 108 255 / 15%)); font-weight: 780; color: #c8adff; }
		.empty-message { margin: 0; color: var(--muted, #687386); }
	`

	protected render() {
		if (!this.result)
			return nothing

		const totals = getChargedOperationTotals(this.result)

		if (totals.length === 0)
			return html`<p class="empty-message">Aucune transaction chargée.</p>`

		const inflow = totals.reduce((total, entry) =>
			isIncome(entry.operation) ? total + entry.total : total, 0)
		const outflow = totals.reduce((total, entry) =>
			isExpense(entry.operation) ? total + entry.total : total, 0)

		return html`
			<table>
				<thead>
					<tr>
						<th>Opération</th>
						<th class="period-column">Période active</th>
						<th class="type-column">Type</th>
						<th class="amount-column">Montant chargé</th>
					</tr>
				</thead>
				<tbody>
					${totals.map(entry => this.renderOperationRow(entry))}
					${this.renderSummaryRow("Entrées", inflow, "summary-row")}
					${this.renderSummaryRow("Sorties", outflow, "summary-row")}
					${this.renderSummaryRow("Net", inflow - outflow, "net-row")}
				</tbody>
			</table>
		`
	}

	private renderOperationRow(entry: OperationChargedTotal) {
		const operation = entry.operation

		return html`
			<tr title=${operation.id}>
				<th>${operation.name}</th>
				<td>${periodString(operation)}</td>
				<td>${isIncome(operation) ? "Entrée" : "Sortie"}</td>
				<td class="amount-column">${money(entry.total)}</td>
			</tr>
		`
	}

	private renderSummaryRow(label: string, amount: number, className: string) {
		return html`
			<tr class=${className}>
				<th colspan="3">${label}</th>
				<td class="amount-column">${money(amount)}</td>
			</tr>
		`
	}
}
