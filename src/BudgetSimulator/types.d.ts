declare type operationType_t = "Payment" | "Bill"
declare type recurrence_t = "daily"|"weekly"|"biWeekly"|"monthly"|"yearly"

declare type printer_t = (content: string) => void

/**
 * Year, Month, Day
 */
declare type date_t = [
	number,
	number,
	number?						// default: 0
]

declare type config_t = {
	options: options_t
	payments: operation_t[]
	bills: operation_t[]
}

declare type options_t = {
	startDate?: date_t			// default: undefined
	endDate: date_t
	initialBalance?: number		// default: 0
}

declare type operation_t = {
	name: string
	source: string
	amount: number				// default: undefined
	recurrence?: recurrence_t	// default: "monthly"
	day: number
	month?: number				// default: 0
	delay?: number				// default: 0
	startDate?: date_t			// default: null
	endDate?: date_t			// default: null
	skipWeekend?: boolean		// default: true
	transforms?: transform_t[]	// default: undefined
}

declare type transform_t = {
	date: date_t
	params: {
		amount?: number				// default: undefined
		recurrence?: recurrence_t	// default: undefined
		day?: number				// default: undefined
	}
}