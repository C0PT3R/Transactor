import { LocalDate } from "@c0pt3r/local-date"
import InterestPaymentOperation from "../operations/InterestPaymentOperation"
import ScheduleFactory from "../schedules/ScheduleFactory"
import type Account from "./Account"
import type Operation from "../operations/Operation"
import type AccountPolicy from "./AccountPolicy"
import type { AccountPolicyContext } from "./AccountPolicy"
import type { InterestPolicyData, ScheduleData } from "../model/FinancialModelTypes"


export default class InterestPolicy implements AccountPolicy {

	public readonly behaviorType = "policy" as const
	private readonly data: InterestPolicyData

	public constructor(data: InterestPolicyData) {
		this.data = data
	}

	public generateOperations(account: Account, context: AccountPolicyContext): readonly Operation[] {
		if ((this.data.calculationPeriod ?? "daily") !== "daily") {
			throw new Error(
				`Account "${account.name}" uses an unsupported interest calculation period.`
			)
		}

		const scheduleData: ScheduleData = {
			period: "monthly",
			day: 1,
			...this.data.paymentSchedule
		}

		/*
		 * The first generated payment must follow at least one day of accrual.
		 * Starting the schedule one day after the model excludes a payment on
		 * the model's opening date while preserving the default first-of-month rule.
		 */
		const configuredStart = scheduleData.startDate
			? LocalDate.fromISO(scheduleData.startDate)
			: context.startDate

		const configuredEnd = scheduleData.endDate
			? LocalDate.fromISO(scheduleData.endDate)
			: context.endDate

		const startDate = configuredStart < context.startDate
			? context.startDate
			: configuredStart

		const endDate = configuredEnd > context.endDate
			? context.endDate
			: configuredEnd

		if (startDate > endDate) return []

		const schedule = ScheduleFactory.create(scheduleData, startDate, endDate)
		return [new InterestPaymentOperation(account.id, this.data.rate, schedule)]
	}

}
