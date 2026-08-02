import { LitElement, css, html, nothing } from "lit"
import { customElement, property } from "lit/decorators.js"
import { money } from "./Formatters"
import "./TransactionLedger"
import "./AccountBalanceChart"

import type { AccountResult } from "../../transactor-common"


@customElement("account-details")
export class AccountDetails extends LitElement {

	@property({ attribute: false })
	public account?: AccountResult

	@property({ type: String })
	public startDate = ""

	public static styles = css`
		:host { display: block; margin: 10px 10px 24px; }
		.account-header { margin-bottom: 6px; }
		.account-name { font-size: 1.1rem; margin: 0 0 4px; }
		.balance-summary { display: flex; flex-wrap: wrap; gap: 12px; margin: 0; }
		.balance-summary span { white-space: nowrap; }
		.negative { color: #A00; font-weight: 700; }
		.empty-message { font-style: italic; }
	`

	protected render() {
		if (!this.account)
			return nothing

		const change = this.account.closingBalance - this.account.openingBalance

		return html`
			<section>
				<header class="account-header">
					<h2 class="account-name">${this.account.name}</h2>

					<p class="balance-summary">
						<span>
							Solde initial :
							<strong class=${this.account.openingBalance < 0 ? "negative" : ""}>
								${money(this.account.openingBalance)}
							</strong>
						</span>

						<span>
							Solde final :
							<strong class=${this.account.closingBalance < 0 ? "negative" : ""}>
								${money(this.account.closingBalance)}
							</strong>
						</span>

						<span>
							Variation :
							<strong class=${change < 0 ? "negative" : ""}>${money(change)}</strong>
						</span>
					</p>
				</header>

				${this.account.transactions.length > 0
					? html`
						<account-balance-chart
							.account=${this.account}
							.startDate=${this.startDate}
						></account-balance-chart>
						<transaction-ledger .entries=${this.account.transactions}></transaction-ledger>
					`
					: html`<p class="empty-message">Aucune transaction.</p>`
				}
			</section>
		`
	}
}