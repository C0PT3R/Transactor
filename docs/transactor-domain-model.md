# Transactor domain model

## 1. Scope

Transactor is currently a financial simulation engine with a user interface layered on top. It accepts a declarative financial plan, expands recurring rules into dated financial activity, resolves calculated amounts, applies the activity to accounts, and returns an immutable simulation result for presentation.

This document defines the financial concepts represented by the engine. It deliberately separates domain meaning from current class names and implementation details.

## 2. System boundary

### Financial plan

**Definition:** An authored description of accounts, operations, account behaviors, simulation dates, and scheduling rules.

**Current representation:** `FinancialModelData` loaded from JSON.

**Status:** Implemented, but unvalidated.

A financial plan is input. It is not itself a simulation result and should not contain mutable ledger state.

### Working simulation model

**Definition:** The mutable state used while compiling and executing a financial plan.

**Current representation:** `FinancialModel`, `Account`, generated `Operation` objects, transactions, and ledger entries.

**Status:** Implemented.

The current `FinancialModel` combines normalized input, generated behavior, and mutable execution state. This is acceptable for the current stage, but those are conceptually separate responsibilities.

### Simulation

**Definition:** The execution of a financial plan over an inclusive date range using a calendar and deterministic rules.

**Current representation:** `compile(model)`.

**Status:** Implemented.

### Simulation result

**Definition:** An immutable projection containing the period, accounts, operation versions, transactions, ledger entries, and derived totals.

**Current representation:** `Result` and related DTOs in `transactor-common`.

**Status:** Implemented.

## 3. Core concepts

### 3.1 Simulation period

**Definition:** The inclusive range of dates over which transactions may affect account balances and appear in the result.

**Properties:**

- start date
- end date

**Current behavior:**

- The end date is required.
- The start date is optional and defaults to tomorrow at model construction time.
- Transactions are included when their resolved charge date falls within the period.
- Scheduled occurrences may be generated before the start date to allow delayed transactions to enter the simulation period.

**Status:** Implemented.

**Proposed terminology:** `simulationPeriod`, with `startDate` and `endDate` explicitly documented as inclusive.

**Open issues:**

- No validation currently ensures that the start date is on or before the end date.
- A time-dependent default makes the same file produce different results on different days.

### 3.2 Account

**Definition:** A named container of monetary value whose simulated balance changes through ledger entries.

**Essential properties:**

- stable identifier
- display name
- opening balance
- account policies
- funding strategies

**Current behavior:**

- An identifier is accepted from configuration or generated at runtime.
- Opening balances are converted from major currency units to integer cents.
- An account owns a mutable ledger and mutable balance during simulation.
- Accounts generate operations from policies and funding strategies.

**Status:** Implemented.

**Proposed invariants:**

- Account identifiers must be unique within a plan.
- Account names need not be unique, but identifiers must be stable if persisted models or editors refer to them.
- Every operation endpoint must refer to an existing account.

**Current gaps:**

- Identifier uniqueness is not validated.
- Generated identifiers make omitted IDs unstable across loads.
- Account references are resolved only when transactions are populated, so errors are late and not tied to a JSON path.

### 3.3 Account behavior

**Definition:** A rule attached to an account that generates operations during model preparation.

**Current categories:**

- policy
- funding strategy

**Status:** Implemented.

#### Account policy

**Definition:** Contractual or intrinsic behavior of an account.

**Current implementation:** Interest policy.

**Status:** Implemented for one narrow policy type.

#### Funding strategy

**Definition:** A planning rule that generates money transfers intended to satisfy a balance objective.

**Current implementation:** Even-payments funding strategy.

**Status:** Implemented with important limitations.

**Open decision:** Whether a funding strategy is truly intrinsic to an account or should eventually be a plan-level strategy targeting an account.

### 3.4 Operation definition

**Definition:** A rule describing one or more future movements of money.

**Essential properties:**

- identifier
- name
- amount, or an unresolved amount to be calculated
- optional source account
- optional destination account
- schedule
- optional effective-dated changes

**Current representation:** Authored `OperationData`, generated account behavior, and compiled `Operation` instances.

**Status:** Implemented, but several distinct concepts currently share the same class.

An operation may represent:

- an expense: source only
- income: destination only
- a transfer: source and destination
- an interest payment generated by a policy
- a funding transfer generated by a strategy

**Implemented invariants:**

- At least one endpoint must be present.
- Amounts may not be negative.
- A ledger entry rejects a transfer whose source and destination are the same account.

**Proposed invariants:**

- Source and destination must differ before transaction generation.
- Configured standard operations should normally have a resolved amount.
- An unresolved amount should be allowed only for operation kinds with a defined resolver.

### 3.5 Operation version

**Definition:** The effective state of an operation definition over a specific date range.

**Current representation:** Each transformation segment becomes a separate `Operation` instance with its own schedule boundaries.

**Status:** Implemented implicitly.

An authored operation with changes is compiled into one or more versions. Each version is active for a non-overlapping inclusive period.

