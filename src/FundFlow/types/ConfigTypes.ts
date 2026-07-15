import OperationData from "./OperationTypes"

export default interface ConfigData {
    options: Options
    payments: OperationData[]
    bills: OperationData[]
}

interface Options {
    startDate?: date_t
    endDate: date_t
    initialBalance?: number
}