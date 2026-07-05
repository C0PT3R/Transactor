import SimDate from "../SimDate"
import { BusinessCalendar } from "./BusinessCalendar"

export type BusinessDayPolicy = "none" | "next" | "previous"

export function applyBusinessDayPolicy(date: SimDate, policy: BusinessDayPolicy, calendar: BusinessCalendar): SimDate {
    let adjusted = date.clone()

    if (policy === "none") return adjusted

    while (!calendar.isBusinessDay(adjusted)) {
        adjusted.addDays(policy === "next" ? 1 : -1)
    }

    return adjusted
}