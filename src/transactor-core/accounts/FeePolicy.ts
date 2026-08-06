import { LocalDate } from "@c0pt3r/local-date"
import Operation from "../operations/Operation"
import ScheduleFactory from "../schedules/ScheduleFactory"
import type Account from "./Account"
import type AccountPolicy from "./AccountPolicy"
import type { AccountPolicyContext } from "./AccountPolicy"
import type { FeePolicyData } from "../model/FinancialModelTypes"

export default class FeePolicy implements AccountPolicy {

	private readonly data: FeePolicyData

	public constructor(data: FeePolicyData) {
		this.data = data
	}

	public generateOperations(account: Account, context: AccountPolicyContext): readonly Operation[] {
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

		return [new Operation({
			name: this.data.name ?? "Account fee",
			amount: this.data.amount,
			from: account.id,
			schedule: this.data.schedule
		}, schedule, { origin: "generated" })]
	}
}
