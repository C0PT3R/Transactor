import Account from "./Account.js"
import Planner from "./Planner.js"
import Frame from "./Frame.js"
import ConfigLoader from "./ScenarioLoader.js"
import ConfigData from "./types/ConfigTypes.js"
import { BusinessCalendar } from "./calendar/BusinessCalendar.js"
import { CanadaBusinessCalendar } from "./calendar/CanadaBusinessCalendar.js"


export default class Scenario {

    public readonly config: ConfigData
    public readonly account: Account
    public readonly frames: Frame[]
    public readonly calendar: BusinessCalendar

    public constructor(config: ConfigData) {
        this.config = config
        this.account = new Account(config.options.initialBalance)
        this.frames = Planner.createFrames(config)
        this.calendar = new CanadaBusinessCalendar()
    }

    public static async fromFile(path: string): Promise<Scenario> {
        const config = await ConfigLoader.load(path)
        return new Scenario(config)
    }

}