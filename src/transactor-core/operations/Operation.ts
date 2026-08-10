import { LocalDate } from "@c0pt3r/local-date"
import Schedule from "../schedules/Schedule"
import { applyBusinessDayPolicy } from "../calendar/BusinessDayPolicy"
import { BusinessCalendar } from "../calendar/BusinessCalendar"
import IdGenerator from "../IdGenerator"
import { assertCents, currencyToCents } from "../Money"
import type { OperationKind, OperationOrigin, ScheduleType } from "../../transactor-common"
import { periodsPerYear } from "../Annualization"
import type { OperationData } from "../model/FinancialModelTypes"


export interface OperationMetadata {
	readonly kind?: OperationKind
	readonly origin?: OperationOrigin
}

export default class Operation {

	public readonly id: string
	public readonly name: string
	public readonly schedule: Schedule
	public readonly from?: string
	public readonly to?: string
	public readonly kind: OperationKind
	public readonly origin: OperationOrigin
	private amount: number | null = null

	public constructor(
		data: OperationData,
		schedule: Schedule,
		metadata: OperationMetadata = {}
	) {
		if (!data.from && !data.to)
			throw new Error(`Operation "${data.name}" must define from or to`)

		this.id = data.id ?? IdGenerator.generate()
		this.name = data.name
		this.from = data.from
		this.to = data.to
		this.schedule = schedule
		this.kind = metadata.kind ?? "standard"
		this.origin = metadata.origin ?? "configured"
		this.setConfiguredAmount(data.amount)
	}

	/**
	 * Resolves the real posting date from the scheduled occurrence date.
	 */
	public resolveTransactionDate(scheduledDate: LocalDate, calendar: BusinessCalendar): LocalDate {
		const adjustedDate = applyBusinessDayPolicy(
			scheduledDate,
			this.schedule.businessDayPolicy,
			calendar
		)

		return applyBusinessDayPolicy(
			adjustedDate.plusDays(this.schedule.processingDelay),
			this.schedule.businessDayPolicy,
			calendar
		)
	}

	public convertTo(
		period: Exclude<ScheduleType, "once">,
		referenceDate: LocalDate
	): number {
		if (this.amount === null || this.schedule.type === "once") return 0

		const yearlyAmount = this.amount * periodsPerYear(this.schedule.type, referenceDate)
		return Math.round(yearlyAmount / periodsPerYear(period, referenceDate))
	}

	public isIncome(): boolean {
		return !this.from && !!this.to
	}

	public isExpense(): boolean {
		return !!this.from && !this.to
	}

	public isTransfer(): boolean {
		return !!this.from && !!this.to
	}

	public isInterestPayment(): boolean {
		return this.kind === "interestPayment"
	}

	public isFunding(): boolean {
		return this.kind === "funding"
	}

	public isGenerated(): boolean {
		return this.origin === "generated"
	}

	public isConfigured(): boolean {
		return this.origin === "configured"
	}

	public getScheduleType(): ScheduleType {
		return this.schedule.type
	}

	private setConfiguredAmount(value: number | null): void {
		if (value === null) {
			this.amount = null
			return
		}

		if (value < 0)
			throw new Error(`Amount for operation "${this.name}" cannot be negative`)

		this.amount = currencyToCents(value, `Amount for operation "${this.name}"`)
	}

	public resolveAmount(amount: number): void {
		if (this.amount !== null)
			throw new Error(`Operation "${this.name}" already has an amount`)

		assertCents(amount, `Resolved amount for operation "${this.name}"`)

		if (amount < 0)
			throw new Error(`Amount for operation "${this.name}" cannot be negative`)

		this.amount = amount
	}

	/**
	 * Updates an amount that belongs to generated compiler state. This is used by
	 * iterative resolvers whose values may change until the simulation converges.
	 */
	public updateResolvedAmount(amount: number): number {
		if (!this.isGenerated())
			throw new Error(`Only generated operations can have their resolved amount updated.`)

		assertCents(amount, `Resolved amount for operation "${this.name}"`)

		if (amount < 0)
			throw new Error(`Amount for operation "${this.name}" cannot be negative`)

		const previous = this.amount ?? 0
		this.amount = amount
		return Math.abs(amount - previous)
	}

	public getAmount(): number | null {
		return this.amount
	}

}
