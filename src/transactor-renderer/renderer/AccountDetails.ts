import { LitElement, css, html, nothing } from "lit"
import { customElement, property } from "lit/decorators.js"
import { dateString, money } from "./Formatters"
import ResultInterpreter from "../interpreter/ResultInterpreter"
import "./TransactionLedger"
import "./AccountBalanceChart"

import type { AccountResult, Result } from "../../transactor-common"


@customElement("account-details")
export class AccountDetails extends LitElement {

	@property({ attribute: false })
	public account?: AccountResult

	@property({ attribute: false })
	public result?: Result

	@property({ type: String })
	public startDate = ""

	@property({ type: String })
	public endDate = ""

	public static styles = css`
		:host {
			display: block;
		}

		details {
			background: var(--surface, #ffffff);
			border: 1px solid var(--border, #e4e8ef);
			border-radius: 16px;
			box-shadow: 0 8px 30px rgb(15 23 42 / 6%);
			overflow: hidden;
		}

		details[open] {
			box-shadow: 0 14px 40px rgb(15 23 42 / 9%);
		}

		summary {
			display: grid;
			grid-template-columns: minmax(220px, 1.4fr) repeat(4, minmax(135px, .75fr)) 28px;
			gap: 22px;
			align-items: center;
			padding: 20px 22px;
			cursor: pointer;
			list-style: none;
			transition: background 160ms ease;
		}

		summary::-webkit-details-marker {
			display: none;
		}

		summary:hover {
			background: var(--surface-soft, #0d1929);
		}

		.account-identity {
			min-width: 0;
		}

		.account-name {
			margin: 0;
			font-size: 1.08rem;
			font-weight: 750;
			color: var(--text, #172033);
		}

		.account-caption {
			margin-top: 5px;
			font-size: .82rem;
			color: var(--muted, #687386);
		}

		.metric {
			min-width: 0;
		}

		.metric-label {
			display: block;
			margin-bottom: 5px;
			font-size: .72rem;
			font-weight: 700;
			letter-spacing: .045em;
			text-transform: uppercase;
			color: var(--muted, #687386);
		}

		.metric-value {
			display: block;
			font-size: 1rem;
			font-weight: 760;
			font-variant-numeric: tabular-nums;
			color: var(--text, #172033);
		}

		.metric-detail {
			display: block;
			margin-top: 4px;
			font-size: .76rem;
			color: var(--muted, #687386);
		}

		.positive { color: var(--positive, #16803c); }
		.negative { color: var(--negative, #c63131); }

		.chevron {
			width: 10px;
			height: 10px;
			border-right: 2px solid var(--muted, #9eacc0);
			border-bottom: 2px solid var(--muted, #9eacc0);
			transform: rotate(45deg);
			transition: transform 160ms ease;
			justify-self: end;
		}

		details[open] .chevron {
			transform: rotate(225deg);
		}

		.account-content {
			padding: 0 22px 24px;
			border-top: 1px solid var(--border, #e4e8ef);
		}

		.empty-message {
			margin: 22px 0 0;
			padding: 18px;
			border-radius: 12px;
			background: var(--surface-soft, #0d1929);
			color: var(--muted, #687386);
		}

		@media (max-width: 1100px) {
			summary {
				grid-template-columns: minmax(220px, 1.5fr) repeat(2, minmax(140px, 1fr)) 28px;
			}

			.metric:nth-of-type(4),
			.metric:nth-of-type(5) {
				display: none;
			}
		}

		@media (max-width: 700px) {
			summary {
				grid-template-columns: 1fr 28px;
				gap: 10px;
			}

			.metric {
				display: none;
			}

			.account-content {
				padding: 0 14px 18px;
			}
		}
	`

	protected render() {
		if (!this.account)
			return nothing

		if (!this.result)
			return nothing

		const ledger = ResultInterpreter.for(this.result).getAccountLedger(this.account.id)
		const change = this.account.closingBalance - this.account.openingBalance
		const lowest = this.getLowestBalance()
		const current = this.getCurrentProjectedBalance()

		return html`
			<details open>
				<summary>
					<div class="account-identity">
						<h3 class="account-name">${this.account.name}</h3>
						<div class="account-caption">
							Solde initial&nbsp;: ${money(this.account.openingBalance)}
						</div>
					</div>

					${this.renderMetric("Solde final", this.account.closingBalance)}
					${this.renderMetric("Variation", change, undefined, true)}
					${this.renderMetric(
						"Solde minimum",
						lowest.balance,
						lowest.date ? dateString(lowest.date) : undefined
					)}
					${current === undefined
						? this.renderUnavailableMetric("Aujourd’hui")
						: this.renderMetric("Aujourd’hui", current)
					}
					<span class="chevron" aria-hidden="true"></span>
				</summary>

				<div class="account-content">
					${ledger.length > 0
						? html`
							<account-balance-chart
								.account=${this.account}
								.result=${this.result}
								.startDate=${this.startDate}
							></account-balance-chart>
							<transaction-ledger .entries=${ledger}></transaction-ledger>
						`
						: html`<p class="empty-message">Aucune transaction pour ce compte.</p>`
					}
				</div>
			</details>
		`
	}

	private renderMetric(label: string, value: number, detail?: string, showSign = false) {
		const className = value < 0 ? "negative" : value > 0 && showSign ? "positive" : ""
		const sign = showSign && value > 0 ? "+" : ""

		return html`
			<div class="metric">
				<span class="metric-label">${label}</span>
				<strong class="metric-value ${className}">${sign}${money(value)}</strong>
				${detail ? html`<span class="metric-detail">${detail}</span>` : nothing}
			</div>
		`
	}

	private renderUnavailableMetric(label: string) {
		return html`
			<div class="metric">
				<span class="metric-label">${label}</span>
				<strong class="metric-value">—</strong>
				<span class="metric-detail">Hors simulation</span>
			</div>
		`
	}

	private getLowestBalance(): { balance: number, date?: string } {
		let balance = this.account?.openingBalance ?? 0
		let date = this.startDate || undefined

		if (!this.result || !this.account) return { balance, date }

		for (const entry of ResultInterpreter.for(this.result).getAccountLedger(this.account.id)) {
			if (entry.ledgerEntry.balanceAfter < balance) {
				balance = entry.ledgerEntry.balanceAfter
				date = entry.transaction.chargedDate
			}
		}

		return { balance, date }
	}

	private getCurrentProjectedBalance(): number | undefined {
		if (!this.account)
			return undefined

		const today = new Date().toISOString().slice(0, 10)

		if ((this.startDate && today < this.startDate) || (this.endDate && today > this.endDate))
			return undefined

		let balance = this.account.openingBalance

		if (!this.result) return undefined

		for (const entry of ResultInterpreter.for(this.result).getAccountLedger(this.account.id)) {
			if (entry.transaction.chargedDate > today) break
			balance = entry.ledgerEntry.balanceAfter
		}

		return balance
	}
}
