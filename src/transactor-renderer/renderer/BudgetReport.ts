import { LitElement, css, html, nothing } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { dateString, money } from "./Formatters"
import ResultInterpreter from "../interpreter/ResultInterpreter"
import "./SimulationTransactionTotals"
import "./BudgetPeriodDetails"
import "./AccountDetails"
import "./TransactionLedger"

import type { AccountResult, Result } from "../../transactor-common"
import type { AccountLedgerEntry } from "../interpreter"

type View = "overview" | "accounts" | "operations" | "transactions" | "calendar"

@customElement("budget-report")
export class BudgetReport extends LitElement {
	@property({ attribute: false })
	public result?: Result

	@state()
	private activeView: View = "overview"

	public static styles = css`
		:host {
			--page: #07111f;
			--sidebar: #081424;
			--surface: #101c2d;
			--surface-strong: #142238;
			--surface-soft: #0d1929;
			--text: #f4f7fb;
			--muted: #9eacc0;
			--border: #26354b;
			--accent: #9b6cff;
			--accent-soft: rgb(155 108 255 / 15%);
			--positive: #46d36f;
			--negative: #ff5f5f;
			display: block;
			min-height: 100vh;
			background: radial-gradient(circle at 75% 0%, #10243c 0, transparent 35%), var(--page);
			color: var(--text);
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		}

		*, *::before, *::after { box-sizing: border-box; }
		button { font: inherit; }

		.shell {
			display: grid;
			grid-template-columns: 232px minmax(0, 1fr);
			min-height: 100vh;
		}

		.sidebar {
			position: sticky;
			top: 0;
			height: 100vh;
			display: flex;
			flex-direction: column;
			padding: 24px 14px 16px;
			background: rgb(7 17 31 / 88%);
			border-right: 1px solid var(--border);
			backdrop-filter: blur(18px);
		}

		.brand { padding: 0 10px 28px; }
		.brand-title { margin: 0; font-size: 1.3rem; font-weight: 800; letter-spacing: -.025em; }
		.brand-subtitle { margin: 4px 0 0; color: var(--muted); font-size: .78rem; }

		.nav { display: grid; gap: 6px; }
		.nav-button {
			width: 100%;
			display: flex;
			align-items: center;
			gap: 11px;
			padding: 11px 12px;
			border: 1px solid transparent;
			border-radius: 11px;
			background: transparent;
			color: #c9d3e2;
			text-align: left;
			cursor: pointer;
			transition: 150ms ease;
		}
		.nav-button:hover { background: rgb(255 255 255 / 4%); color: white; }
		.nav-button.active { background: var(--accent-soft); border-color: rgb(155 108 255 / 35%); color: #c8adff; }
		.nav-icon { width: 22px; text-align: center; font-size: 1rem; }

		.simulation-card {
			margin-top: auto;
			padding: 14px;
			border: 1px solid var(--border);
			border-radius: 13px;
			background: rgb(255 255 255 / 3%);
		}
		.simulation-label { display: block; margin-bottom: 6px; color: var(--muted); font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; }
		.simulation-period { margin: 0; font-size: .78rem; line-height: 1.5; }

		.main { min-width: 0; padding: 28px 30px 56px; }
		.topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
		.page-title { margin: 0; font-size: clamp(1.6rem, 3vw, 2.1rem); letter-spacing: -.035em; }
		.page-description { margin: 6px 0 0; color: var(--muted); font-size: .9rem; }
		.period-chip { padding: 10px 13px; border: 1px solid var(--border); border-radius: 11px; background: rgb(255 255 255 / 3%); color: #dbe4ef; font-size: .82rem; white-space: nowrap; }

		.metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 24px; }
		.metric-card { min-width: 0; padding: 17px; border: 1px solid var(--border); border-radius: 14px; background: linear-gradient(145deg, rgb(255 255 255 / 4%), rgb(255 255 255 / 1%)); }
		.metric-card.accent { border-color: rgb(155 108 255 / 38%); background: linear-gradient(145deg, rgb(155 108 255 / 13%), rgb(155 108 255 / 3%)); }
		.metric-label { display: block; margin-bottom: 8px; color: var(--muted); font-size: .76rem; }
		.metric-value { display: block; overflow: hidden; text-overflow: ellipsis; font-size: 1.26rem; font-weight: 790; font-variant-numeric: tabular-nums; white-space: nowrap; }
		.metric-note { display: block; margin-top: 7px; color: var(--muted); font-size: .73rem; }
		.positive { color: var(--positive); }
		.negative { color: var(--negative); }

		.section { margin-top: 24px; }
		.section-header { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
		.section-title { margin: 0; font-size: 1.15rem; }
		.section-description { margin: 4px 0 0; color: var(--muted); font-size: .82rem; }
		.accounts { display: grid; gap: 12px; }
		.panel { padding: 18px; border: 1px solid var(--border); border-radius: 15px; background: rgb(16 28 45 / 82%); overflow: auto; }
		.grid-two { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(280px, .65fr); gap: 14px; }
		.account-list { display: grid; gap: 10px; }
		.account-row { display: grid; grid-template-columns: minmax(140px, 1fr) repeat(2, minmax(120px, .55fr)); gap: 14px; align-items: center; padding: 14px 15px; border: 1px solid var(--border); border-radius: 12px; background: rgb(255 255 255 / 2%); }
		.account-name { font-weight: 720; }
		.account-small { color: var(--muted); font-size: .76rem; }
		.account-number { text-align: right; font-weight: 720; font-variant-numeric: tabular-nums; }

		.calendar-list { display: grid; gap: 9px; }
		.calendar-item { display: grid; grid-template-columns: 130px minmax(0, 1fr) auto; gap: 14px; align-items: center; padding: 12px 14px; border: 1px solid var(--border); border-radius: 11px; background: rgb(255 255 255 / 2%); }
		.calendar-date { color: #c8adff; font-size: .8rem; font-weight: 700; }
		.calendar-account { color: var(--muted); font-size: .74rem; }
		.calendar-amount { font-weight: 760; font-variant-numeric: tabular-nums; }
		.empty-message { margin: 0; padding: 18px; color: var(--muted); border: 1px dashed var(--border); border-radius: 12px; }

		.mobile-nav { display: none; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 18px; }
		.mobile-nav .nav-button { justify-content: center; padding: 9px 5px; font-size: .74rem; }
		.mobile-nav .nav-icon { display: none; }

		@media (max-width: 1100px) {
			.metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
			.grid-two { grid-template-columns: 1fr; }
		}
		@media (max-width: 820px) {
			.shell { display: block; }
			.sidebar { display: none; }
			.main { padding: 20px 16px 42px; }
			.mobile-nav { display: grid; }
			.topbar { flex-direction: column; }
			.period-chip { white-space: normal; }
		}
		@media (max-width: 560px) {
			.metrics { grid-template-columns: 1fr; }
			.mobile-nav { overflow-x: auto; grid-template-columns: repeat(5, minmax(90px, 1fr)); }
			.account-row { grid-template-columns: 1fr 1fr; }
			.account-row > :first-child { grid-column: 1 / -1; }
			.calendar-item { grid-template-columns: 1fr auto; }
			.calendar-item > div:nth-child(2) { grid-column: 1 / -1; grid-row: 2; }
		}
	`

