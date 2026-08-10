# Transactor domain model

## 1. Scope

Transactor is a declarative financial simulation engine. It models a financial plan over a finite simulation period and compiles that plan into transactions, account ledgers, balances, model periods, totals, and an immutable result.

The renderer is outside the financial domain. It consumes the result but should not invent core financial structure.

## 2. System boundary

### 2.1 Declarative plan

The persisted input currently consists of:

- simulation options;
- accounts;
- configured operations;
- account policies;
- planning strategies.

Configuration monetary values are expressed in major currency units. Core simulation amounts are converted to integer cents.

### 2.2 Working FinancialModel

`FinancialModel` is the mutable working representation used during compilation.

It owns:

- `startDate`;
- `endDate`;
- accounts;
- configured and generated operations;
- strategies;
- the business calendar.

If `startDate` is omitted, the current implementation starts the model tomorrow.

The working model is not the public simulation result.

### 2.3 Compilation

Compilation currently follows this high-level sequence:

```text
populate ledgers
    ↓
resolve deterministic funding seed
    ↓
iteratively resolve feedback-driven values
    ↓
validate resolved transactions
    ↓
charge accounts
    ↓
build immutable Result
```

`Compiler.ts` coordinates these stages; detailed logic lives in compiler modules.

### 2.4 Simulation result

The public `Result` contains:

- simulation period;
- model periods;
- accounts;
- operations;
- transactions;
- ledger entries.

Result monetary values are integer cents.

## 3. Core concepts

### 3.1 Simulation period

The simulation period is an inclusive `startDate` / `endDate` range.

Configured operations, policy-generated operations, and strategy-generated operations are clipped to this range.

The simulation period is a calculation boundary. It does not necessarily represent the real-world creation or closure dates of accounts.

### 3.2 Account

An account is a balance-holding financial entity.

Current properties include:

- ID;
- name;
- opening balance;
- account policies;
- ledger.

The opening balance is the balance from which the simulation begins. Account lifetime/effective dating is not currently modeled separately.

An account may receive or send transactions through operations.

### 3.3 Account policy

An account policy is behavior contractually or structurally owned by an account.

Policies generate operations; they are not planning strategies.

Current policy kinds:

#### Interest policy

Defines:

- annual rate;
- daily calculation period;
- payment schedule.

It generates an interest-payment operation into the owning account.

#### Fee policy

Defines:

- fee name;
- amount;
- schedule.

It generates an expense operation from the owning account.

### 3.4 Planning strategy

A planning strategy is a plan-level management decision. It may reference accounts, but it is not owned by an account.

Current strategy kind:

- `evenPayments`.

Strategies generate operations that participate in the same ledger and compilation machinery as configured operations.

### 3.5 Operation

An operation describes scheduled financial movement.

Current operation properties include:

- ID;
- name;
- amount, which may temporarily be unresolved;
- optional source account;
- optional destination account;
- schedule;
- origin (`configured` or `generated`);
- kind.

An operation with only `to` is an inflow. An operation with only `from` is an outflow. An operation with both is a transfer.

### 3.6 Generated operation kinds

The core currently distinguishes:

- standard operations;
- interest-payment operations;
- funding operations.

Funding-adjustment operations are specialized generated operations used internally to represent the signed initial adjustment of an even-payments strategy.

### 3.7 Effective-dated operation transform

A configured operation may declare transforms effective on specific dates.

The operation compiler splits the authored operation into compiled operation versions whose effective periods do not overlap.

Current transform implementation changes `amount` only.

The input type also declares schedule/day transformation fields, but they are not currently applied.

### 3.8 Schedule

A schedule determines when an operation occurs and how its posting date is adjusted.

Shared schedule types are:

- `once`;
- `daily`;
- `weekly`;
- `biWeekly`;
- `monthly`;
- `yearly`.

Constructible schedules currently include all of the above except `daily`.

#### One-time schedule

A `once` schedule has an explicit `date`. It produces at most one occurrence.

One-time events do not define a stable recurring model state and therefore do not create `ModelPeriod` boundaries.

#### Recurring schedule

Recurring schedules have an effective start and end date. Their occurrences are clipped to both the operation/strategy effective range and the simulation period.

#### Posting adjustment

Schedules may specify:

- `processingDelay`;
- `businessDayPolicy`.

The current operation posting algorithm applies business-day adjustment, then delay, then business-day adjustment again.

### 3.9 ModelPeriod

A `ModelPeriod` is a contiguous inclusive interval during which the set of active **non-once** operations is stable.

A model-period boundary is created by:

- simulation start;
- the start of an active recurring operation;
- the day after an active recurring operation ends.

A `ModelPeriod` contains:

- start date;
- end date;
- exact inclusive day count;
- active operations.

Model periods are not separate `FinancialModel` objects. They are structural views over one model.

They are used by deterministic funding calculations and are emitted as first-class result data.

### 3.10 Occurrence

An occurrence is a scheduled date produced by an operation's schedule.

An occurrence is not yet an account movement. It becomes a transaction after posting-date rules are applied.

### 3.11 Transaction

A transaction is one realized occurrence of an operation.

It records:

- scheduled date;
- charged/posting date;
- operation;
- resolved amount.

A transfer still has one transaction; its two account effects are represented by ledger entries.

### 3.12 Ledger entry

A ledger entry is one account-side effect of a transaction.

It has:

- account;
- transaction;
- direction (`inflow` or `outflow`);
- amount;
- balance after charging in the public result.

Income creates one inflow entry, expense one outflow entry, and transfer two opposite-direction entries.

### 3.13 Balance

Account balance is derived by charging ledger entries in posting order from the opening balance.

