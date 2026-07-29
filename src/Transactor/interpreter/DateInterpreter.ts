import { LocalDate } from "@c0pt3r/local-date"


export interface DateRange {
	readonly startDate: string
	readonly endDate: string
}

export function parseDate(date: string): LocalDate | null {
	const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date)

	if (!match)
		return null

	const year = Number(match[1])
	const month = Number(match[2])
	const day = Number(match[3])

	try {
		return new LocalDate(year, month, day)
	} catch {
		return null
	}
}

export function dateDuringPeriod(date: string, period: DateRange): boolean {
	const value = parseDate(date)
	const startDate = parseDate(period.startDate)
	const endDate = parseDate(period.endDate)

	return value !== null && startDate !== null && endDate !== null &&
		value.isBetween(startDate, endDate)
}
