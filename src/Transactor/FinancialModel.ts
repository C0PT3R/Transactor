import { LocalDate } from "@c0pt3r/local-date"
import { BusinessCalendar } from "./calendar/BusinessCalendar"
import { CanadaBusinessCalendar } from "./calendar/CanadaBusinessCalendar"
import Account from "./Account"
import Operation from "./Operation"
import FinancialModelLoader from "./FinancialModelLoader"
import { compile } from "./Compiler"
import type { FinancialModelData } from "./types/FinancialModelTypes"


/**
 * Mutable working model used while compiling the declarative configuration
 * into an immutable Result.
 */
export default class FinancialModel {

	public readonly startDate: LocalDate
	public readonly endDate: LocalDate
	public readonly calendar: BusinessCalendar
	public readonly operations: readonly Operation[]
	public readonly accounts: readonly Account[]

	public constructor(modelData: FinancialModelData) {
		// The model starts tomorrow if not provided.
		this.startDate = modelData.options.startDate
			? new LocalDate(...modelData.options.startDate)
			: new LocalDate().addDays(1)

		this.endDate = new LocalDate(...modelData.options.endDate)
		this.accounts = modelData.accounts.map(data => new Account(data))

		const configuredOperations = compile(
			modelData,
			this.startDate,
			this.endDate
		)

		const behaviorContext = {
			startDate: this.startDate,
			endDate: this.endDate
		}

		const generatedOperations = this.accounts.flatMap(
			account => account.generateOperations(behaviorContext)
		)

		this.operations = [...configuredOperations, ...generatedOperations]
		this.calendar = new CanadaBusinessCalendar()
	}

	public static async fromFile(path: string): Promise<FinancialModel> {
		const modelData = await FinancialModelLoader.load(path)
		return new FinancialModel(modelData)
	}

	public getAccount(id: string): Account {
		const account = this.accounts.find(account => account.id === id)

		if (!account)
			throw new Error(`Account "${id}" does not exist`)

		return account
	}

}
