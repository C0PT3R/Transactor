import AccountData from "./AccountTypes"
import OperationData from "./OperationTypes"

export default interface ConfigData {
    options: Options
    accounts: AccountData[]
    operations: OperationData[]
}

interface Options {
    startDate?: date_t
    endDate: date_t
}