import BiweeklySchedule from "./BiweeklySchedule.js"
import MonthlySchedule from "./MonthlySchedule.js"
import WeeklySchedule from "./WeeklySchedule.js"
import YearlySchedule from "./YearlySchedule.js"


export const registry = {
    weekly: WeeklySchedule,
    biWeekly: BiweeklySchedule,
    monthly: MonthlySchedule,
    yearly: YearlySchedule
} as const


export type ScheduleType = keyof typeof registry