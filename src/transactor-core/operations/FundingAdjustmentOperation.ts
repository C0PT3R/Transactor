import Operation from "./Operation"
import type FundingOperation from "./FundingOperation"
import Schedule from "../schedules/Schedule"
import type { OperationData } from "../model/FinancialModelTypes"

export type FundingAdjustmentDirection = "inflow" | "outflow"

export default class FundingAdjustmentOperation extends Operation {

	public readonly fundingOperation: FundingOperation
	public readonly adjustmentDirection: FundingAdjustmentDirection

	public constructor(
		name: string,
		accountId: string,
		counterpartyId: string | undefined,
		schedule: Schedule,
		fundingOperation: FundingOperation,
		adjustmentDirection: FundingAdjustmentDirection
	) {
		const data: OperationData = adjustmentDirection === "inflow"
			? {
				name,
				amount: null,
				from: counterpartyId,
				to: accountId,
				schedule: { period: schedule.type }
			}
			: {
				name,
				amount: null,
				from: accountId,
				to: counterpartyId,
				schedule: { period: schedule.type }
			}

		super(data, schedule, {
			kind: "funding",
			origin: "generated"
		})

		this.fundingOperation = fundingOperation
		this.adjustmentDirection = adjustmentDirection
	}
}
