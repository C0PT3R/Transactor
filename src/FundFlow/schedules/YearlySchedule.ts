import SimDate from "../SimDate.js"
import Schedule from "./Schedule.js"
import { ScheduleParams } from "./scheduleRegistry.js"


export default class YearlySchedule extends Schedule {

    #day: number
    #month: number

    constructor(scheduleParams: ScheduleParams) {
        super(scheduleParams)

        if (scheduleParams.day === undefined || scheduleParams.month === undefined)
            throw new Error('Parameters "day" and "month" must both be defined for yearly schedule')
        
        this.#day = scheduleParams.day
        this.#month = scheduleParams.month
    }

    matches(date: SimDate): boolean {
        if (!this.isActive(date)) return false
        
        return (date.month === this.#month && date.day === this.#day)
    }

}