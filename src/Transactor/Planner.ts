import { LocalDate } from "@c0pt3r/local-date"
import ScenarioData from "./types/ScenarioTypes"
import Operation from "./Operation"
import OperationData, { TransformData } from "./types/OperationTypes"
import ScheduleFactory from "./schedules/ScheduleFactory"


export function compile(config: ScenarioData, scenarioStart: LocalDate, scenarioEnd: LocalDate): Operation[] {
	const operations: Operation[] = []

	for (const opData of config.operations) {
		const operationStart = opData.schedule.startDate
			? new LocalDate(...opData.schedule.startDate)
			: scenarioStart.clone()

		const operationEnd = opData.schedule.endDate
			? new LocalDate(...opData.schedule.endDate)
			: scenarioEnd.clone()

		const startDate = (operationStart < scenarioStart)
			? scenarioStart.clone()
			: operationStart.clone()

		const endDate = (operationEnd && scenarioEnd)
			? (operationEnd < scenarioEnd)
				? operationEnd.clone()
				: scenarioEnd.clone()
			: operationEnd?.clone() ?? scenarioEnd?.clone()

		if (endDate && startDate > endDate) continue

		const transforms = (opData.transforms ?? [])
			.map(transform => ({
				transform,
				date: new LocalDate(...transform.date)
			}))
			.filter(({ date }) =>
				date >= operationStart &&
				(!operationEnd || date <= operationEnd)
			)
			.toSorted((a, b) =>
				a.date < b.date
					? -1
					: a.date > b.date
						? 1
						: 0
			)

		/*
		 * This is compiler state, not a runtime Operation.
		 * It may change while versions are being generated.
		 */
		let currentData = structuredClone(opData)
		let currentStart = startDate.clone()
		let transformIndex = 0

		/*
		 * Transformations effective before the simulation starts must
		 * still be applied so that the first generated version is correct.
		 */
		while (
			transformIndex < transforms.length &&
			transforms[transformIndex].date <= currentStart
		) {
			currentData = applyTransform(currentData, transforms[transformIndex].transform)
			transformIndex++
		}

		for (; transformIndex < transforms.length; transformIndex++) {
			const { transform, date } = transforms[transformIndex]

			if (endDate && date > endDate) break

			const currentEnd = date.clone().addDays(-1)

			if (currentStart <= currentEnd) {
				operations.push(
					createOperation(currentData, currentStart, currentEnd)
				)
			}

			currentData = applyTransform(currentData, transform)

			currentStart = date.clone()
		}

		if (!endDate || currentStart <= endDate) {
			operations.push(
				createOperation(currentData, currentStart, endDate)
			)
		}
	}

	return operations
}

function applyTransform(data: OperationData, transform: TransformData): OperationData {
	return {
		...data,

		/*
		 * The persisted source data remains untouched.
		 * Only this temporary compiler snapshot changes.
		 */
		amount: transform.params.amount ?? data.amount

		// Other transformable properties will be added here.
	}
}

function createOperation(data: OperationData, startDate: LocalDate, endDate: LocalDate): Operation {
	const schedule = ScheduleFactory.create(data.schedule, startDate, endDate)
	return new Operation(data, schedule)
}
