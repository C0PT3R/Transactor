import ScheduleData from "../types/ScheduleTypes"
import { registry } from "./scheduleRegistry"


export default class ScheduleFactory {

    public static create(data: ScheduleData) {
        const ScheduleClass = registry[data.type]

        if (!ScheduleClass)
            throw new Error(`"${data.type}" is not a constructible schedule`)

        return new ScheduleClass(data)
    }

}