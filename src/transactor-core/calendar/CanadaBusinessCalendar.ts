import { LocalDate } from "@c0pt3r/local-date"
import { BusinessCalendar } from "./BusinessCalendar"


export class CanadaBusinessCalendar extends BusinessCalendar {

    protected isHoliday(date: LocalDate): boolean {
        const y = date.year
        const m = date.month
        const d = date.day

        // New Year's Day
        if (m === 1 && d === 1)
            return true

        // Canada Day
        if (m === 7 && d === 1)
            return true

        // Christmas
        if (m === 12 && d === 25)
            return true

        // Boxing Day
        if (m === 12 && d === 26)
            return true

        // Good Friday
        if (this.isGoodFriday(date))
            return true

        // Labour Day
        if (this.isFirstMondayOfSeptember(date))
            return true

        // Thanksgiving
        if (this.isSecondMondayOfOctober(date))
            return true

        return false
    }

    private isFirstMondayOfSeptember(date: LocalDate): boolean {
        return (
            date.month === 9 &&
            date.dayOfWeek === 1 &&
            date.day <= 7
        )
    }

    private isSecondMondayOfOctober(date: LocalDate): boolean {
        return (
            date.month === 10 &&
            date.dayOfWeek === 1 &&
            date.day >= 8 &&
            date.day <= 14
        )
    }

    private isGoodFriday(date: LocalDate): boolean {
        const goodFriday = this.calculateEaster(date.year).plusDays(-2)
        return date.equals(goodFriday)
    }

    /**
     * Meeus/Jones/Butcher algorithm
     */
    private calculateEaster(year: number): LocalDate {
        const a = year % 19
        const b = Math.floor(year / 100)
        const c = year % 100
        const d = Math.floor(b / 4)
        const e = b % 4
        const f = Math.floor((b + 8) / 25)
        const g = Math.floor((b - f + 1) / 3)
        const h = (19 * a + b - d - g + 15) % 30
        const i = Math.floor(c / 4)
        const k = c % 4
        const l = (32 + 2 * e + 2 * i - h - k) % 7
        const m = Math.floor((a + 11 * h + 22 * l) / 451)

        const month = Math.floor((h + l - 7 * m + 114) / 31)
        const day = ((h + l - 7 * m + 114) % 31) + 1

        return new LocalDate(year, month, day)
    }
    
}