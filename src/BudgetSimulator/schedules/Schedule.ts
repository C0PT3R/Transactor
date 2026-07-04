import SimDate from "../SimDate.js"


export default abstract class Schedule {

    public startDate: SimDate | undefined
    public endDate: SimDate | undefined


    public constructor(startDate?: SimDate, endDate?: SimDate) {
        this.startDate = startDate
        this.endDate = endDate
    }


    public abstract matches(date: SimDate): boolean


    public isActive(date: SimDate) {
        if (this.startDate && date < this.startDate) {
            return false
        }
        if (this.endDate && date > this.endDate) {
            return false
        }
        return true
    }
}