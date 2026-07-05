import * as Flow from "./FundFlow/FundFlow.js"

const scenario = await Flow.Scenario.fromFile('./default-scenario.json')
const result = Flow.Engine.run(scenario)

Flow.Renderer.renderInto(result, document.body)

if (result.lowestBalance) {
	console.log(result.lowestBalance.chargeDate.toISO(), result.lowestBalance.balance)
}