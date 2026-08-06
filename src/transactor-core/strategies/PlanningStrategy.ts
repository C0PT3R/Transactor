import type { LocalDate } from "@c0pt3r/local-date"
import type Operation from "../operations/Operation"

export interface PlanningStrategyContext {
	readonly startDate: LocalDate
	readonly endDate: LocalDate
}

/**
 * A rule owned by the financial plan that determines how the plan should be managed.
 */
export default interface PlanningStrategy {
	generateOperations(context: PlanningStrategyContext): readonly Operation[]
}
