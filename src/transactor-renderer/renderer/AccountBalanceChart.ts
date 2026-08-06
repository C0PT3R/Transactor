import { LitElement, css, html, nothing, svg } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { dateString, money } from "./Formatters"
import ResultInterpreter from "../interpreter/ResultInterpreter"

import type { AccountResult, Result } from "../../transactor-common"

interface BalancePoint {
	readonly date: string
	readonly balance: number
	readonly label: string
}

interface RenderedBalancePoint extends BalancePoint {
	readonly x: number
	readonly y: number
}

@customElement("account-balance-chart")
export class AccountBalanceChart extends LitElement {

	@property({ attribute: false })
	public account?: AccountResult

	@property({ attribute: false })
	public result?: Result

	@property({ type: String })
	public startDate = ""

	@state()
	private hoveredPoint?: RenderedBalancePoint

	public static styles = css`
		:host { display: block; margin: 22px 0 18px; }
		.chart-card {
			position: relative;
			padding: 18px 18px 10px;
			border: 1px solid var(--border, #e4e8ef);
			border-radius: 14px;
			background: linear-gradient(180deg, var(--surface-strong, #142238), var(--surface-soft, #0d1929));
		}
		.chart-title {
			margin: 0 0 12px;
			font-size: .92rem;
			font-weight: 730;
			color: var(--text, #172033);
		}
		.chart-container { position: relative; }
		svg { display: block; width: 100%; height: auto; overflow: visible; }
		.grid-line { stroke: var(--border, #26354b); stroke-width: 1; pointer-events: none; }
		.zero-line { stroke: #637086; stroke-width: 1.25; pointer-events: none; }
		.balance-line {
			fill: none;
			stroke: var(--accent, #9b6cff);
			stroke-width: 2.5;
			stroke-linejoin: round;
			stroke-linecap: round;
			pointer-events: none;
		}
		.balance-area { fill: var(--accent, #9b6cff); opacity: .09; pointer-events: none; }
		.hover-zone { fill: transparent; cursor: crosshair; }
		.hover-zone:focus { outline: none; }
		.hover-guide { stroke: #7c7f91; stroke-width: 1; stroke-dasharray: 4 4; pointer-events: none; }
		.point { fill: var(--accent, #9b6cff); pointer-events: none; }
		.point.negative { fill: var(--negative, #c63131); }
		.point.active { stroke: #fff; stroke-width: 3; }
		.axis-label { fill: var(--muted, #9eacc0); font: 12px Inter, system-ui, sans-serif; pointer-events: none; }
		.axis-label.y { text-anchor: end; dominant-baseline: middle; }
		.axis-label.x.start { text-anchor: start; }
		.axis-label.x.end { text-anchor: end; }
		.tooltip {
			position: absolute;
			z-index: 10;
			min-width: 170px;
			padding: 10px 12px;
			border: 1px solid var(--border, #26354b);
			border-radius: 10px;
			background: #050b14;
			color: #fff;
			font: 13px Inter, system-ui, sans-serif;
			line-height: 1.45;
			box-shadow: 0 10px 30px rgb(15 23 42 / 25%);
			pointer-events: none;
			transform: translate(-50%, calc(-100% - 12px));
		}
		.tooltip-operation { font-weight: 700; }
		.tooltip-balance { margin-top: 3px; font-weight: 700; }
		.empty-message { margin: 18px 0 0; color: var(--muted, #687386); }
	`

	protected render() {
		if (!this.account || !this.result)
			return nothing

		const points = this.getPoints(this.account, this.result)

		if (points.length < 2) {
			return html`
				<p class="empty-message">
					Pas assez de données pour afficher le graphique.
				</p>
			`
		}

		return html`
			<section
				class="chart-card"
				aria-label="Évolution du solde du compte ${this.account.name}"
			>
				<h3 class="chart-title">Évolution du solde</h3>

				<div
					class="chart-container"
					@mouseleave=${this.clearHoveredPoint}
				>
					${this.renderChart(points)}
					${this.renderTooltip()}
				</div>
			</section>
		`
	}

	private getPoints(account: AccountResult, result: Result): BalancePoint[] {
		const points: BalancePoint[] = []
		const ledger = ResultInterpreter.for(result).getAccountLedger(account.id)
		const firstTransactionDate = ledger[0]?.transaction.chargedDate
		const openingDate = this.startDate || firstTransactionDate

		if (openingDate) {
			points.push({
				date: openingDate,
				balance: account.openingBalance,
				label: "Solde initial"
			})
		}

		for (const entry of ledger) {
			points.push({
				date: entry.transaction.chargedDate,
				balance: entry.ledgerEntry.balanceAfter,
				label: entry.operation.name
			})
		}

		return points
	}

