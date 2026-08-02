import type { FinancialModelData } from "./FinancialModelTypes"


export default class FinancialModelLoader {

	public static async load(path: string): Promise<FinancialModelData> {
		const response = await fetch(path)

		if (!response.ok)
			throw new Error(`Unable to load financial model '${path}' (${response.status})`)

		const model: FinancialModelData = await response.json()

		// TODO: Configuration validation.
		return model
	}

}
