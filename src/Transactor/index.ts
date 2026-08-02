export { default as FinancialModel } from "./model/FinancialModel"
export { run } from "./Engine"
export { build } from "./results/ResultBuilder"

import Renderer from "./renderer/Renderer"
export const renderInto = Renderer.renderInto
