import OnceSchedule from "./OnceSchedule"
import BiweeklySchedule from "./BiweeklySchedule"
import MonthlySchedule from "./MonthlySchedule"
import WeeklySchedule from "./WeeklySchedule"
import YearlySchedule from "./YearlySchedule"
import type { ScheduleType } from "../../transactor-common"


export const registry = {
	daily: null,
	once: OnceSchedule,
	weekly: WeeklySchedule,
	biWeekly: BiweeklySchedule,
	monthly: MonthlySchedule,
	yearly: YearlySchedule
} as const satisfies Record<ScheduleType, unknown>
