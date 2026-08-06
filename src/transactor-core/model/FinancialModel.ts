import { LocalDate } from "@c0pt3r/local-date"
import { BusinessCalendar } from "../calendar/BusinessCalendar"
import { CanadaBusinessCalendar } from "../calendar/CanadaBusinessCalendar"
import Account from "../accounts/Account"
import Operation from "../operations/Operation"
import EvenPaymentsStrategy from "../strategies/EvenPaymentsStrategy"
import FinancialModelLoader from "./FinancialModelLoader"
import { compileOperations } from "./OperationCompiler"
import type PlanningStrategy from "../strategies/PlanningStrategy"
import type { FinancialModelData, PlanningStrategyData } from "./FinancialModelTypes"

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
	public readonly strategies: readonly PlanningStrategy[]

	public constructor(modelData: FinancialModelData) {
		// The model starts tomorrow if not provided.
		this.startDate = modelData.options.startDate
			? LocalDate.fromISO(modelData.options.startDate)
			: LocalDate.today().plusDays(1)

		this.endDate = LocalDate.fromISO(modelData.options.endDate)
		this.accounts = modelData.accounts.map(data => new Account(data))
		this.strategies = (modelData.strategies ?? []).map(createPlanningStrategy)

		const configuredOperations = compileOperations(
			modelData,
			this.startDate,
			this.endDate
		)

		const generationContext = {
			startDate: this.startDate,
			endDate: this.endDate
		}

		const policyOperations = this.accounts.flatMap(
			account => account.generatePolicyOperations(generationContext)
		)

		const strategyOperations = this.strategies.flatMap(
			strategy => strategy.generateOperations(generationContext)
		)

		this.operations = [
			...configuredOperations,
			...policyOperations,
			...strategyOperations
		]
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

function createPlanningStrategy(data: PlanningStrategyData): PlanningStrategy {
	switch (data.kind) {
		case "evenPayments":
			return new EvenPaymentsStrategy(data)
	}
}
