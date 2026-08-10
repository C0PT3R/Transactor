# Transactor domain rules

This file records observable domain behavior. Status describes the current source, not desired future behavior.

## 1. Plan and simulation period

| ID | Rule | Status |
|---|---|---|
| PLAN-001 | A model has an inclusive simulation start and end date. | Implemented |
| PLAN-002 | If start date is omitted, the current implementation starts tomorrow. | Implemented |
| PLAN-003 | Configured/generated operation effective ranges are clipped to the simulation period. | Implemented |
| PLAN-004 | Start date must not be after end date. | Partial — failures are not handled through a comprehensive input-validation boundary. |
| PLAN-005 | The business calendar is currently Canadian and model-global. | Implemented limitation |

## 2. Accounts and policies

| ID | Rule | Status |
|---|---|---|
| ACC-001 | An account has an ID, name, opening balance, policies, and ledger. | Implemented |
| ACC-002 | Missing account IDs may be generated. | Implemented |
| ACC-003 | Account policies belong to accounts; planning strategies do not. | Implemented |
| ACC-004 | Interest is an account policy. | Implemented |
| ACC-005 | Account fees are account policies. | Implemented |
| ACC-006 | Account lifetime/opening date is modeled independently from simulation start. | Proposed |
| ACC-007 | Dated balance checkpoints/reconciliation are supported. | Proposed |

## 3. Operations and transforms

| ID | Rule | Status |
|---|---|---|
| OP-001 | A configured operation may have source, destination, or both. | Implemented |
| OP-002 | One-sided destination operations are inflows; one-sided source operations are outflows; two-sided operations are transfers. | Implemented |
| OP-003 | Operation amounts are integer cents internally after conversion from configuration values. | Implemented |
| OP-004 | Generated operations use the same transaction/ledger machinery as configured operations. | Implemented |
| OP-005 | An authored operation may be split into effective-dated compiled versions. | Implemented |
| CHG-001 | Transforms effective before simulation start are applied before the first compiled version. | Implemented |
| CHG-002 | Transform dates split operation versions at the effective date. | Implemented |
| CHG-003 | `amount` transforms are applied. | Implemented |
| CHG-004 | Declared schedule transforms are applied. | Declared only |
| CHG-005 | Declared day transforms are applied. | Declared only |
| CHG-006 | Compiled versions have guaranteed unique IDs while preserving source lineage. | Proposed |

## 4. Schedules

| ID | Rule | Status |
|---|---|---|
| SCH-001 | Schedule effective start/end dates are inclusive. | Implemented |
| SCH-002 | `once` schedules require an explicit date and produce at most one occurrence. | Implemented |
| SCH-003 | Weekly schedules are constructible. | Implemented |
| SCH-004 | Biweekly schedules are constructible. | Implemented |
| SCH-005 | Monthly schedules are constructible. | Implemented |
| SCH-006 | Yearly schedules are constructible. | Implemented |
| SCH-007 | Daily recurrence exists in shared types. | Implemented type only |
| SCH-008 | Daily recurrence is constructible through `ScheduleFactory`. | Not implemented |
| SCH-009 | Monthly day `-1` means month end. | Implemented |
| SCH-010 | Monthly days beyond month length clamp to month end. | Implemented |
| SCH-011 | Yearly day `-1` means the last day of the selected month. | Implemented |
| SCH-012 | Yearly days beyond month length clamp to month end. | Implemented |
| SCH-013 | Biweekly recurrence has an explicit user-defined anchor. | Proposed |
| SCH-014 | Schedule selectors receive comprehensive range validation. | Proposed |

## 5. Model periods

| ID | Rule | Status |
|---|---|---|
| MP-001 | `ModelPeriod` is a core concept and is included in `Result`. | Implemented |
| MP-002 | A model period is a contiguous interval with a stable set of active non-once operations. | Implemented |
| MP-003 | Simulation start creates the first boundary. | Implemented |
| MP-004 | Recurring operation starts and the day after recurring operation ends create boundaries when inside the simulation. | Implemented |
| MP-005 | One-time operations do not create model-period boundaries. | Implemented |
| MP-006 | `dayCount` is the exact inclusive number of calendar days. | Implemented |
| MP-007 | Model periods are separate nested `FinancialModel` instances. | Not implemented by design |

