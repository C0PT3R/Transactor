import SimDate from "../SimDate.js";
import Schedule from "./Schedule.js"


export default class BiweeklySchedule extends Schedule {

    #weekday


    constructor(startDate: SimDate, endDate?: SimDate) {
        super(startDate, endDate)
        this.#weekday = startDate.getWeekDay(true)
    }


    public matches(date: SimDate): boolean {
        if (!this.isActive(date)) return false
        
        return date.getWeekDay(true) === this.#weekday
    }

}