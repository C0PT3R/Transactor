import FinancialModel from "../model/FinancialModel"

export function validateModel(model: FinancialModel): void {
	validateTransactions(model)
}

function validateTransactions(model: FinancialModel): void {
	for (const account of model.accounts) {
		for (const entry of account.getLedgerEntries()) {
			if (entry.transaction.getAmount() !== null)
				continue

			throw new Error(
				`Transaction for operation "${entry.transaction.operation.name}" has an unresolved amount.`
			)
		}
	}
}
