import { LocalDate } from "@c0pt3r/local-date"
import FundingOperation from "../operations/FundingOperation"
import ScheduleFactory from "../schedules/ScheduleFactory"
import type Account from "./Account"
import type Operation from "../operations/Operation"
import type { AccountBehaviorContext, FundingStrategy } from "./AccountBehavior"
import type { EvenPaymentsFundingStrategyData } from "../model/FinancialModelTypes"


export default class EvenPaymentsFundingStrategy implements FundingStrategy {

	public readonly behaviorType = "fundingStrategy" as const
	private readonly data: EvenPaymentsFundingStrategyData

	public constructor(data: EvenPaymentsFundingStrategyData) {
		this.data = data
	}

	public generateOperations(account: Account, context: AccountBehaviorContext): readonly Operation[] {
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
			account.id,
			this.data.from,
			schedule
		)]
	}

}
