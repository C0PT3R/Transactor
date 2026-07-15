import ConfigData from "./types/ConfigTypes"
import Frame from "./Frame"
import LocalDate from "./LocalDate"


/**
 * Seeks the dates on when changes will occur during simulation
 * @returns A sorted array of dates
 */
export function findTransformDates(config: ConfigData): LocalDate[] {
	const transformDates: LocalDate[] = []
	const simStart = new LocalDate().addDays(1) // Start simulation tomorrow
	const simEnd = new LocalDate(...config.options.endDate)

	transformDates.push(simStart, simEnd) // Add simulation start and end dates

	for (const billParams of config.bills) {
		// Check if operation will start after today AND before simulation end
		if (billParams.schedule.startDate) {
			const opStart = new LocalDate(...billParams.schedule.startDate)
			if (opStart >= simStart && opStart < simEnd) {
				transformDates.push(opStart)
			}
		}

		// Check if operation will end after today AND before simulation end
		if (billParams.schedule.endDate) {
			const opEnd = new LocalDate(...billParams.schedule.endDate)
			if (opEnd >= simStart && opEnd < simEnd) {
				transformDates.push(opEnd)
			}
		}

		// Check if operation has set transformations
		if (billParams.transforms) {
			for (const tr of billParams.transforms) {
				const trDate = new LocalDate(...tr.date)

				// Add to the list if it's inside simulation schedule
				if (trDate >= simStart && trDate < simEnd)
					transformDates.push(trDate)
			}
		}
	}

	const uniqueDates = [...new Map(
		transformDates.map(date => [date.getEpochDay(), date])
	).values()]

	// Return list sorted by date
	return uniqueDates.sort((a, b) => a.getEpochDay() - b.getEpochDay())
}

export function createFrames(config: ConfigData): Frame[] {
	const transformDates = findTransformDates(config)
	const frames: Frame[] = []

	for (let i = 1; i < transformDates.length; i++) {
		const frameStart = transformDates[i - 1]
		const frameEnd = (i == transformDates.length - 1) ? transformDates[i] : transformDates[i].clone().addDays(-1)

		const frame = new Frame(frameStart, frameEnd)

		for (const opParams of config.payments) {
			frame.addPayment(opParams)
		}

		for (const opParams of config.bills) {
			// Skip bill if it's out of frame's schedule...
			if (
				(opParams.schedule.startDate && new LocalDate(...opParams.schedule.startDate) > frameStart)
				||
				(opParams.schedule.endDate && new LocalDate(...opParams.schedule.endDate) < frameEnd)
			) continue

			// ... or else add bill to frame
			frame.addBill(opParams)
		}

		frame.calculate()

		frames.push(frame)
	}

	return frames
}
