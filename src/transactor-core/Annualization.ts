import { LocalDate } from "@c0pt3r/local-date"
import type { ScheduleType } from "../transactor-common"

/**
 * Returns the conventional number of occurrences per year for a recurring
 * schedule. Daily schedules use the actual length of the referenced year.
 */
export function periodsPerYear(
	period: Exclude<ScheduleType, "once">,
	date: LocalDate
): number {
	switch (period) {
		case "daily": return date.daysInYear
		case "weekly": return 52
		case "biWeekly": return 26
		case "monthly": return 12
		case "yearly": return 1
	}
}

/**
 * Prorates a yearly amount over an inclusive date range using the actual
 * number of days in every calendar year touched by the range.
 */
export function prorateAnnualAmount(
	annualAmount: number,
	startDate: LocalDate,
	endDate: LocalDate
): number {
	if (endDate < startDate)
		throw new Error("Annual amount cannot be prorated over a negative date range.")

	let total = 0
	let segmentStart = startDate

	while (segmentStart <= endDate) {
		const yearEnd = new LocalDate(segmentStart.year, 12, 31)
		const segmentEnd = yearEnd < endDate ? yearEnd : endDate
		const dayCount = segmentEnd.epochDay - segmentStart.epochDay + 1

		total += annualAmount * dayCount / segmentStart.daysInYear
		segmentStart = segmentEnd.plusDays(1)
	}

	return total
}
