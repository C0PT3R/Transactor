import ConfigData from "./types/ConfigTypes.js"
import Frame from "./Frame.js"
import LocalDate from "./LocalDate.js"


export default class Planner {

    /**
	 * Seeks the dates on when changes will occur during simulation
	 * @returns A sorted array of dates
	 */
	public static seekTransformDates(config: ConfigData): LocalDate[] {
		const transformDates = new Array<LocalDate>()
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

	public static createFrames(config: ConfigData): Frame[] {
		const transformDates = this.seekTransformDates(config)
		const frames = new Array<Frame>()

		for (let i = 1; i < transformDates.length; i++) {
			const frameStart = transformDates[i - 1]
			const frameEnd = (i == transformDates.length - 1) ? transformDates[i] : transformDates[i].clone().addDays(-1)

			const frame = new Frame(frameStart, frameEnd)

			for (const opParams of config.payments) {
				frame.addOperation("payment", opParams)
			}

			for (const opParams of config.bills) {
				// Skip bill if it's out of frame's schedule...
				if (
					(opParams.schedule.startDate && new LocalDate(...opParams.schedule.startDate) > frameStart)
					||
					(opParams.schedule.endDate && new LocalDate(...opParams.schedule.endDate) < frameEnd)
				) continue

				// ... or else add bill to frame
				frame.addOperation("bill", opParams)
			}

			frame.calculate()

			frames.push(frame)
		}

		return frames
	}

}