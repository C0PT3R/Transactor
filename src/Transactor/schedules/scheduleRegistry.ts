import BiweeklySchedule from "./BiweeklySchedule"
import MonthlySchedule from "./MonthlySchedule"
import WeeklySchedule from "./WeeklySchedule"
import YearlySchedule from "./YearlySchedule"


export const registry = {
    daily: null,
    weekly: WeeklySchedule,
    biWeekly: BiweeklySchedule,
    monthly: MonthlySchedule,
    yearly: YearlySchedule
} as const

export type ScheduleType = keyof typeof registry