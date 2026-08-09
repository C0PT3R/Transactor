import { LocalDate } from "@c0pt3r/local-date"
import FundingOperation from "../operations/FundingOperation"
import { currencyToCents } from "../Money"
import FundingAdjustmentOperation from "../operations/FundingAdjustmentOperation"
import OnceSchedule from "../schedules/OnceSchedule"
import ScheduleFactory from "../schedules/ScheduleFactory"
import type Operation from "../operations/Operation"
import type PlanningStrategy from "./PlanningStrategy"
import type { PlanningStrategyContext } from "./PlanningStrategy"
import type { EvenPaymentsStrategyData, ScheduleData } from "../model/FinancialModelTypes"

export default class EvenPaymentsStrategy implements PlanningStrategy {

	private readonly data: EvenPaymentsStrategyData

	public constructor(data: EvenPaymentsStrategyData) {
		this.data = data
	}

	public generateOperations(context: PlanningStrategyContext): readonly Operation[] {
		const configuredStart = this.data.schedule.startDate
			? LocalDate.fromISO(this.data.schedule.startDate)
			: context.startDate

		const configuredEnd = this.data.schedule.endDate
			? LocalDate.fromISO(this.data.schedule.endDate)
			: context.endDate

		const startDate = configuredStart < context.startDate
			? context.startDate
			: configuredStart

		const endDate = configuredEnd > context.endDate
			? context.endDate
			: configuredEnd

		if (startDate > endDate) return []

		if (this.data.schedule.period === "once")
			throw new Error("Even-payments strategy requires a recurring schedule.")

		const schedule = ScheduleFactory.create(this.data.schedule, startDate, endDate)
		const minimumBalance = currencyToCents(
			this.data.minimumBalance ?? 0,
			`Minimum balance for strategy "${this.data.name ?? "Funding"}"`
		)

		const fundingOperation = new FundingOperation(
			this.data.name ?? "Funding",
			this.data.target,
			this.data.from,
			schedule,
			minimumBalance
		)

		if (this.data.adjustInitialBalance === false)
			return [fundingOperation]

		const adjustmentData: ScheduleData = {
			period: "once",
			date: startDate.toJSON()
		}
		const adjustmentSchedule = new OnceSchedule(adjustmentData, startDate, startDate)
		const adjustmentName = `${this.data.name ?? "Funding"} - initial adjustment`
		const inflowAdjustment = new FundingAdjustmentOperation(
			adjustmentName,
			this.data.target,
			this.data.from,
			adjustmentSchedule,
			fundingOperation,
			"inflow"
		)
		const outflowAdjustment = new FundingAdjustmentOperation(
			adjustmentName,
			this.data.target,
			this.data.from,
			adjustmentSchedule,
			fundingOperation,
			"outflow"
		)

		return [inflowAdjustment, outflowAdjustment, fundingOperation]
	}
}
