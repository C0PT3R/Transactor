import { LocalDate } from "@c0pt3r/local-date"
import { BusinessCalendar } from "./calendar/BusinessCalendar"
import { CanadaBusinessCalendar } from "./calendar/CanadaBusinessCalendar"
import Account from "./Account"
import Operation from "./Operation"
import ScenarioLoader from "./ScenarioLoader"
import { compile } from "./Compiler"
import type { ScenarioData } from "./types/ScenarioTypes"


export default class Scenario {
	
	public readonly startDate: LocalDate
	public readonly endDate: LocalDate
	public readonly calendar: BusinessCalendar
	public readonly operations: readonly Operation[]
	public readonly accounts: readonly Account[] = []

	public constructor(scenarioData: ScenarioData) {
	    // Scenario starts tomorrow if not provided
		this.startDate = scenarioData.options.startDate
			? new LocalDate(...scenarioData.options.startDate)
			: new LocalDate().addDays(1)

	    // Scenario end date must always be provided
		this.endDate = new LocalDate(...scenarioData.options.endDate)

		this.operations = compile(scenarioData, this.startDate, this.endDate)
		this.accounts = scenarioData.accounts.map(data => new Account(data))
		this.calendar = new CanadaBusinessCalendar()
	}

    public static async fromFile(path: string): Promise<Scenario> {
        const scenarioData = await ScenarioLoader.load(path)
        return new Scenario(scenarioData)
    }

    public getAccount(id: string): Account {
        const account = this.accounts.find(account => account.id === id)

        if (!account)
            throw new Error(`Account "${id}" does not exist`)

        return account
    }

}