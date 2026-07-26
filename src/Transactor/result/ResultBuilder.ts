import { LocalDate } from "@c0pt3r/local-date"
import Account from "../Account"
import Frame from "../Frame"
import Totals from "../Totals"
import LedgerEntry, { TransactionDirection } from "../LedgerEntry"
import Operation from "../Operation"
import { ScheduleType } from "../schedules/scheduleRegistry"


export interface Result {
    readonly period: SimulationPeriodResult
    readonly accounts: readonly AccountResult[]
    readonly frames: readonly FrameResult[]
}

export interface SimulationPeriodResult {
    readonly startDate: string
    readonly endDate: string
}

export interface FrameResult {
    readonly startDate: string
    readonly endDate: string
    readonly operations: readonly OperationResult[]
    readonly inflow: TotalsResult
    readonly outflow: TotalsResult
}

export interface OperationResult {
    readonly id: string
    readonly name: string
    readonly from?: string
    readonly to?: string
    readonly amount: number
    readonly totals: TotalsResult
    readonly scheduleType: ScheduleType
}

export interface AccountResult {
    readonly id: string
    readonly name: string
    readonly openingBalance: number
    readonly closingBalance: number
    readonly ledger: readonly TransactionResult[]
}

export interface TransactionResult {
    readonly id: string
    readonly operationId: string
    readonly operationName: string
    readonly amount: number
    readonly direction: TransactionDirection
    readonly scheduledDate: string
    readonly chargedDate: string
    readonly balanceAfter: number
}

export interface TotalsResult {
    readonly daily: number
    readonly weekly: number
    readonly biWeekly: number
    readonly monthly: number
    readonly yearly: number
}


function buildTotals(totals: Totals): TotalsResult {
    return {
        daily: totals.daily,
        weekly: totals.weekly,
        biWeekly: totals.biWeekly,
        monthly: totals.monthly,
        yearly: totals.yearly
    }
}

function buildSimulationPeriod(start: LocalDate, end: LocalDate): SimulationPeriodResult {
    return {
        startDate: start.toJSON(),
        endDate: end.toJSON(),
    }
}

function buildFrame(frame: Frame): FrameResult {
    return {
        startDate: frame.startDate.toJSON(),
        endDate: frame.endDate.toJSON(),
        operations: frame.operations.map(buildOperation),
        inflow: buildTotals(frame.inflow),
        outflow: buildTotals(frame.outflow)
    }
}

function buildOperation(operation: Operation): OperationResult {
    const amount = operation.getAmount()

    if (amount === null) {
        throw new Error(
            `Operation "${operation.name}" has no resolved amount.`
        )
    }

    return {
        id: operation.id,
        name: operation.name,
        from: operation.from,
        to: operation.to,
        amount,
        scheduleType: operation.getScheduleType(),
        totals: {
            daily: operation.convertTo("daily"),
            weekly: operation.convertTo("weekly"),
            biWeekly: operation.convertTo("biWeekly"),
            monthly: operation.convertTo("monthly"),
            yearly: operation.convertTo("yearly")
        }
    }
}

function buildAccount(account: Account): AccountResult {
    const entries = account.getChargedLedgerEntries()

    return {
        id: account.id,
        name: account.name,
        openingBalance: account.openingBalance,
        closingBalance: entries.at(-1)?.balanceAfter ?? account.openingBalance,
        ledger: entries.map(entry => buildTransaction(entry))
    }
}

function buildTransaction(entry: LedgerEntry): TransactionResult {
    const { transaction, balanceAfter } = entry
    const { operation } = transaction
    const amount = operation.getAmount()

    if (amount === null)
        throw new Error(`Operation "${operation.name}" has no resolved amount.`)

    return {
        id: transaction.id,
        operationId: operation.id,
        operationName: operation.name,
        amount,
        direction: entry.direction,
        scheduledDate: transaction.scheduledDate.toJSON(),
        chargedDate: transaction.chargeDate.toJSON(),
        balanceAfter
    }
}

export function build(frames: readonly Frame[], accounts: readonly Account[]): Result {
    return {
        period: buildSimulationPeriod(frames[0].startDate, frames.at(-1)!.endDate),
        frames: frames.map(buildFrame),
        accounts: accounts.map(buildAccount)
    }
}