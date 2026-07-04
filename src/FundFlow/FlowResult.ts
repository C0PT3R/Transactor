import FlowWindow from "./FlowWindow"
import Transaction from "./Transaction"

export default class FlowResult {
    windows: FlowWindow[]
    transactions: Transaction[]
    lowestBalance: Transaction

    constructor(data: { windows: FlowWindow[]; transactions: Transaction[], lowestBalance: Transaction }) {
        this.windows = data.windows
        this.transactions = data.transactions
        this.lowestBalance = data.lowestBalance
    }
}