import Frame from "./Frame"
import Transaction from "./Transaction"

export default class Result {
    constructor(
        public readonly frames: readonly Frame[],
        public readonly transactions: readonly Transaction[],
        public readonly lowestBalance: Transaction | null
    ) {}
}