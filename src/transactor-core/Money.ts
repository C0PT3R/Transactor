/**
 * Monetary values inside the core and result DTO are represented as integer cents.
 * Decimal currency values only exist at configuration and display boundaries.
 */
export function currencyToCents(value: number, fieldName: string = "Amount"): number {
	if (!Number.isFinite(value))
		throw new Error(`${fieldName} must be a finite number`)

	const cents = Math.round((value + Math.sign(value) * Number.EPSILON) * 100)

	if (!Number.isSafeInteger(cents))
		throw new Error(`${fieldName} is outside the supported monetary range`)

	return cents
}

export function assertCents(value: number, fieldName: string = "Amount"): number {
	if (!Number.isSafeInteger(value))
		throw new Error(`${fieldName} must be an integer number of cents`)

	return value
}
