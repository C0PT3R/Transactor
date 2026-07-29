import { html, render as litRender } from "lit"
import { dateString } from "./Formatters"
import "./BudgetReport"

import type { LocalDate } from "@c0pt3r/local-date"
import type { Result } from "../types/ResultTypes"


type HtmlTarget = HTMLElement | DocumentFragment

export default class Renderer {

	public static renderInto(result: Result, target: HtmlTarget): void {
		litRender(
			html`<budget-report .result=${result}></budget-report>`,
			target
		)
	}

	public static render(result: Result, writer: printer_t): void {
		const container = document.createElement("div")

		this.renderInto(result, container)
		writer(container.innerHTML)
	}

	public static renderDateString(date: LocalDate | string): string {
		return dateString(date)
	}
}