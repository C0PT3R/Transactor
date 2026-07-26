import { LocalDate } from "@c0pt3r/local-date"

import Operation from "./Operation"


export default class Transaction {

	public constructor(
		public readonly operation: Operation,
		public readonly scheduledDate: LocalDate,
		public readonly chargeDate: LocalDate
	) { }

}