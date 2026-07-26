import { LocalDate } from "@c0pt3r/local-date"
import Account from "./Account"
import { BusinessCalendar } from "./calendar/BusinessCalendar"
import { CanadaBusinessCalendar } from "./calendar/CanadaBusinessCalendar"
import Operation from "./Operation"
import ConfigLoader from "./ScenarioLoader"
import ScenarioData from "./types/ScenarioTypes"
import * as Planner from "./Planner"


export default class Scenario {
	public readonly startDate: LocalDate
	public readonly endDate: LocalDate
	public readonly operations: Operation[]
	public readonly accounts: Account[] = []
	public readonly calendar: BusinessCalendar

	public constructor(scenarioData: ScenarioData) {
	    // Scenario starts tomorrow if not provided
		this.startDate = scenarioData.options.startDate
			? new LocalDate(...scenarioData.options.startDate)
			: new LocalDate().addDays(1)

	    // Scenario end date must always be provided
		this.endDate = new LocalDate(...scenarioData.options.endDate)

		this.operations = Planner.compile(scenarioData, this.startDate, this.endDate)

		for (const account of scenarioData.accounts) {
			this.accounts.push(new Account(account))
		}

		this.calendar = new CanadaBusinessCalendar()
	}

    public static async fromFile(path: string): Promise<Scenario> {
        const config = await ConfigLoader.load(path)
        return new Scenario(config)
    }

    public getAccount(id: string) {
        const account = this.accounts.find(account => account.id === id)

        if (!account)
            throw new Error(`Account "${id}" does not exist`)

        return account
    }

}