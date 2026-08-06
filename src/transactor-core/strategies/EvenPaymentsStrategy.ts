import { LocalDate } from "@c0pt3r/local-date"
import FundingOperation from "../operations/FundingOperation"
import ScheduleFactory from "../schedules/ScheduleFactory"
import type Operation from "../operations/Operation"
import type PlanningStrategy from "./PlanningStrategy"
import type { PlanningStrategyContext } from "./PlanningStrategy"
import type { EvenPaymentsStrategyData } from "../model/FinancialModelTypes"

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

		const schedule = ScheduleFactory.create(this.data.schedule, startDate, endDate)

		return [new FundingOperation(
			this.data.name ?? "Funding",
			this.data.target,
			this.data.from,
			schedule
		)]
	}
}
