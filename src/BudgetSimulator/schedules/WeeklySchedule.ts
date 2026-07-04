import SimDate from "../SimDate.js";
import Schedule from "./Schedule.js"


export default class WeeklySchedule extends Schedule {

    #weekday


    constructor(weekday: number, startDate?: SimDate, endDate?: SimDate) {
        super(startDate, endDate)
        this.#weekday = weekday
    }


    public matches(date: SimDate): boolean {
        if (!this.isActive(date)) return false
        
        return date.getWeekDay() === this.#weekday
    }

}