import Operation from "../Operation"
import Schedule from "../schedules/Schedule"
import type { OperationData } from "../types/FinancialModelTypes"


export default class FundingOperation extends Operation {

	public constructor(name: string, accountId: string, from: string | undefined, schedule: Schedule) {
		const data: OperationData = {
			name,
			amount: null,
			from,
			to: accountId,
			schedule: { period: schedule.type }
		}

		super(data, schedule, {
			kind: "funding",
			origin: "generated"
		})
	}

}
