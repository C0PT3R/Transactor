import Frame from "./Frame.js"
import Transaction from "./Transaction.js"

export default class Result {
    frames: Frame[]
    transactions: Transaction[]
    lowestBalance: Transaction | null

    constructor(frames: Frame[], transactions: Transaction[], lowestBalance: Transaction | null) {
        this.frames = frames
        this.transactions = transactions
        this.lowestBalance = lowestBalance
    }
}