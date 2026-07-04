import { FundFlow } from "./FundFlow/index.js"

const engine = new FundFlow.Engine()
const context = await FundFlow.Context.fromFile('./config.json')
const result = engine.run(context)

FundFlow.Renderer.render(result, (content: string) => {
	document.body.innerHTML += content
})