import { LocalDate } from "@c0pt3r/local-date"
import type { DateRange } from "../interpreter"


const monthNames = [
	"Janvier",
	"Février",
	"Mars",
	"Avril",
	"Mai",
	"Juin",
	"Juillet",
	"Août",
	"Septembre",
	"Octobre",
	"Novembre",
	"Décembre"
]

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
	style: "currency",
	currency: "CAD",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
})

function monthName(month: number): string {
	return monthNames[month - 1] ?? String(month)
}

export function dateString(date: LocalDate | string): string {
	const value = typeof date === "string" ? LocalDate.fromISO(date) : date

	if (!value)
		return String(date)

	return `${value.getDay()} ${monthName(value.getMonth())} ${value.getYear()}`
}

export function periodString(period: DateRange): string {
	if (period.startDate === period.endDate)
		return dateString(period.startDate)

	return `${dateString(period.startDate)} — ${dateString(period.endDate)}`
}

export function monthTitle(date: string): string {
	const value = LocalDate.fromISO(date)

	if (!value)
		return date

	return `${monthName(value.getMonth())} ${value.getYear()}`
}

export function monthKey(date: string): string {
	const value = LocalDate.fromISO(date)

	if (!value)
		return date

	return `${value.getYear()}-${String(value.getMonth()).padStart(2, "0")}`
}

export function dayString(date: string): string {
	return String(LocalDate.fromISO(date)?.getDay() ?? date)
}

export function money(amount: number, roundUp: boolean = false): string {
	const cents = roundUp ? Math.ceil(amount) : Math.round(amount)
	return currencyFormatter.format(cents / 100)
}
