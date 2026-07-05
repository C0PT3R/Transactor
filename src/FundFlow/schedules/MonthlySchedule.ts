import ScheduleData from "../types/ScheduleTypes.js";
import SimDate from "../SimDate.js";
import Schedule from "./Schedule.js"


export default class MonthlySchedule extends Schedule {

    #day: number

    constructor(data: ScheduleData) {
        super(data)

        if (data.day === undefined)
            throw new Error('Parameter "day" must be defined for monthly schedule')
        
        this.#day = data.day
    }
    
    public matches(date: SimDate): boolean {
        if (!this.isActive(date)) return false

        const targetDay = (this.#day === -1) ? date.getLastDayOfMonth() : this.#day
        return date.getDay() === targetDay
    }

}