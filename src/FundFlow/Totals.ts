import Operation from "./Operation"


export default class Totals {

    public constructor(
        public daily: number = 0,
        public weekly: number = 0,
        public biWeekly: number = 0,
        public monthly: number = 0,
        public yearly: number = 0
    ) { }

    public addOperation(op: Operation) {
        this.daily += op.convertTo("daily")
        this.weekly += op.convertTo("weekly")
        this.biWeekly += op.convertTo("biWeekly")
        this.monthly += op.convertTo("monthly")
        this.yearly += op.convertTo("yearly")
    }

    public reset() {
        this.daily = 0
        this.weekly = 0
        this.biWeekly = 0
        this.monthly = 0
        this.yearly = 0
    }

}