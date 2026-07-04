import { OperationParams } from "../operation/operationTypes.js"

export interface Options {
    startDate?: date_t
    endDate: date_t
    initialBalance?: number
}

export interface FlowConfig {
    options: Options
    payments: OperationParams[]
    bills: OperationParams[]
}