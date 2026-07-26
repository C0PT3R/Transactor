import AccountData from "./AccountTypes"
import OperationData from "./OperationTypes"

export default interface ScenarioData {
    options: ScenarioOptions
    accounts: AccountData[]
    operations: OperationData[]
}

interface ScenarioOptions {
    startDate?: date_t
    endDate: date_t
}