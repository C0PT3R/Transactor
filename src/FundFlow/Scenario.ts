import Account from "./Account"
import * as Planner from "./Planner"
import Frame from "./Frame"
import ConfigLoader from "./ScenarioLoader"
import ConfigData from "./types/ConfigTypes"
import { BusinessCalendar } from "./calendar/BusinessCalendar"
import { CanadaBusinessCalendar } from "./calendar/CanadaBusinessCalendar"


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