import type { LocalDate } from "@c0pt3r/local-date"
import type Account from "./Account"
import type Operation from "../operations/Operation"


export interface AccountBehaviorContext {
	readonly startDate: LocalDate
	readonly endDate: LocalDate
}

/**
 * Account behaviors contribute generated operations while the financial model
 * is being compiled. Policies describe contractual account behavior; strategies
 * describe how the account should be managed.
 */
export interface AccountBehavior {
	generateOperations(account: Account, context: AccountBehaviorContext): readonly Operation[]
}

export interface AccountPolicy extends AccountBehavior {
	readonly behaviorType: "policy"
}

export interface FundingStrategy extends AccountBehavior {
	readonly behaviorType: "fundingStrategy"
}
