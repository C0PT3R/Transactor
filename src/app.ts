import { LocalDate } from "@c0pt3r/local-date"
import * as Transactor from "./Transactor"
import { getLowestBalanceTransaction, getProjectedBalance } from "./Transactor/interpreter/AccountInterpreter"

const scenario = await Transactor.Scenario.fromFile('./default-scenario.json')
const result = Transactor.run(scenario)

Transactor.renderInto(result, document.body)

// Result object debugging
//console.log(result)

const lowestBalance = getLowestBalanceTransaction(result.accounts[0].transactions)

if (lowestBalance) {
	console.log("Lowest balance will be", lowestBalance.chargedDate, lowestBalance.balanceAfter)
}

console.log(
    "Projected balance for today is",
    getProjectedBalance(result, "bills", new LocalDate().toISO())
)