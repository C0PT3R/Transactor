import { FlowConfig } from "./config/configTypes.js"
import FlowWindow from "./FlowWindow.js"
import SimDate from "./SimDate.js"

export default class FlowPlanner {

    /**
	 * Seeks the dates on when changes will occur during simulation
	 * @returns A sorted array of dates
	 */
	public static seekTransformDates(config: FlowConfig): SimDate[] {
		const transformDates = new Array<SimDate>()
		const simStart = new SimDate().shift(1) // Start simulation tomorrow
		const simEnd = new SimDate(...config.options.endDate)

		transformDates.push(simStart, simEnd) // Add simulation start and end dates

		for (const billParams of config.bills) {
			// Check if operation will start after today AND before simulation end
			if (billParams.schedule.startDate) {
				const opStart = new SimDate(...billParams.schedule.startDate)
				if (opStart >= simStart && opStart < simEnd) {
					transformDates.push(opStart)
				}
			}

			// Check if operation will end after today AND before simulation end
			if (billParams.schedule.endDate) {
				const opEnd = new SimDate(...billParams.schedule.endDate)
				if (opEnd >= simStart && opEnd < simEnd) {
					transformDates.push(opEnd)
				}
			}

			// Check if operation has set transformations
			if (billParams.transforms) {
				for (const tr of billParams.transforms) {
					const trDate = new SimDate(...tr.date)

					// Add to the list if it's inside simulation schedule
					if (trDate >= simStart && trDate < simEnd)
						transformDates.push(trDate)
				}
			}
		}

		const uniqueDates = [...new Map(
			transformDates.map(date => [date.time, date])
		).values()]

		// Return list sorted by date
		return uniqueDates.sort((a, b) => a.time - b.time)
	}

	public static createWindows(config: FlowConfig): FlowWindow[] {
		const transformDates = this.seekTransformDates(config)
		const windows = new Array<FlowWindow>()

		for (let i = 1; i < transformDates.length; i++) {
			const windowStart = transformDates[i - 1]
			const windowEnd = (i == transformDates.length - 1) ? transformDates[i] : transformDates[i].duplicate().shift(-1)

			const window = new FlowWindow(windowStart, windowEnd)

			for (const opParams of config.payments) {
				window.addOperation("payment", opParams)
			}

			for (const opParams of config.bills) {
				// Skip bill if it's out of window's schedule...
				if (
					(opParams.schedule.startDate && new SimDate(...opParams.schedule.startDate) > windowStart)
					||
					(opParams.schedule.endDate && new SimDate(...opParams.schedule.endDate) < windowEnd)
				) continue

				// ... or else add bill to window
				window.addOperation("bill", opParams)
			}

			window.calculate()

			windows.push(window)
		}

		return windows
	}

}