	private renderChart(points: readonly BalancePoint[]) {
		const width = 1000
		const height = 320

		const margin = {
			top: 16,
			right: 18,
			bottom: 34,
			left: 90
		}

		const plotWidth = width - margin.left - margin.right
		const plotHeight = height - margin.top - margin.bottom

		const dates = points.map(point =>
			Date.parse(`${point.date}T00:00:00Z`)
		)

		const minDate = Math.min(...dates)
		const maxDate = Math.max(...dates)
		const dateRange = Math.max(1, maxDate - minDate)

		const balances = points.map(point => point.balance)
		const rawMin = Math.min(0, ...balances)
		const rawMax = Math.max(0, ...balances)
		const rawRange = Math.max(1, rawMax - rawMin)
		const padding = rawRange * 0.08

		const minBalance = rawMin - padding
		const maxBalance = rawMax + padding
		const balanceRange = maxBalance - minBalance

		const x = (date: number) =>
			margin.left + ((date - minDate) / dateRange) * plotWidth

		const y = (balance: number) =>
			margin.top
			+ ((maxBalance - balance) / balanceRange) * plotHeight

		const coordinates: RenderedBalancePoint[] = points.map(
			(point, index) => ({
				...point,
				x: x(dates[index] ?? minDate),
				y: y(point.balance)
			})
		)

		const linePoints = coordinates
			.map(point => `${point.x},${point.y}`)
			.join(" ")

		const baselineY = margin.top + plotHeight

		const areaPoints =
			`${margin.left},${baselineY} `
			+ `${linePoints} `
			+ `${margin.left + plotWidth},${baselineY}`

		const gridValues = Array.from(
			{ length: 5 },
			(_, index) => maxBalance - balanceRange * index / 4
		)

		return html`
			<svg
				viewBox="0 0 ${width} ${height}"
				role="img"
				aria-label="Graphique du solde du compte"
			>
				${gridValues.map(value => {
					const gridY = y(value)

					return svg`
						<line
							class="grid-line"
							x1=${margin.left}
							y1=${gridY}
							x2=${margin.left + plotWidth}
							y2=${gridY}
						></line>

						<text
							class="axis-label y"
							x=${margin.left - 10}
							y=${gridY}
						>
							${money(value)}
						</text>
					`
				})}

				${minBalance < 0 && maxBalance > 0
					? svg`
						<line
							class="zero-line"
							x1=${margin.left}
							y1=${y(0)}
							x2=${margin.left + plotWidth}
							y2=${y(0)}
						></line>
					`
					: nothing
				}

				<polygon
					class="balance-area"
					points=${areaPoints}
				></polygon>

				<polyline
					class="balance-line"
					points=${linePoints}
				></polyline>

				${coordinates.map((point, index) => {
					const previousPoint = coordinates[index - 1]
					const nextPoint = coordinates[index + 1]

					const left = previousPoint
						? (previousPoint.x + point.x) / 2
						: margin.left

					const right = nextPoint
						? (point.x + nextPoint.x) / 2
						: margin.left + plotWidth

					const isActive = this.hoveredPoint === point

					return svg`
						<g>
							<rect
								class="hover-zone"
								x=${left}
								y=${margin.top}
								width=${Math.max(1, right - left)}
								height=${plotHeight}
								tabindex="0"
								aria-label="${point.label}, ${dateString(point.date)}, ${money(point.balance)}"
								@mouseenter=${() => this.setHoveredPoint(point)}
								@mousemove=${() => this.setHoveredPoint(point)}
								@focus=${() => this.setHoveredPoint(point)}
								@blur=${this.clearHoveredPoint}
							></rect>

							${isActive
								? svg`
									<line
										class="hover-guide"
										x1=${point.x}
										y1=${margin.top}
										x2=${point.x}
										y2=${margin.top + plotHeight}
									></line>
								`
								: nothing
							}
						</g>
					`
				})}

				<text
					class="axis-label x start"
					x=${margin.left}
					y=${height - 8}
				>
					${dateString(points[0]!.date)}
				</text>

				<text
					class="axis-label x end"
					x=${margin.left + plotWidth}
					y=${height - 8}
				>
					${dateString(points[points.length - 1]!.date)}
				</text>
			</svg>
		`
	}

	private renderTooltip() {
		if (!this.hoveredPoint)
			return nothing

		const left = `${this.hoveredPoint.x / 10}%`
		const top = `${this.hoveredPoint.y / 3.2}%`

		return html`
			<div
				class="tooltip"
				style="left: ${left}; top: ${top};"
				role="tooltip"
			>
				<div class="tooltip-operation">
					${this.hoveredPoint.label}
				</div>

				<div>
					${dateString(this.hoveredPoint.date)}
				</div>

				<div class="tooltip-balance">
					${money(this.hoveredPoint.balance)}
				</div>
			</div>
		`
	}

	private setHoveredPoint(point: RenderedBalancePoint) {
		this.hoveredPoint = point
	}

	private clearHoveredPoint() {
		this.hoveredPoint = undefined
	}
}