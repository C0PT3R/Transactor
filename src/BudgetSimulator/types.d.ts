declare type operationType_t = "Payment" | "Bill"
declare type scheduleType_t = "daily" | "weekly" | "biWeekly" | "monthly" | "yearly"

declare type printer_t = (content: string) => void

/**
 * Year, Month, Day
 */
declare type date_t = [
	number,
	number,
	number?
]

declare type config_t = {
	options: options_t
	payments: operation_t[]
	bills: operation_t[]
}

declare type options_t = {
	startDate?: date_t
	endDate: date_t
	initialBalance?: number
}

declare type operation_t = {
	name: string
	amount: number
	schedule: schedule_t
	transforms?: transform_t[]
}

declare type schedule_t = {
	type: scheduleType_t
	day?: number
	month?: number
	year?: number
	delay?: number
	startDate?: date_t
	endDate?: date_t
	skipWeekend?: boolean
}

declare type transform_t = {
	date: date_t
	params: {
		amount?: number				// default: undefined
		recurrence?: scheduleType_t	// default: undefined
		day?: number				// default: undefined
	}
}