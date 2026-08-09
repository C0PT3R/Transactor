import { LocalDate } from "@c0pt3r/local-date"
import Operation from "../operations/Operation"
import ScheduleFactory from "../schedules/ScheduleFactory"
import type { FinancialModelData, OperationData, TransformData } from "../model/FinancialModelTypes"


export function compileOperations(config: FinancialModelData, modelStart: LocalDate, modelEnd: LocalDate): Operation[] {
	const operations: Operation[] = []

	for (const opData of config.operations) {
		const onceDate = opData.schedule.period === "once"
			? requireOnceDate(opData)
			: null

		const operationStart = onceDate ?? (opData.schedule.startDate
			? LocalDate.fromISO(opData.schedule.startDate)
			: modelStart)

		const operationEnd = onceDate ?? (opData.schedule.endDate
			? LocalDate.fromISO(opData.schedule.endDate)
			: modelEnd)

		const startDate = (operationStart < modelStart)
			? modelStart
			: operationStart

		const endDate = operationEnd < modelEnd
			? operationEnd
			: modelEnd

		if (endDate && startDate > endDate) continue

		const transforms = (opData.transforms ?? [])
			.map(transform => ({
				transform,
				date: LocalDate.fromISO(transform.date)
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
		let currentStart = startDate
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

			const currentEnd = date.plusDays(-1)

			if (currentStart <= currentEnd) {
				operations.push(
					createOperation(currentData, currentStart, currentEnd)
				)
			}

			currentData = applyTransform(currentData, transform)

			currentStart = date
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


function requireOnceDate(data: OperationData): LocalDate {
	if (!data.schedule.date)
		throw new Error(`Operation "${data.name}" uses a once schedule without a date.`)

	return LocalDate.fromISO(data.schedule.date)
}
