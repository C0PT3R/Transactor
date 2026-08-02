export { default as FinancialModel } from "./model/FinancialModel"
export { compile } from "./Compiler"
export { Result } from "./results/ResultTypes"

import Renderer from "./renderer/Renderer"
export const renderInto = Renderer.renderInto
