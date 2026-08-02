import { getAccountLedger } from "./ResultQueries"
import type { AccountLedgerEntry } from "./ResultQueries"
import type { Result } from "../../transactor-common"

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

	const entry = getAccountLedger(result, accountId)
		.findLast(entry => entry.transaction.chargedDate <= date)

	return entry?.ledgerEntry.balanceAfter ?? account.openingBalance
}

export function getLowestBalanceEntry(entries: readonly AccountLedgerEntry[]): AccountLedgerEntry | undefined {
	return entries.reduce<AccountLedgerEntry | undefined>((lowest, entry) =>
		!lowest || entry.ledgerEntry.balanceAfter < lowest.ledgerEntry.balanceAfter
			? entry
			: lowest,
		undefined
	)
}
