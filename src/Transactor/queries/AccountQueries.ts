import type { Result, TransactionResult } from "../results/ResultTypes"


export function getProjectedBalance(result: Result, accountId: string, date: string): number {
	const account = result.accounts.find(account => account.id === accountId)

	if (!account)
		throw new RangeError(`Unknown account id: ${accountId}`)

	if (date < result.period.startDate || date > result.period.endDate) {
		throw new RangeError(
			`Date ${date} is outside the simulation period ` +
			`${result.period.startDate} - ${result.period.endDate}.`
		)
	}

	const transaction = account.transactions.findLast(transaction => transaction.chargedDate <= date)

	return transaction?.balanceAfter ?? account.openingBalance
}

export function getLowestBalanceTransaction(ledger: readonly TransactionResult[]): TransactionResult | undefined {
	return ledger.reduce<TransactionResult | undefined>((lowest, transaction) =>
		!lowest || transaction.balanceAfter < lowest.balanceAfter
			? transaction
			: lowest,
		undefined
	)
}