## 6. Posting dates and business days

| ID | Rule | Status |
|---|---|---|
| DATE-001 | Transactions record scheduled and charged dates. | Implemented |
| DATE-002 | Only transactions whose charged date lies inside the simulation are included. | Implemented |
| DATE-003 | Business-day policy supports none, next, and previous. | Implemented |
| DATE-004 | Posting currently applies business-day adjustment, processing delay, then business-day adjustment again. | Implemented |
| DATE-005 | That adjustment order is a formally settled domain rule. | Open decision |
| DATE-006 | Business calendar is configurable per plan. | Proposed |
| DATE-007 | Calendar logic should use `LocalDate` value/calendar APIs rather than duplicate leap-year arithmetic. | Implemented for current annualization/interest code |

## 7. Transactions, ledger entries, and ordering

| ID | Rule | Status |
|---|---|---|
| TX-001 | One schedule occurrence creates one transaction. | Implemented |
| TX-002 | A transaction must have a resolved non-negative amount before charging. | Implemented |
| TX-003 | Income creates one inflow ledger entry. | Implemented |
| TX-004 | Expense creates one outflow ledger entry. | Implemented |
| TX-005 | Transfer creates two ledger entries linked to one transaction. | Implemented |
| TX-006 | Transfer entries share the same amount and have opposite directions. | Implemented |
| TX-007 | Interest entries post before other same-day entries. | Implemented |
| TX-008 | Other same-day inflows post before outflows. | Implemented |
| TX-009 | Ordering among otherwise equivalent same-day entries is fully specified independent of insertion order. | Partial |
| TX-010 | Zero-value financial effects may exist internally but are omitted from the public result. | Implemented |
| TX-011 | Transaction and ledger-entry IDs are stable across recompilation. | Not implemented |

## 8. Interest

| ID | Rule | Status |
|---|---|---|
| INT-001 | Interest rate must be finite and non-negative. | Implemented |
| INT-002 | Current interest calculation period is daily. | Implemented |
| INT-003 | Daily interest uses the actual number of days in the current year via `LocalDate.daysInYear`. | Implemented |
| INT-004 | Interest accrues only on positive closing balance. | Implemented |
| INT-005 | A payment contains accrual through the preceding day. | Implemented |
| INT-006 | Accrued interest is rounded to cents on payment. | Implemented |
| INT-007 | An account may have at most one interest-payment operation. | Implemented |
| INT-008 | Interest participates in iterative convergence with funding adjustment. | Implemented |
| INT-009 | Interest on negative balances is modeled. | Not implemented |
| INT-010 | The first interest payment is guaranteed to follow at least one completed accrual day. | Needs explicit test/confirmation |

## 9. Even-payments funding

| ID | Rule | Status |
|---|---|---|
| FUND-001 | `evenPayments` generates one recurring funding operation. | Implemented |
| FUND-002 | The funding schedule must be recurring; `once` is rejected. | Implemented |
| FUND-003 | `minimumBalance` is optional and defaults to zero. | Implemented |
| FUND-004 | `adjustInitialBalance` may disable initial adjustment. | Implemented |
| FUND-005 | When adjustment is enabled, the strategy generates opposite one-time inflow/outflow adjustment operations. | Implemented |
| FUND-006 | The signed initial adjustment may be positive or negative. | Implemented |
| FUND-007 | Only one adjustment direction should resolve non-zero for a solution. | Implemented |
| FUND-008 | Funding periods targeting the same account may not overlap. | Implemented |
| FUND-009 | Deterministic funding uses `ModelPeriod`s and actual covered days. | Implemented |
| FUND-010 | Daily requirements use actual covered day count. | Implemented |
| FUND-011 | Annual proration across years uses each actual year's length. | Implemented |
| FUND-012 | The deterministic seed divides total requirement by the actual number of generated funding occurrences. | Implemented |
| FUND-013 | The deterministic seed rounds upward to whole cents and never below zero. | Implemented |
| FUND-014 | With adjustment enabled, final recurring funding and initial adjustment are solved together rather than treating the seed as final. | Implemented |
| FUND-015 | The hard balance target is `balance >= minimumBalance` throughout the strategy lifetime after applying the selected signed adjustment. | Implemented by resolver construction |
| FUND-016 | Candidate solutions minimize time-weighted excess balance over the strategy lifetime. | Implemented |
| FUND-017 | Equal scores prefer smaller absolute adjustment, then smaller recurring payment. | Implemented |
| FUND-018 | Funding optimization currently uses one global recurring amount across the strategy lifetime, not one amount per model period. | Implemented |
| FUND-019 | Source-account affordability constrains the strategy optimization. | Not implemented |

