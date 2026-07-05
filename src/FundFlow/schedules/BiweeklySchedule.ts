import ScheduleData from "../types/ScheduleTypes.js";
import LocalDate from "../LocalDate.js";
import Schedule from "./Schedule.js"


export default class BiweeklySchedule extends Schedule {

    #day: number

    constructor(data: ScheduleData) {
        super(data)

        if (data.day === undefined)
            throw new Error('Parameter "day" must be defined for bi-weekly schedule')
        
        this.#day = data.day
    }

    public matches(date: LocalDate): boolean {
        if (!this.isActive(date)) return false
        
        return date.getWeekDay(true) === this.#day
    }

}