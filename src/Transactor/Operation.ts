import { LocalDate } from "@c0pt3r/local-date"
import Schedule from "./schedules/Schedule"
import { applyBusinessDayPolicy } from "./calendar/BusinessDayPolicy"
import { BusinessCalendar } from "./calendar/BusinessCalendar"
import IdGenerator from "./IdGenerator"
import type { ScheduleType } from "./schedules/scheduleRegistry"
import type { OperationData } from "./types/ScenarioTypes"


export default class Operation {

	public readonly id: string
	public readonly name: string
	public readonly schedule: Schedule
	public readonly from?: string
	public readonly to?: string
	private amount: number | null = null

	private static readonly PERIODS_PER_YEAR: Record<ScheduleType, number> = {
		daily: 365.25,
		weekly: 52,
		biWeekly: 26,
		monthly: 12,
		yearly: 1,
	} as const

	public constructor(data: OperationData, schedule: Schedule) {
		if (!data.from && !data.to)
			throw new Error(`Operation "${data.name}" must define from or to`)

		this.id = data.id ?? IdGenerator.generate()
		this.name = data.name
		this.from = data.from
		this.to = data.to
		this.schedule = schedule
		this.setAmount(data.amount)
	}

	/**
	 * Don't listen to stupid AI. This function does exactly what it's supposed to do.
	 */
	public resolveTransactionDate(scheduledDate: LocalDate, calendar: BusinessCalendar): LocalDate {
		const adjustedDate = applyBusinessDayPolicy(
			scheduledDate,
			this.schedule.businessDayPolicy,
			calendar
		)

		return applyBusinessDayPolicy(
			adjustedDate.addDays(this.schedule.processingDelay),
			this.schedule.businessDayPolicy,
			calendar
		)
	}

	public convertTo(period: ScheduleType): number {
		if (this.amount === null) return 0

		const yearlyAmount = this.amount * Operation.PERIODS_PER_YEAR[this.schedule.type]
		return yearlyAmount / Operation.PERIODS_PER_YEAR[period]
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

	public isAutomaticPayment(): boolean {
		return !this.from &&
			!!this.to &&
			this.getAmount() === null
	}

	public getScheduleType(): ScheduleType {
		return this.schedule.type
	}
	
	private setAmount(value: number | null): void {
		if (value === null) {
			this.amount = null
			return
		}

        if (!Number.isFinite(value))
            throw new Error(`Amount for operation "${this.name}" must be a finite number`)

        if (value < 0)
            throw new Error(`Amount for operation "${this.name}" cannot be negative`)

		this.amount = value
	}

	public getAmount(): number | null {
		return this.amount
	}

}