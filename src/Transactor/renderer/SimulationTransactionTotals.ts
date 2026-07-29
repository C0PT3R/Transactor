import { LitElement, css, html, nothing } from "lit"
import { customElement, property } from "lit/decorators.js"
import { isExpense, isIncome } from "../interpreter/OperationInterpreter"
import { getChargedOperationTotals } from "../interpreter/ResultInterpreter"
import { money, periodString } from "./Formatters"

import type { OperationChargedTotal } from "../interpreter/ResultInterpreter"
import type { Result } from "../types/ResultTypes"


@customElement("simulation-transaction-totals")
export class SimulationTransactionTotals extends LitElement {

	@property({ attribute: false })
	public result?: Result

	public static styles = css`
		:host { display: block; margin: 10px; }
		table { border-collapse: collapse; background-color: #DDD; }
		th, td { border: 1px solid black; padding: 2px 4px; white-space: nowrap; }
		th { text-align: left; }
		.amount-column { width: 120px; text-align: right; }
		.period-column { min-width: 180px; }
		.type-column { min-width: 70px; }
		.summary-row { font-weight: 600; }
		.net-row { font-weight: 700; }
		.empty-message { font-style: italic; }
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
