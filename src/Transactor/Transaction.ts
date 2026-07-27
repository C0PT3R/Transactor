import { LocalDate } from "@c0pt3r/local-date"
import Operation from "./Operation"
import IdGenerator from "./IdGenerator"


export default class Transaction {

	public readonly id: string

	public constructor(
		public readonly operation: Operation,
		public readonly scheduledDate: LocalDate,
		public readonly chargeDate: LocalDate
	) {
		this.id = IdGenerator.generate()
	}

}