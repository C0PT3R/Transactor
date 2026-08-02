import Operation from "./Operation"
import Schedule from "./schedules/Schedule"
import { OperationData } from "./types/FinancialModelTypes"


export default class InterestOperation extends Operation {

	public readonly rate: number

	public constructor(accountId: string, rate: number, schedule: Schedule) {
		if (!Number.isFinite(rate) || rate < 0)
			throw new Error("Interest rate must be a non-negative finite number.")

		const data: OperationData = {
			name: "Intérêts",
			amount: null,
			to: accountId,
			schedule: {
				period: schedule.type
			}
		}

		super(data, schedule, {
			kind: "interest",
			origin: "generated"
		})

		this.rate = rate
	}

}
