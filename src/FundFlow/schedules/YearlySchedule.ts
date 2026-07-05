import ScheduleData from "../types/ScheduleTypes.js"
import LocalDate from "../LocalDate.js"
import Schedule from "./Schedule.js"


export default class YearlySchedule extends Schedule {

    #day: number
    #month: number

    constructor(data: ScheduleData) {
        super(data)

        if (data.day === undefined || data.month === undefined)
            throw new Error('Parameters "day" and "month" must both be defined for yearly schedule')
        
        this.#day = data.day
        this.#month = data.month
    }

    matches(date: LocalDate): boolean {
        if (!this.isActive(date)) return false
        
        return (date.getMonth() === this.#month && date.getDay() === this.#day)
    }

}