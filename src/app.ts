import * as Transactor from "./transactor-core"
import * as Renderer from "./transactor-renderer"


const model = await Transactor.FinancialModel.fromFile("./default-model.json")
const result = Transactor.compile(model)
Renderer.renderInto(result, document.body)

// Result object debugging
console.log(result)