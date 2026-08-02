import { LitElement, css, html, nothing } from "lit"
import { customElement, property } from "lit/decorators.js"
import { dateString } from "./Formatters"
import "./SimulationTransactionTotals"
import "./BudgetPeriodDetails"
import "./AccountDetails"

import type { Result } from "../results/ResultTypes"


@customElement("budget-report")
export class BudgetReport extends LitElement {

	@property({ attribute: false })
	public result?: Result

	public static styles = css`
		:host {
			display: block;
			font-family: system-ui, sans-serif;
		}

		.report-period {
			margin: 10px;
		}

		.report-section {
			display: block;
			margin-bottom: 16px;
		}

		.section-title {
			font-size: 1.2rem;
			margin: 10px;
		}

		.empty-message {
			margin: 10px;
			font-style: italic;
		}
	`

	protected render() {
		if (!this.result)
			return nothing

		return html`
			<p class="report-period">
				${dateString(this.result.period.startDate)} — ${dateString(this.result.period.endDate)}
			</p>

			<section class="report-section">
				<h2 class="section-title">Transactions chargées</h2>
				<simulation-transaction-totals .result=${this.result}></simulation-transaction-totals>
			</section>

			<section class="report-section">
				<h2 class="section-title">Détails du budget</h2>

				${this.result.periods.length > 0
					? this.result.periods.map(period => html`
						<budget-period-details .period=${period}></budget-period-details>
					`)
					: html`<p class="empty-message">Aucune période.</p>`
				}
			</section>

			<section class="report-section">
				<h2 class="section-title">Comptes</h2>

				${this.result.accounts.length > 0
					? this.result.accounts.map(account => html`
						<account-details
							.account=${account}
							.startDate=${this.result?.period.startDate}
						></account-details>
					`)
					: html`<p class="empty-message">Aucun compte.</p>`
				}
			</section>
		`
	}
}