**Current limitation:** Generated versions reuse the authored operation ID when one was provided. The result can therefore contain multiple operation records with the same ID after a transformation.

**Proposed model:** Distinguish the stable operation-definition ID from the unique operation-version ID.

### 3.6 Effective-dated change

**Definition:** A modification that becomes effective on a specified date and remains in force until superseded by a later change or the operation ends.

**Current name:** `TransformData` / `transforms`.

**Status:** Partial.

**Implemented behavior:**

- Changes are sorted chronologically.
- A change effective before or on the first simulated date is applied before the first version is created.
- A version ends the day before the next change.
- A change is effective inclusively on its date.
- Changes outside the authored operation period are ignored.
- The persisted source object is not mutated.
- Amount changes are applied.

**Declared but not implemented:**

- schedule type change
- schedule day change

**Proposed terminology:** `changes` or `amendments` may communicate the domain meaning more precisely than `transforms`. No rename is required until terminology is settled.

### 3.7 Schedule

**Definition:** A rule that determines when an operation occurs, when it is active, and how an occurrence date is adjusted into a posting date.

**Current representation:** `ScheduleData` and `Schedule` subclasses.

**Status:** Implemented for weekly, biweekly, monthly, and yearly recurrences; declared but unsupported for daily recurrence.

A schedule currently combines three conceptual parts:

1. recurrence rule
2. effective period
3. date adjustment

These may remain one serialized object, but should be treated as separate meanings.

#### Recurrence rule

**Implemented recurrence types:**

- weekly
- biweekly
- monthly
- yearly

**Declared only:**

- daily

**Current semantics:**

- Weekly and biweekly `day` values are epoch-day residues, not clearly documented weekdays.
- Monthly day `-1` means the last day of the month.
- A monthly day beyond the month length is clamped to the last day.
- Yearly schedules similarly clamp an excessive day to the last day of the selected month.
- Yearly day `-1` means the last day of the selected month.

**Open issues:**

- Valid ranges for day and month are not validated.
- Biweekly recurrence has no authored anchor date; it is anchored to absolute epoch-day modulo 14.
- The meaning of the unused `year` field is undefined.

#### Effective period

**Definition:** The inclusive dates during which a schedule may produce occurrences.

**Current behavior:** Operation-level start and end dates default to the simulation boundaries and are clipped to them.

**Status:** Implemented.

#### Date adjustment

**Definition:** Rules that convert the scheduled occurrence date into the date on which the transaction affects balances.

**Current properties:**

- processing delay in days
- business-day policy: none, next, or previous

**Current behavior:**

1. Apply the business-day policy to the scheduled date.
2. Add the processing delay.
3. Apply the same business-day policy again.

**Status:** Implemented.

**Open decision:** Confirm whether this two-stage adjustment is the intended financial meaning. An alternative is delay first, then adjust once.

### 3.8 Occurrence

**Definition:** One activation of an operation version on a date produced by its recurrence rule.

**Current representation:** A `LocalDate` yielded by `Schedule.occurrences`; no explicit occurrence object exists.

**Status:** Implemented implicitly.

**Proposed properties:**

- operation version
- scheduled date

An explicit occurrence type is not required yet, but the concept is useful because it separates recurrence from transaction posting.

### 3.9 Transaction

**Definition:** A concrete movement of money produced from one occurrence of an operation version.

**Current properties:**

- operation reference
- scheduled date
- charge date
- optional per-transaction resolved amount override

**Status:** Implemented.

**Current semantics:**

- A transaction inherits its amount from the operation unless a resolver supplies an override.
- Interest resolution uses per-transaction overrides.
- Funding resolution sets one amount on the generated funding operation, shared by all its transactions.

**Proposed terminology:** `postingDate` or `effectiveDate` is more neutral than `chargeDate`, because the same date is used for inflows and transfers.

**Proposed invariant:** A transaction must have a resolved non-negative amount before balances are applied and the result is built.

### 3.10 Ledger entry

**Definition:** The effect of one transaction on one account.

**Current properties:**

- transaction reference
- direction: inflow or outflow
- balance after posting
- charged state

**Status:** Implemented.

**Current behavior:**

- Income produces one inflow entry.
- Expense produces one outflow entry.
- Transfer produces one outflow and one inflow entry linked to the same transaction.
- Entries are ordered by charge date.
- Interest entries are applied before other entries on the same date.
- Other same-day inflows are applied before outflows.

**Proposed invariant:** A transfer must create exactly two entries of equal amount and opposite direction.

### 3.11 Balance

**Definition:** The monetary state of an account after applying charged ledger entries to its opening balance.

**Current representation:** Integer cents.

**Status:** Implemented.

**Current semantics:**

- Balances may become negative for ordinary accounts.
- No overdraft, credit limit, minimum balance, or account-type rule exists.
- Same-day ordering can affect intermediate balances and funding calculations.

### 3.12 Interest policy

**Definition:** A policy that accrues interest on an account balance and generates periodic interest-payment transactions.

**Current properties:**

