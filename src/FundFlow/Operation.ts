import OperationData, { Transform } from "./types/OperationTypes";
import Schedule from "./schedules/Schedule"
import ScheduleFactory from "./schedules/ScheduleFactory"
import { applyBusinessDayPolicy } from "./calendar/BusinessDayPolicy";
import { BusinessCalendar } from "./calendar/BusinessCalendar";
import LocalDate from "./LocalDate";
import type { ScheduleType } from "./schedules/scheduleRegistry";

export type OperationType = "payment" | "bill"

const PERIODS_PER_YEAR: Record<ScheduleType, number> = {
	daily: 365.25,
	weekly: 52,
	biWeekly: 26,
	monthly: 12,
	yearly: 1,
} as const


export default class Operation {

	public readonly type: OperationType
	public readonly name: string
	public readonly schedule: Schedule
	private amount!: number

	public constructor(type: OperationType, data: OperationData) {
		this.type = type
		this.name = data.name
		this.schedule = ScheduleFactory.create(data.schedule)
		this.amount = data.amount
	}

	public transform(params: Transform["params"]) {
		if (undefined !== params.amount) this.setAmount(params.amount)
		//if (undefined !== params.day)    this.#day = params.day
		//if (undefined !== params.recurrence) this.#recurrence = params.recurrence 
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
		const yearlyAmount = this.amount * PERIODS_PER_YEAR[this.schedule.type]
		return yearlyAmount / PERIODS_PER_YEAR[period]
	}

	public isPayment() {
		return this.type === "payment"
	}

	public isBill() {
		return this.type === "bill"
	}
	
	public setAmount(value: number) {
		if (value === undefined) {
			this.amount = 0
			return
		}

        if (!Number.isFinite(value))
            throw new Error("Amount must be a finite number")

        if (value < 0)
            throw new Error("Amount cannot be negative")

		this.amount = value
	}

	public getAmount() {
		return this.amount
	}

}