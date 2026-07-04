import SimDate from "../SimDate.js";
import Schedule from "./Schedule.js"
import { ScheduleParams } from "./scheduleRegistry.js";


export default class MonthlySchedule extends Schedule {

    #day: number

    constructor(scheduleParams: ScheduleParams) {
        super(scheduleParams)

        if (scheduleParams.day === undefined)
            throw new Error('Parameter "day" must be defined for monthly schedule')
        
        this.#day = scheduleParams.day
    }
    
    public matches(date: SimDate): boolean {
        if (!this.isActive(date)) return false

        const targetDay = (this.#day === -1) ? date.lastDayOfMonth : this.#day
        return date.day === targetDay
    }

}