import { LocalDate } from "@c0pt3r/local-date"


export interface DateRange {
	readonly startDate: string
	readonly endDate: string
}

export function dateDuringPeriod(date: string, period: DateRange): boolean {
	const value = LocalDate.fromISO(date)
	const startDate = LocalDate.fromISO(period.startDate)
	const endDate = LocalDate.fromISO(period.endDate)

	return value !== null && startDate !== null && endDate !== null &&
		value.isBetween(startDate, endDate)
}
