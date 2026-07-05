import ScheduleData from "../types/ScheduleTypes.js"
import { registry } from "./scheduleRegistry.js"


export default class ScheduleFactory {

    public static create(data: ScheduleData) {
        const Ctor = registry[data.type]

        if (!Ctor) throw new Error(`${data.type} is an unknown schedule type`)

        return new Ctor(data)
    }

}