import * as Transactor from "./Transactor"

const scenario = await Transactor.Scenario.fromFile('./default-scenario.json')
const result = Transactor.run(scenario)

Transactor.renderInto(result, document.body)

if (result.lowestBalance) {
	console.log(result.lowestBalance.transaction.chargeDate.toISO(), result.lowestBalance.balanceAfter)
}