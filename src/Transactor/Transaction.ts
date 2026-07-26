import Operation from "./Operation"
import LocalDate from "./LocalDate"


export default class Transaction {

	public constructor(
		public readonly operation: Operation,
		public readonly scheduledDate: LocalDate,
		public readonly chargeDate: LocalDate
	) { }

}