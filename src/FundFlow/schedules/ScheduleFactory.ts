import { registry, ScheduleParams } from "./scheduleRegistry.js"


export default class ScheduleFactory {

    public static create(scheduleParams: ScheduleParams) {
        const Ctor = registry[scheduleParams.type]

        if (!Ctor) throw new Error(`${scheduleParams.type} is an unknown schedule type`)

        return new Ctor(scheduleParams)
    }

}