- annual rate
- calculation period, currently daily only
- payment schedule, defaulting to monthly on day 1

**Status:** Partial.

**Current implemented calculation:**

- Accrual is daily.
- The denominator is 365 or 366 according to the current year.
- Interest accrues only on a positive closing balance.
- A payment contains interest accrued through the previous day.
- Accrued interest is rounded to the nearest cent when paid.
- Interest payments are posted before other transactions on the payment date.
- Only one generated interest operation is allowed per account.

**Known mismatch:** The source comment says the first payment must follow at least one day of accrual and that the schedule starts one day after the model begins. The implementation does not add that day. A model beginning on a matching payment date can currently generate a zero-value payment on its opening date.

**Current limitations:**

- Only incoming interest is modeled.
- Negative-balance interest and debt interest are unsupported.
- No compounding convention beyond periodic posting is configurable.
- Funding is solved without interest, then interest is calculated afterward.

### 3.13 Even-payments funding strategy

**Definition:** A strategy that calculates a constant recurring transfer amount intended to prevent the target account from becoming negative during the strategy period.

**Current properties:**

- generated operation name
- optional source account
- target account, implied by attachment
- schedule

**Status:** Partial.

**Current implemented calculation:**

- Funding periods for the same account may not overlap.
- Existing non-interest transactions are projected in ledger order.
- The resolver determines the greatest equal payment needed to cover any projected deficit after funding begins.
- The result is rounded upward to a whole cent.
- All occurrences of one funding operation share the same resolved amount.
- Interest is excluded from the funding calculation.
- The strategy fails if the account becomes negative before its first funding occurrence.

**Current limitations:**

- The objective is implicit rather than represented as a general balance target.
- No minimum reserve above zero is configurable.
- No maximum payment or source-account affordability rule exists.
- The source account may be omitted, creating external income rather than a transfer.
- The strategy does not converge jointly with interest.

### 3.14 Business calendar

**Definition:** A calendar used to determine whether a date is a business day for posting adjustment.

**Current implementation:** Hard-coded `CanadaBusinessCalendar`.

**Status:** Partial.

**Current holidays represented:**

- New Year's Day
- Good Friday, subject to an implementation concern described below
- Canada Day
- Labour Day
- Thanksgiving
- Christmas Day
- Boxing Day

**Current limitations:**

- The calendar is not configurable.
- Province-specific holidays are not represented.
- Observed holidays are not represented.
- Several Canadian holidays are absent.
- Good Friday compares `LocalDate` objects with `==`; correctness depends on that library's coercion behavior and requires a test.

### 3.15 Money

**Definition:** Monetary amounts used by the simulation.

**Current representation:**

- Decimal major units at configuration boundaries.
- Integer cents inside the core and result DTOs.

**Status:** Implemented.

**Current semantics:**

- Configuration decimals are rounded to cents.
- Internal values must be safe integers.
- Currency identity is not represented; the model effectively assumes one unnamed currency.

**Proposed future concept:** Introduce currency only when multiple currencies or currency-specific formatting becomes a real requirement.

### 3.16 Totals

**Definition:** Normalized periodic equivalents derived from an operation amount and recurrence frequency.

**Current representation:** Daily, weekly, biweekly, monthly, and yearly totals on operation results.

**Status:** Implemented as an estimate.

**Current semantics:**

- Daily uses 365.25 periods per year.
- Weekly uses 52.
- Biweekly uses 26.
- Monthly uses 12.
- Yearly uses 1.

These totals normalize the nominal operation amount; they do not sum the actual transactions occurring in a specific simulation period.

## 4. Relationships

```text
Financial plan
├── defines simulation period
├── defines accounts
├── defines configured operation definitions
└── selects or implies a business calendar

Account
├── owns opening balance
├── has policies
├── has funding strategies
└── receives ledger entries during simulation

Account behavior
└── generates operation definitions or operation versions

Operation definition
├── references zero or one source account
├── references zero or one destination account
├── owns a schedule
└── may own effective-dated changes

Operation definition
└── compiles into one or more operation versions

Operation version
└── produces scheduled occurrences

Occurrence
└── produces one transaction

Transaction
└── produces one or two ledger entries

Ledger entry
└── changes one account balance
```

## 5. Recommended compiler vocabulary

The existing implementation does not need to be restructured immediately. The following vocabulary can nevertheless guide future changes:

```text
source financial plan
→ load
→ structural validation
→ reference resolution
→ semantic validation
→ compile operation versions
→ generate account-behavior operations
→ generate occurrences and transactions
→ resolve calculated amounts
→ post ledger entries
→ build immutable result
```

## 6. Concepts intentionally not defined yet

The current domain does not need premature definitions for:

- custom textual DSL syntax
- AST and concrete syntax tree architecture
- graphical editor synchronization
- loans and amortization
- securities and market valuation
- taxes
- multiple currencies
- uncertainty and probabilistic simulation
- scenario inheritance
- optimization beyond the existing funding strategy

Those should be introduced only when an actual feature requires them.
