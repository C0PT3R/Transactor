import Operation from "../operations/Operation"
import type { ScheduleType } from "../schedules/scheduleRegistry"


export default class Totals {

	public daily = 0
	public weekly = 0
	public biWeekly = 0
	public monthly = 0
	public yearly = 0

	public static fromOperations(operations: Iterable<Operation>): Totals {
		const totals = new Totals()

		for (const operation of operations)
			totals.add(operation)

		return totals
	}

	public add(operation: Operation): this {
		this.daily += operation.convertTo("daily")
		this.weekly += operation.convertTo("weekly")
		this.biWeekly += operation.convertTo("biWeekly")
		this.monthly += operation.convertTo("monthly")
		this.yearly += operation.convertTo("yearly")

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

	public get(period: ScheduleType): number {
		return this[period]
	}

}