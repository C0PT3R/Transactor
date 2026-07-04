import SimDate from "../SimDate.js";
import Schedule from "./Schedule.js"


export default class MonthlySchedule extends Schedule {

    #day


    constructor(day: number, startDate?: SimDate, endDate?: SimDate) {
        super(startDate, endDate)
        this.#day = day
    }


    public matches(date: SimDate) {
        if (!this.isActive(date)) return false

        const targetDay = (this.#day === -1) ? date.lastDayOfMonth : this.#day
        return date.day === targetDay
    }

}