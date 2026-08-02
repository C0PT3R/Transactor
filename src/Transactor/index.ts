export { default as FinancialModel } from "./FinancialModel"
export { run } from "./Engine"
export { build } from "./ResultBuilder"

import Renderer from "./renderer/Renderer"
export const renderInto = Renderer.renderInto
