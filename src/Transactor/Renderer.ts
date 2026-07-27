import { LitElement, css, html, nothing} from "lit"
import { render as litRender} from "lit"
import { customElement, property, state} from "lit/decorators.js"
import { LocalDate } from "@c0pt3r/local-date"

import type {
	Result,
	BudgetPeriodResult,
	OperationResult,
	AccountResult,
	TransactionResult,
	TotalsResult
} from "./types/ResultTypes"


const monthNames = [
	"Janvier",
	"Février",
	"Mars",
	"Avril",
	"Mai",
	"Juin",
	"Juillet",
	"Août",
	"Septembre",
	"Octobre",
	"Novembre",
	"Décembre"
]

const currencyFormatter =
	new Intl.NumberFormat("fr-FR", {
		style: "currency",
		currency: "CAD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})

type HtmlTarget =
	HTMLElement |
	DocumentFragment

interface DateParts {
	year: number
	month: number
	day: number
}


function parseDate(date: string): DateParts | null {
	const match =
		/^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(
			date
		)

	if (!match)
		return null

	const year = Number(match[1])
	const month = Number(match[2])
	const day = Number(match[3])

	if (
		!Number.isInteger(year) ||
		!Number.isInteger(month) ||
		!Number.isInteger(day) ||
		month < 1 ||
		month > 12 ||
		day < 1 ||
		day > 31
	) {
		return null
	}

	return {
		year,
		month,
		day
	}
}

function monthName(
	month: number
): string {
	return (
		monthNames[month - 1] ??
		String(month)
	)
}

function dateString(
	date: string
): string {
	const parts = parseDate(date)

	if (!parts)
		return date

	return (
		`${parts.day} ` +
		`${monthName(parts.month)} ` +
		`${parts.year}`
	)
}

function periodString(
	period: BudgetPeriodResult
): string {
	if (
		period.startDate ===
		period.endDate
	) {
		return dateString(
			period.startDate
		)
	}

	return (
		`${dateString(period.startDate)} — ` +
		`${dateString(period.endDate)}`
	)
}

function monthTitle(
	date: string
): string {
	const parts = parseDate(date)

	if (!parts)
		return date

	return (
		`${monthName(parts.month)} ` +
		`${parts.year}`
	)
}

function monthKey(
	date: string
): string {
	const parts = parseDate(date)

	if (!parts)
		return date

	return (
		`${parts.year}-` +
		String(parts.month).padStart(2, "0")
	)
}

function dayString(
	date: string
): string {
	const parts = parseDate(date)

	return parts
		? String(parts.day)
		: date
}

function money(
	amount: number,
	roundUp: boolean = false
): string {
	const value = roundUp
		? Math.ceil(amount * 100) / 100
		: Math.round(amount * 100) / 100

	return currencyFormatter.format(value)
}

function dateValue(
	date: string
): number | null {
	const parts = parseDate(date)

	if (!parts)
		return null

	return Date.UTC(
		parts.year,
		parts.month - 1,
		parts.day
	)
}

function dateDuringPeriod(
	date: string,
	period: BudgetPeriodResult
): boolean {
	const value = dateValue(date)
	const startDate =
		dateValue(period.startDate)
	const endDate =
		dateValue(period.endDate)

	return (
		value !== null &&
		startDate !== null &&
		endDate !== null &&
		value >= startDate &&
		value <= endDate
	)
}

function chargedDuringPeriod(
	transaction: TransactionResult,
	period: BudgetPeriodResult
): boolean {
	return dateDuringPeriod(
		transaction.chargedDate,
		period
	)
}

function operationForTransaction(
	transaction: TransactionResult,
	periods: readonly BudgetPeriodResult[]
): OperationResult | undefined {
	const scheduledPeriod = periods.find(
		period => dateDuringPeriod(
			transaction.scheduledDate,
			period
		)
	)

	return scheduledPeriod?.operations.find(
		operation =>
			operation.id === transaction.operationId
	)
}

function isIncome(
	operation: OperationResult
): boolean {
	return (
		operation.from === undefined &&
		operation.to !== undefined
	)
}

function isExpense(
	operation: OperationResult
): boolean {
	return (
		operation.from !== undefined &&
		operation.to === undefined
	)
}

function transactionTotal(
	transactions: readonly TransactionResult[],
	predicate: (
		transaction: TransactionResult
	) => boolean
): number {
	return transactions.reduce(
		(total, transaction) =>
			predicate(transaction)
				? total + transaction.amount
				: total,
		0
	)
}

function expenseOperations(
	period: BudgetPeriodResult
): readonly OperationResult[] {
	return period.operations
		.filter(isExpense)
		.toSorted(
			(a, b) =>
				b.totals.daily -
				a.totals.daily
		)
}

function transactionsByMonth(
	entries: readonly TransactionResult[]
): Map<string, TransactionResult[]> {
	const months =
		new Map<
			string,
			TransactionResult[]
		>()

	for (const entry of entries) {
		const key =
			monthKey(entry.chargedDate)

		const monthEntries =
			months.get(key) ?? []

		monthEntries.push(entry)
		months.set(key, monthEntries)
	}

	return months
}


@customElement("budget-report")
export class BudgetReport
	extends LitElement {

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

		const transactions =
			this.result.accounts.flatMap(
				account => account.transactions
			)

		return html`
			<p class="report-period">
				${dateString(
					this.result.period.startDate
				)}
				—
				${dateString(
					this.result.period.endDate
				)}
			</p>

			<section class="report-section">
				<h2 class="section-title">
					Budget
				</h2>

				${this.result.periods.length > 0
					? this.result.periods.map(
						period => html`
							<budget-period-details
								.period=${period}
								.periods=${this.result.periods}
								.transactions=${transactions}
							></budget-period-details>
						`
					)
					: html`
						<p class="empty-message">
							Aucune période.
						</p>
					`
				}
			</section>

			<section class="report-section">
				<h2 class="section-title">
					Comptes
				</h2>

				${this.result.accounts.length > 0
					? this.result.accounts.map(
						account => html`
							<account-details
								.account=${account}
							></account-details>
						`
					)
					: html`
						<p class="empty-message">
							Aucun compte.
						</p>
					`
				}
			</section>
		`
	}
}


@customElement("budget-period-details")
export class BudgetPeriodDetails
	extends LitElement {

	@property({ attribute: false })
	public period?: BudgetPeriodResult

	@property({ attribute: false })
	public periods:
		readonly BudgetPeriodResult[] = []

	@property({ attribute: false })
	public transactions:
		readonly TransactionResult[] = []

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

		th,
		td {
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
			<details
				open
				@toggle=${this.onToggle}
			>
				<summary>
					${periodString(this.period)}
				</summary>

				${this.collapsed
					? nothing
					: this.renderTable(
						this.period
					)
				}
			</details>
		`
	}

	private onToggle(
		event: Event
	): void {
		this.collapsed =
			!(event.currentTarget as
				HTMLDetailsElement
			).open
	}

	private renderTable(
		period: BudgetPeriodResult
	) {
		const expenses =
			expenseOperations(period)
		const transactions =
			this.transactions.filter(
				transaction =>
					chargedDuringPeriod(
						transaction,
						period
					)
			)

		const inflow = transactionTotal(
			transactions,
			transaction => {
				const operation =
					operationForTransaction(
						transaction,
						this.periods
					)

				return (
					transaction.direction ===
						"inflow" &&
					operation !== undefined &&
					isIncome(operation)
				)
			}
		)
		const outflow = transactionTotal(
			transactions,
			transaction => {
				const operation =
					operationForTransaction(
						transaction,
						this.periods
					)

				return (
					transaction.direction ===
						"outflow" &&
					operation !== undefined &&
					isExpense(operation)
				)
			}
		)

		return html`
			<table>
				<thead>
					<tr>
						<th class="date-column">
							${periodString(period)}
						</th>

						<th class="amount-column">
							Journalier
						</th>

						<th class="amount-column">
							Hebdomadaire
						</th>

						<th class="amount-column">
							Bihebdomadaire
						</th>

						<th class="amount-column">
							Mensuel
						</th>

						<th class="amount-column">
							Annuel
						</th>

						<th class="amount-column">
							Total réel
						</th>
					</tr>
				</thead>

				<tbody>
					${expenses.map(
						operation =>
							this.renderOperationRow(
								operation,
								transactions
							)
					)}

					${expenses.length > 0
						? html`
							<tr class="spacer">
								<td colspan="7"></td>
							</tr>
						`
						: nothing
					}

					${this.renderTotalsRow(
						"Entrées",
						period.inflow,
						inflow,
						false,
						"summary-row"
					)}

					${this.renderTotalsRow(
						"Sorties",
						period.outflow,
						outflow,
						true,
						"summary-row"
					)}

					${this.renderTotalsRow(
						"Net",
						period.net,
						inflow - outflow,
						false,
						"net-row"
					)}
				</tbody>
			</table>
		`
	}

	private renderOperationRow(
		operation: OperationResult,
		transactions:
			readonly TransactionResult[]
	) {
		const total = transactionTotal(
			transactions,
			transaction => {
				const transactionOperation =
					operationForTransaction(
						transaction,
						this.periods
					)

				return (
					transaction.operationId ===
						operation.id &&
					transaction.direction ===
						"outflow" &&
					transactionOperation !==
						undefined &&
					isExpense(transactionOperation)
				)
			}
		)

		return html`
			<tr>
				<th>
					${operation.name}
				</th>

				<td>
					${money(
						operation.totals.daily
					)}
				</td>

				<td>
					${money(
						operation.totals.weekly
					)}
				</td>

				<td>
					${money(
						operation.totals.biWeekly
					)}
				</td>

				<td>
					${money(
						operation.totals.monthly
					)}
				</td>

				<td>
					${money(
						operation.totals.yearly
					)}
				</td>

				<td>
					${money(total)}
				</td>
			</tr>
		`
	}

	private renderTotalsRow(
		label: string,
		totals: TotalsResult,
		periodTotal: number,
		roundWeekly: boolean = false,
		className: string = ""
	) {
		return html`
			<tr class=${className}>
				<th>
					${label}
				</th>

				<td>
					${money(totals.daily)}
				</td>

				<td>
					${money(
						totals.weekly,
						roundWeekly
					)}
				</td>

				<td>
					${money(totals.biWeekly)}
				</td>

				<td>
					${money(totals.monthly)}
				</td>

				<td>
					${money(totals.yearly)}
				</td>

				<td>
					${money(periodTotal)}
				</td>
			</tr>
		`
	}
}


@customElement("account-details")
export class AccountDetails
	extends LitElement {

	@property({ attribute: false })
	public account?: AccountResult

	public static styles = css`
		:host {
			display: block;
			margin: 10px 10px 24px;
		}

		.account-header {
			margin-bottom: 6px;
		}

		.account-name {
			font-size: 1.1rem;
			margin: 0 0 4px;
		}

		.balance-summary {
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
			margin: 0;
		}

		.balance-summary span {
			white-space: nowrap;
		}

		.negative {
			color: #A00;
			font-weight: 700;
		}

		.empty-message {
			font-style: italic;
		}
	`

	protected render() {
		if (!this.account)
			return nothing

		const change =
			this.account.closingBalance -
			this.account.openingBalance

		return html`
			<section>
				<header class="account-header">
					<h2 class="account-name">
						${this.account.name}
					</h2>

					<p class="balance-summary">
						<span>
							Solde initial :

							<strong
								class=${
									this.account
										.openingBalance < 0
										? "negative"
										: ""
								}
							>
								${money(
									this.account
										.openingBalance
								)}
							</strong>
						</span>

						<span>
							Solde final :

							<strong
								class=${
									this.account
										.closingBalance < 0
										? "negative"
										: ""
								}
							>
								${money(
									this.account
										.closingBalance
								)}
							</strong>
						</span>

						<span>
							Variation :

							<strong
								class=${
									change < 0
										? "negative"
										: ""
								}
							>
								${money(change)}
							</strong>
						</span>
					</p>
				</header>

				${this.account.transactions.length > 0
					? html`
						<transaction-ledger
							.entries=${
								this.account.transactions
							}
						></transaction-ledger>
					`
					: html`
						<p class="empty-message">
							Aucune transaction.
						</p>
					`
				}
			</section>
		`
	}
}


@customElement("transaction-ledger")
export class TransactionLedger
	extends LitElement {

	@property({ attribute: false })
	public entries:
		readonly TransactionResult[] = []

	public static styles = css`
		:host {
			display: block;
		}

		.month-table {
			display: inline-table;
			background-color: #DDD;
			border-collapse: collapse;
			margin: 10px 10px 10px 0;
			vertical-align: top;
		}

		th,
		td {
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
		const months =
			transactionsByMonth(
				this.entries
			)

		return html`
			${Array.from(
				months.values()
			).map(entries =>
				this.renderMonthTable(
					entries
				)
			)}
		`
	}

	private renderMonthTable(
		entries:
			readonly TransactionResult[]
	) {
		const first = entries[0]

		if (!first)
			return nothing

		return html`
			<table class="month-table">
				<thead>
					<tr>
						<th colspan="4">
							${monthTitle(
								first.chargedDate
							)}
						</th>
					</tr>
				</thead>

				<tbody>
					${entries.map(entry =>
						this.renderTransactionRow(
							entry
						)
					)}
				</tbody>
			</table>
		`
	}

	private renderTransactionRow(
		entry: TransactionResult
	) {
		const scheduledDateChanged =
			entry.scheduledDate !==
			entry.chargedDate

		const title =
			scheduledDateChanged
				? (
					`Date prévue : ` +
					dateString(
						entry.scheduledDate
					)
				)
				: nothing

		return html`
			<tr
				class=${
					entry.balanceAfter < 0
						? "negative"
						: "positive"
				}
				title=${title}
			>
				<td class="day-column">
					${dayString(
						entry.chargedDate
					)}
				</td>

				<td class="name-column">
					${entry.operationName}
				</td>

				<td class="amount-column">
					${this.renderTransactionAmount(
						entry
					)}
				</td>

				<td class="amount-column">
					${money(
						entry.balanceAfter
					)}
				</td>
			</tr>
		`
	}

	private renderTransactionAmount(
		entry: TransactionResult
	): string {
		const amount =
			entry.direction === "outflow"
				? -entry.amount
				: entry.amount

		return money(amount)
	}
}


export default class Renderer {

	public static renderInto(
		result: Result,
		target: HtmlTarget
	): void {
		litRender(
			html`
				<budget-report
					.result=${result}
				></budget-report>
			`,
			target
		)
	}

	public static render(
		result: Result,
		writer: printer_t
	): void {
		const container =
			document.createElement("div")

		this.renderInto(
			result,
			container
		)

		writer(container.innerHTML)
	}

	public static renderDateString(
		date: LocalDate | string
	): string {
		if (typeof date === "string")
			return dateString(date)

		return (
			`${date.getDay()} ` +
			`${monthNames[
				date.getMonth() - 1
			]} ` +
			`${date.getYear()}`
		)
	}
}