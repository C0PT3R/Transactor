import Operation from "./Operation"
import Schedule from "../schedules/Schedule"
import type { OperationData } from "../model/FinancialModelTypes"


export default class InterestPaymentOperation extends Operation {

	public readonly rate: number

	public constructor(accountId: string, rate: number, schedule: Schedule) {
		if (!Number.isFinite(rate) || rate < 0)
			throw new Error("Interest rate must be a non-negative finite number.")

		const data: OperationData = {
			name: "Interest",
			amount: null,
			to: accountId,
			schedule: { period: schedule.type }
		}

		super(data, schedule, {
			kind: "interestPayment",
			origin: "generated"
		})

		this.rate = rate
	}

}
