import { LocalDate } from "@c0pt3r/local-date"
import * as Transactor from "./Transactor"
import { AccountResult, Result, SimulationPeriodResult, TransactionResult } from "./Transactor/types/ResultTypes"

const scenario = await Transactor.Scenario.fromFile('./default-scenario.json')
const result = Transactor.run(scenario)

Transactor.renderInto(result, document.body)

// Result object debug
//console.log(result)

const lowestBalance = getLowestBalanceTransaction(result.accounts[0].transactions)
if (lowestBalance) {
    const chargedDate = parseDate(lowestBalance.chargedDate)!
	//console.log(chargedDate.toISO(), lowestBalance.balanceAfter)
}

console.log(
    "Projected balance for today is",
    getProjectedBalance(result, 0, new LocalDate().toISO())
)


function getProjectedBalance(result: Result, accountId: number, date: string): number {
    const account = result.accounts[accountId]

    if (!account)
        throw new RangeError(`Unknown account index: ${accountId}`);

    if (date < result.period.startDate || date > result.period.endDate) {
        throw new RangeError(
            `Date ${date} is outside the simulation period ` +
            `${result.period.startDate} - ${result.period.endDate}.`,
        )
    }

    const transaction = account.transactions.findLast(
        t => t.chargedDate <= date,
    )

    return transaction?.balanceAfter ?? account.openingBalance
}

function getLowestBalanceTransaction(ledger: readonly TransactionResult[]): TransactionResult | undefined {
    return ledger.reduce<TransactionResult | undefined>((lowest, transaction) =>
        !lowest || transaction.balanceAfter < lowest.balanceAfter
        ? transaction
        : lowest,
        undefined
    )
}
 
function parseDate(date: string): LocalDate | null {
	const match =
		/^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(date)

	if (!match)
		return null

	const year = Number(match[1])
	const month = Number(match[2])
	const day = Number(match[3])

	if (
		!Number.isInteger(year) ||
		!Number.isInteger(month) ||
		!Number.isInteger(day) ||
		month < 1 ||
		month > 12 ||
		day < 1 ||
		day > 31
	) return null

	return new LocalDate(year, month, day)
}