import ScenarioData from "./types/ScenarioTypes"


export default class ConfigLoader {

    public static async load(path: string): Promise<ScenarioData> {
        const response = await fetch(path)
        const config: ScenarioData = await response.json()

        // TODO: Config validation...

        return config
    }

}