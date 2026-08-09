import { LocalDate } from "@c0pt3r/local-date"
import Operation from "../operations/Operation"


export interface ModelPeriod {
    readonly startDate: LocalDate
    readonly endDate: LocalDate
    readonly dayCount: number
    readonly operations: readonly Operation[]
}

export function buildModelPeriods(
    simulationStart: LocalDate,
    simulationEnd: LocalDate,
    operations: readonly Operation[]
): readonly ModelPeriod[] {
    const boundaries = new Map<number, LocalDate>()

    const addBoundary = (date: LocalDate): void => {
        if (!date.isBetween(simulationStart, simulationEnd))
            return

        boundaries.set(date.epochDay, date)
    }

    addBoundary(simulationStart)

    for (const operation of operations) {
        // One-time events do not define a stable model state.
        if (operation.schedule.type === "once")
            continue

        const operationStart = operation.schedule.startDate
        const operationEnd = operation.schedule.endDate

        if (operationEnd < simulationStart || operationStart > simulationEnd)
            continue

        addBoundary(operationStart < simulationStart ? simulationStart : operationStart)

        if (operationEnd < simulationEnd)
            addBoundary(operationEnd.plusDays(1))
    }

    const starts = [...boundaries.values()].toSorted((a, b) => a.epochDay - b.epochDay)

    return starts.map((startDate, index) => {
        const nextStart = starts[index + 1]
        const endDate = nextStart ? nextStart.plusDays(-1) : simulationEnd

        return {
            startDate,
            endDate,
            dayCount: endDate.epochDay - startDate.epochDay + 1,
            operations: operations.filter(operation =>
                operation.schedule.type !== "once" &&
                operation.schedule.startDate <= startDate &&
                operation.schedule.endDate >= startDate
            )
        }
    })
}
