import * as Flow from "./Transactor/FundFlow"

const scenario = await Flow.Scenario.fromFile('./default-scenario.json')
const result = Flow.Engine.run(scenario)

//console.log(result)

Flow.Renderer.renderInto(result, document.body)

if (result.lowestBalance) {
	console.log(result.lowestBalance.transaction.chargeDate.toISO(), result.lowestBalance.balanceAfter)
}