Same-day ordering intentionally gives interest entries priority, then other inflows before outflows. Ordering among otherwise equivalent entries is not yet fully specified as a domain rule.

### 3.14 Interest

Interest is represented as a generated operation plus an iterative resolver.

Current semantics:

- annual rate is non-negative;
- accrual is daily;
- only positive balances accrue interest;
- the daily denominator is the actual number of days in that date's year via `LocalDate.daysInYear`;
- an interest payment contains interest accrued through the preceding day;
- accrued interest is rounded to cents at payment;
- one account may have at most one generated interest-payment operation.

Interest participates in iterative convergence with funding adjustments.

### 3.15 Even-payments funding strategy

The even-payments strategy exists to fund a target account with a constant recurring payment while respecting a target minimum balance.

Configuration currently includes:

- `kind: "evenPayments"`;
- optional name;
- target account;
- optional source account;
- recurring schedule;
- optional `adjustInitialBalance`;
- optional `minimumBalance`, defaulting to zero.

The strategy generates:

- one recurring `FundingOperation`;
- when initial adjustment is enabled, two opposite one-time `FundingAdjustmentOperation`s representing the positive and negative sides of one signed adjustment.

Only one adjustment side resolves to a non-zero amount.

#### Deterministic funding seed

Before iterative convergence, the funding compiler estimates the total requirement over the strategy lifetime.

It uses `ModelPeriod`s and actual covered day counts. Daily operations are multiplied by actual covered days. Other recurring amounts are annualized and prorated over exact calendar-year portions.

No average `365.25` year is used.

The total requirement is divided by the actual number of generated funding occurrences and rounded upward to the cent to produce the initial recurring funding seed.

#### Joint funding/interest resolution

When initial adjustment is enabled, the final recurring amount is not fixed by the deterministic seed.

For a fixed interest state, the funding-adjustment resolver searches recurring payment amounts. For each candidate it computes the signed adjustment required to move the lowest balance to `minimumBalance`.

Candidate solutions are ranked by:

1. lowest time-weighted excess balance above `minimumBalance`;
2. smallest absolute initial adjustment;
3. smallest recurring payment.

The score uses end-of-day balances for each actual day in the strategy lifetime.

Interest and funding are repeatedly re-resolved until all participating values move by no more than the configured cent tolerance.

### 3.16 Iterative resolution

Iterative resolution is a compiler mechanism for feedback-driven values.

An iterative resolver reports its maximum change in cents. The compiler repeatedly runs all resolvers until the maximum change is within tolerance.

Current defaults:

- maximum iterations: 100;
- convergence tolerance: 1 cent.

Current iterative resolvers:

- interest;
- even-funding adjustment/optimization.

Interest resolvers run before funding-adjustment resolvers in each pass so funding evaluates the current interest state.

### 3.17 Annualization and calendar accuracy

When dates are known, Transactor uses actual calendar semantics.

`LocalDate.daysInYear` supplies the actual 365/366-day year length.

`prorateAnnualAmount()` splits an inclusive range internally at year boundaries and prorates each portion using that year's real length.

Conventional occurrence counts remain used for non-daily nominal conversions:

- weekly: 52;
- biweekly: 26;
- monthly: 12;
- yearly: 1.

These nominal totals are distinct from exact transaction sums over a simulation period.

### 3.18 Business calendar

The working model currently uses `CanadaBusinessCalendar`.

Business-day policy can be:

- none;
- next;
- previous.

Calendar selection is not yet configurable at plan level.

### 3.19 Money

Configuration values use major currency units.

Core transaction and result calculations use integer cents. Resolvers update amounts in integer cents and convergence is defined in cents.

Currency identity itself is not currently modeled.

### 3.20 Totals

`TotalsResult` exposes nominal equivalents:

- daily;
- weekly;
- biweekly;
- monthly;
- yearly.

These are normalized rate equivalents, not necessarily the actual sum of transactions occurring in the simulation interval.

### 3.21 Zero-value transactions

Zero-value transactions may exist internally because suppressing their creation would complicate compilation.

The result builder filters zero-value financial effects so they do not appear as meaningless public transaction/ledger noise.

## 4. Relationships

```text
FinancialModel
├── Accounts
│   ├── opening balance
│   ├── policies
│   │   ├── interest → generated InterestPaymentOperation
│   │   └── fee      → generated standard Operation
│   └── ledger entries
│
├── Configured operations
│   └── transforms → compiled operation versions
│
├── Strategies
│   └── evenPayments
│       ├── FundingOperation
│       └── optional FundingAdjustmentOperations
│
├── ModelPeriods
│   └── stable sets of active recurring operations
│
└── Compiler
    ├── ledger population
    ├── deterministic funding
    ├── iterative resolution
    │   ├── interest
    │   └── funding adjustment
    ├── validation
    ├── account charging
    └── ResultBuilder
```

## 5. Domain boundaries

Policies and strategies are deliberately separate:

- an **interest policy** belongs to an account because it describes how that account behaves;
- an **account fee policy** belongs to an account for the same reason;
- an **even-payments strategy** belongs to the plan because it describes how the user chooses to manage money between accounts.

`ModelPeriod` is a core simulation concept, not renderer-derived presentation state.

The renderer should interpret result data rather than reconstruct financial rules that the core already knows.

## 6. Concepts intentionally not settled

The following remain intentionally open or incomplete:

- account lifetime/opening-date semantics;
- dated balance checkpoints/reconciliation;
- stable identity for compiled operation versions;
- configurable business calendars;
- full transform semantics beyond amount;
- constructible daily schedules;
- strategy behavior that changes recurring funding per `ModelPeriod`;
- user-selectable trade-off between larger initial reserve and lower recurring payment;
- multiple currencies;
- canonical AST/schema for future graphical/form/DSL editors.