	protected render() {
		if (!this.result)
			return nothing

		return html`
			<div class="shell">
				<aside class="sidebar">
					<div class="brand">
						<h1 class="brand-title">Transactor</h1>
						<p class="brand-subtitle">Rapport budgétaire</p>
					</div>
					${this.renderNavigation("nav")}
					<div class="simulation-card">
						<span class="simulation-label">Simulation</span>
						<p class="simulation-period">${dateString(this.result.period.startDate)}<br>→ ${dateString(this.result.period.endDate)}</p>
					</div>
				</aside>

				<main class="main">
					${this.renderNavigation("mobile-nav")}
					<header class="topbar">
						<div>
							<h2 class="page-title">${this.viewTitle()}</h2>
							<p class="page-description">${this.viewDescription()}</p>
						</div>
						<div class="period-chip">${dateString(this.result.period.startDate)} — ${dateString(this.result.period.endDate)}</div>
					</header>
					${this.renderActiveView()}
				</main>
			</div>
		`
	}

	private renderNavigation(className: string) {
		const items: Array<[View, string, string]> = [
			["overview", "⌂", "Aperçu"],
			["accounts", "▣", "Comptes"],
			["operations", "⇄", "Opérations"],
			["transactions", "≡", "Transactions"],
			["calendar", "□", "Calendrier"]
		]

		return html`<nav class=${className} aria-label="Navigation du rapport">
			${items.map(([view, icon, label]) => html`
				<button class="nav-button ${this.activeView === view ? "active" : ""}" @click=${() => this.activeView = view} aria-current=${this.activeView === view ? "page" : nothing}>
					<span class="nav-icon" aria-hidden="true">${icon}</span><span>${label}</span>
				</button>
			`)}
		</nav>`
	}

	private renderActiveView() {
		switch (this.activeView) {
			case "accounts": return this.renderAccounts()
			case "operations": return this.renderOperations()
			case "transactions": return this.renderTransactions()
			case "calendar": return this.renderCalendar()
			default: return this.renderOverview()
		}
	}

