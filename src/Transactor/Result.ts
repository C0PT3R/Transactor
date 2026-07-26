import Frame from "./Frame"
import LedgerEntry from "./LedgerEntry";

export default class Result {
    constructor(
        public readonly frames: readonly Frame[],
        public readonly transactions: readonly LedgerEntry[],
        public readonly lowestBalance: LedgerEntry | null
    ) {}
}