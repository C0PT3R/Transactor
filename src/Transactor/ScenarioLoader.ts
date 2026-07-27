import type { ScenarioData } from "./types/ScenarioTypes"


export default class ScenarioLoader {

    public static async load(path: string): Promise<ScenarioData> {
        const response = await fetch(path)

        if (!response.ok)
            throw new Error(`Unable to load scenario '${path}' (${response.status})`)

        const scenario: ScenarioData = await response.json()

        // TODO: Config validation...

        return scenario
    }

}