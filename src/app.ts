import { LocalDate } from "@c0pt3r/local-date"
import * as Transactor from "./Transactor"
import { getLowestBalanceTransaction, getProjectedBalance } from "./Transactor/queries/AccountQueries"

const model = await Transactor.FinancialModel.fromFile("./default-model.json")
const result = Transactor.compile(model)
Transactor.renderInto(result, document.body)




// Result object debugging
// console.log(result)




const lowestBalance = getLowestBalanceTransaction(result.accounts[0].transactions)

if (lowestBalance) {
	console.log("Lowest balance will be", lowestBalance.chargedDate, lowestBalance.balanceAfter)
}

console.log(
	"Projected balance for today is",
	getProjectedBalance(result, "bills", new LocalDate().toISO())
)
