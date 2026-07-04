import { FlowConfig } from "./configTypes"


export default class ConfigLoader {

    public static async load(path: string): Promise<FlowConfig> {
        const response = await fetch(path)
        const config: FlowConfig = await response.json()

        // TODO: Config validation...

        return config
    }

}