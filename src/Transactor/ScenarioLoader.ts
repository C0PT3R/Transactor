import ConfigData from "./types/ConfigTypes"


export default class ConfigLoader {

    public static async load(path: string): Promise<ConfigData> {
        const response = await fetch(path)
        const config: ConfigData = await response.json()

        // TODO: Config validation...

        return config
    }

}