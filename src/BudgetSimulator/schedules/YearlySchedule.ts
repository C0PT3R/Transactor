import SimDate from "../SimDate.js"
import Schedule from "./Schedule.js"


export default class YearlySchedule extends Schedule {

    #day
    #month


    constructor(day: number, month: number, startDate?: SimDate, endDate?: SimDate) {
        super(startDate, endDate)
        this.#day = day
        this.#month = month
    }


    matches(date: SimDate) {
        if (!this.isActive(date)) return false
        
        return (date.month === this.#month && date.day === this.#day)
    }

}