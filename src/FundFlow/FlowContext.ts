import Account from "./Account.js";
import ConfigLoader from "./config/ConfigLoader.js";
import { FlowConfig } from "./config/configTypes.js";
import FlowPlanner from "./FlowPlanner.js";
import FlowWindow from "./FlowWindow.js";


export default class FlowContext {

    public readonly config: FlowConfig
    public readonly account: Account
    public readonly windows: FlowWindow[]

    public constructor(config: FlowConfig) {
        this.config = config
        this.account = new Account(config.options.initialBalance)
        this.windows = FlowPlanner.createWindows(config)
    }

    public static async fromFile(path: string): Promise<FlowContext> {
        const config = await ConfigLoader.load(path)
        return new FlowContext(config)
    }

}