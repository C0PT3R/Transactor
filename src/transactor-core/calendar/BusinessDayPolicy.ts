import { LocalDate } from "@c0pt3r/local-date"
import { BusinessCalendar } from "./BusinessCalendar"

export type BusinessDayPolicy = "none" | "next" | "previous"


export function applyBusinessDayPolicy(date: LocalDate, policy: BusinessDayPolicy, calendar: BusinessCalendar): LocalDate {
    let adjusted = date

    if (policy === "none") return adjusted

    while (!calendar.isBusinessDay(adjusted)) {
        adjusted = adjusted.plusDays(policy === "next" ? 1 : -1)
    }

    return adjusted
}