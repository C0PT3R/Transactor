import LocalDate from "../LocalDate"
import { BusinessCalendar } from "./BusinessCalendar"

export type BusinessDayPolicy = "none" | "next" | "previous"

export function applyBusinessDayPolicy(date: LocalDate, policy: BusinessDayPolicy, calendar: BusinessCalendar): LocalDate {
    let adjusted = date.clone()

    if (policy === "none") return adjusted

    while (!calendar.isBusinessDay(adjusted)) {
        adjusted.addDays(policy === "next" ? 1 : -1)
    }

    return adjusted
}