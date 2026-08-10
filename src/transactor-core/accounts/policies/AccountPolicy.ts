import type { LocalDate } from "@c0pt3r/local-date"
import type Account from "../Account"
import type Operation from "../../operations/Operation"

export interface AccountPolicyContext {
	readonly startDate: LocalDate
	readonly endDate: LocalDate
}

/**
 * Contractual behavior intrinsic to an account, such as interest or fees.
 */
export default interface AccountPolicy {
	generateOperations(account: Account, context: AccountPolicyContext): readonly Operation[]
}
