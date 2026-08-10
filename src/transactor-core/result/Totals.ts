import { LocalDate } from "@c0pt3r/local-date"
import Operation from "../operations/Operation"
import type { ScheduleType } from "../../transactor-common"


export default class Totals {

	public daily = 0
	public weekly = 0
	public biWeekly = 0
	public monthly = 0
	public yearly = 0

	public static fromOperations(operations: Iterable<Operation>, referenceDate: LocalDate): Totals {
		const totals = new Totals()

		for (const operation of operations)
			totals.add(operation, referenceDate)

		return totals
	}

	public add(operation: Operation, referenceDate: LocalDate): this {
		this.daily += operation.convertTo("daily", referenceDate)
		this.weekly += operation.convertTo("weekly", referenceDate)
		this.biWeekly += operation.convertTo("biWeekly", referenceDate)
		this.monthly += operation.convertTo("monthly", referenceDate)
		this.yearly += operation.convertTo("yearly", referenceDate)

		return this
	}

	public subtract(other: Totals): Totals {
		const result = new Totals()

		result.daily = this.daily - other.daily
		result.weekly = this.weekly - other.weekly
		result.biWeekly = this.biWeekly - other.biWeekly
		result.monthly = this.monthly - other.monthly
		result.yearly = this.yearly - other.yearly

		return result
	}

	public get(period: Exclude<ScheduleType, "once">): number {
		return this[period]
	}

}