## 10. Iterative resolution

| ID | Rule | Status |
|---|---|---|
| ITER-001 | Feedback-driven values implement a common iterative-resolver contract. | Implemented |
| ITER-002 | Iteration continues until the maximum resolver delta is within monetary tolerance. | Implemented |
| ITER-003 | Default tolerance is one cent. | Implemented |
| ITER-004 | Default maximum iteration count is 100. | Implemented |
| ITER-005 | Failure to converge within the maximum throws an error. | Implemented |
| ITER-006 | Interest resolvers run before funding-adjustment resolvers in each pass. | Implemented |
| ITER-007 | Recurring funding seed calculation itself is deterministic and runs before iterative resolution. | Implemented |

## 11. Calendar accuracy and annualization

| ID | Rule | Status |
|---|---|---|
| CALC-001 | Core annualization does not use an average 365.25-day year. | Implemented |
| CALC-002 | Daily annualization uses the actual referenced year's `daysInYear`. | Implemented |
| CALC-003 | Annual amounts prorated across multiple years are split internally and weighted by each actual year length. | Implemented |
| CALC-004 | Weekly/monthly/etc. nominal conversions use conventional periods-per-year values. | Implemented |
| CALC-005 | Nominal normalized totals are distinct from actual transaction sums over a finite interval. | Implemented |

## 12. Results

| ID | Rule | Status |
|---|---|---|
| RES-001 | Result monetary values are integer cents. | Implemented |
| RES-002 | Result includes simulation period, model periods, accounts, operations, transactions, and ledger entries. | Implemented |
| RES-003 | Account results include opening and closing balances. | Implemented |
| RES-004 | Model-period results include exact day count, active operation IDs, inflow, outflow, and net totals. | Implemented |
| RES-005 | Operation totals are nominal normalized equivalents, not actual simulation-period sums. | Implemented |
| RES-006 | Public result identity is reproducible for unchanged input. | Not implemented |
| RES-007 | Compiled operation versions are unambiguously identifiable. | Partial |

## 13. Minimum test suite

High-value tests should include:

1. Reject invalid simulation ranges.
2. Reject duplicate account IDs.
3. Reject unknown account references before ledger population.
4. Verify income, expense, and transfer ledger cardinality.
5. Verify `once` schedule behavior and clipping.
6. Verify monthly/yearly month-end clamping.
7. Verify exact biweekly anchoring semantics.
8. Verify posting-date adjustment order.
9. Verify amount transforms before/on/inside the simulation period.
10. Verify unsupported transform fields are rejected or explicitly documented.
11. Verify model-period boundaries and exact inclusive day counts.
12. Verify one-time events do not split model periods.
13. Verify leap-year interest uses 366 days.
14. Verify annual proration across a Dec/Jan boundary and across Feb 29.
15. Verify even funding uses actual funding occurrence count.
16. Verify `minimumBalance` above zero.
17. Verify positive, zero, and negative initial funding adjustments.
18. Verify funding/interest convergence.
19. Verify one-cent convergence tolerance does not create material balance violations.
20. Verify funding solution scoring is time-weighted by actual days.
21. Verify zero-value transactions are absent from public results.
22. Verify same-day interest/inflow/outflow ordering.
23. Verify operation-version identity after transforms.
