import { LocalDate } from "@c0pt3r/local-date"
import { registry } from "./scheduleRegistry"
import type { ScheduleData } from "../types/FinancialModelTypes"


export default class ScheduleFactory {

    public static create(data: ScheduleData, startDate: LocalDate, endDate: LocalDate) {
        const ScheduleClass = registry[data.period]

        if (!ScheduleClass)
            throw new Error(`"${data.period}" is not a constructible schedule`)

        return new ScheduleClass(data, startDate, endDate)
    }

}