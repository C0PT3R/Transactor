import Operation from "./Operation"


export default class Totals {
    
    public daily: number = 0
    public weekly: number = 0
    public biWeekly: number = 0
    public monthly: number = 0
    public yearly: number = 0

    public add(op: Operation) {
        this.daily += op.convertTo("daily")
        this.weekly += op.convertTo("weekly")
        this.biWeekly += op.convertTo("biWeekly")
        this.monthly += op.convertTo("monthly")
        this.yearly += op.convertTo("yearly")
    }

}