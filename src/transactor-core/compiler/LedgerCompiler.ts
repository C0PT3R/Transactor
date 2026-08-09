import { LocalDate } from "@c0pt3r/local-date"
import FinancialModel from "../model/FinancialModel"
import Operation from "../operations/Operation"
import Transaction from "../operations/Transaction"

export function populateLedgers(model: FinancialModel): void {
	const occurrenceStart = model.startDate.plusDays(-7)

	for (const operation of model.operations)
		populateOperationLedger(model, operation, occurrenceStart, model.endDate)
}

function populateOperationLedger(
	model: FinancialModel,
	operation: Operation,
	from: LocalDate,
	to: LocalDate
): void {
	for (const scheduledDate of operation.schedule.occurrences(from, to)) {
		const chargeDate = operation.resolveTransactionDate(
			scheduledDate,
			model.calendar
		)

		if (!chargeDate.isBetween(model.startDate, model.endDate))
			continue

		const transaction = new Transaction(operation, scheduledDate, chargeDate)

		if (operation.from)
			model.getAccount(operation.from).addLedgerEntry(transaction)

		if (operation.to)
			model.getAccount(operation.to).addLedgerEntry(transaction)
	}
}