	private renderOverview() {
		const opening = this.result!.accounts.reduce((sum, account) => sum + account.openingBalance, 0)
		const closing = this.result!.accounts.reduce((sum, account) => sum + account.closingBalance, 0)
		const change = closing - opening
		const transactionCount = this.result!.transactions.length

		return html`
			<div class="metrics">
				${this.metric("Solde initial", opening, "Tous les comptes")}
				${this.metric("Solde final", closing, "Projection à la fin", closing >= opening ? "positive" : "negative")}
				${this.metric("Variation", change, `${change >= 0 ? "+" : ""}${opening !== 0 ? ((change / Math.abs(opening)) * 100).toFixed(1) : "0"} %`, change >= 0 ? "positive" : "negative", true)}
				<div class="metric-card accent"><span class="metric-label">Transactions</span><strong class="metric-value">${transactionCount}</strong><span class="metric-note">Mouvements simulés</span></div>
			</div>

			<section class="section">
				<div class="section-header"><div><h3 class="section-title">Comptes</h3><p class="section-description">Vue condensée de chaque solde projeté.</p></div></div>
				<div class="account-list">${this.result!.accounts.map(account => this.renderAccountRow(account))}</div>
			</section>

			<section class="section grid-two">
				<div><div class="section-header"><div><h3 class="section-title">Compte principal</h3><p class="section-description">Graphique et registre du premier compte.</p></div></div>${this.result!.accounts[0] ? html`<account-details .account=${this.result!.accounts[0]} .result=${this.result} .startDate=${this.result!.period.startDate} .endDate=${this.result!.period.endDate}></account-details>` : nothing}</div>
				<div><div class="section-header"><div><h3 class="section-title">Résumé des opérations</h3><p class="section-description">Montants effectivement chargés.</p></div></div><div class="panel"><simulation-transaction-totals .result=${this.result}></simulation-transaction-totals></div></div>
			</section>
		`
	}

	private renderAccounts() {
		return html`<div class="accounts">${this.result!.accounts.length ? this.result!.accounts.map(account => html`<account-details .account=${account} .result=${this.result} .startDate=${this.result!.period.startDate} .endDate=${this.result!.period.endDate}></account-details>`) : html`<p class="empty-message">Aucun compte.</p>`}</div>`
	}

	private renderOperations() {
		return html`<div class="panel">${ResultInterpreter.for(this.result!).getModelPeriods().length ? ResultInterpreter.for(this.result!).getModelPeriods().map(period => html`<budget-period-details .period=${period} .result=${this.result}></budget-period-details>`) : html`<p class="empty-message">Aucune période budgétaire.</p>`}</div>`
	}

	private renderTransactions() {
		return html`
			<div class="panel"><simulation-transaction-totals .result=${this.result}></simulation-transaction-totals></div>
			${this.result!.accounts.map(account => {
				const entries = ResultInterpreter.for(this.result!).getAccountLedger(account.id)
				return html`<section class="section"><div class="section-header"><div><h3 class="section-title">${account.name}</h3><p class="section-description">${entries.length} écriture${entries.length === 1 ? "" : "s"}</p></div></div><transaction-ledger .entries=${entries}></transaction-ledger></section>`
			})}
		`
	}

	private renderCalendar() {
		const entries = this.calendarEntries()
		return html`<div class="calendar-list">${entries.length ? entries.map(entry => html`
			<div class="calendar-item">
				<div class="calendar-date">${dateString(entry.transaction.chargedDate)}</div>
				<div><div>${entry.operation.name}</div><div class="calendar-account">${entry.account.name}</div></div>
				<div class="calendar-amount ${entry.ledgerEntry.direction === "inflow" ? "positive" : "negative"}">${entry.ledgerEntry.direction === "inflow" ? "+" : "−"}${money(entry.ledgerEntry.amount)}</div>
			</div>` ) : html`<p class="empty-message">Aucune transaction au calendrier.</p>`}</div>`
	}

	private calendarEntries(): AccountLedgerEntry[] {
		return this.result!.accounts
			.flatMap(account => ResultInterpreter.for(this.result!).getAccountLedger(account.id))
			.toSorted((a, b) => a.transaction.chargedDate.localeCompare(b.transaction.chargedDate))
	}

	private renderAccountRow(account: AccountResult) {
		const change = account.closingBalance - account.openingBalance
		return html`<div class="account-row"><div><div class="account-name">${account.name}</div><div class="account-small">Solde initial ${money(account.openingBalance)}</div></div><div class="account-number"><div class="account-small">Solde final</div>${money(account.closingBalance)}</div><div class="account-number ${change >= 0 ? "positive" : "negative"}"><div class="account-small">Variation</div>${change > 0 ? "+" : ""}${money(change)}</div></div>`
	}

	private metric(label: string, value: number, note: string, className = "", showSign = false) {
		return html`<div class="metric-card"><span class="metric-label">${label}</span><strong class="metric-value ${className}">${showSign && value > 0 ? "+" : ""}${money(value)}</strong><span class="metric-note">${note}</span></div>`
	}

	private viewTitle() {
		return ({ overview: "Aperçu général", accounts: "Comptes", operations: "Opérations", transactions: "Transactions", calendar: "Calendrier" } as Record<View, string>)[this.activeView]
	}

	private viewDescription() {
		return ({ overview: "Vue d’ensemble de votre simulation financière.", accounts: "Soldes, graphiques et registres par compte.", operations: "Évolution des dépenses et opérations actives par période.", transactions: "Toutes les opérations chargées et leurs mouvements détaillés.", calendar: "Chronologie complète des transactions simulées." } as Record<View, string>)[this.activeView]
	}
}
