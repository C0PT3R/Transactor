# Transactor domain rules

This file lists observable financial and simulation rules. It is intended to become the basis for validation and automated tests.

## 1. Plan and simulation period

| ID | Rule | Status | Current evidence or gap |
|---|---|---|---|
| PLAN-001 | A plan has exactly one simulation end date. | Implemented | `FinancialModelOptions.endDate` is required. |
| PLAN-002 | A plan has exactly one simulation start date. | Implemented | Explicit value or runtime default of tomorrow. |
| PLAN-003 | Simulation boundaries are inclusive. | Implemented | Charge dates are accepted through `isBetween(start, end)` and account charging uses the same window. |
| PLAN-004 | Start date must not be after end date. | Proposed | No explicit validation exists. |
| PLAN-005 | The same persisted plan should produce the same result when inputs are unchanged. | Proposed | Omitted start date and generated IDs currently make results time-dependent and identity-unstable. |
| PLAN-006 | Input should be validated before domain construction. | Proposed | Loader currently contains a validation TODO. |

## 2. Accounts

| ID | Rule | Status | Current evidence or gap |
|---|---|---|---|
| ACC-001 | Every account has an identifier. | Implemented | Missing IDs are generated. |
| ACC-002 | Account identifiers are unique within a plan. | Proposed | Not validated. |
| ACC-003 | Every account has a name. | Declared only | Type requires it, but runtime JSON is not validated. |
| ACC-004 | Opening balance defaults to zero. | Implemented | Constructor applies `openingBalance ?? 0`. |
| ACC-005 | Opening balances are stored as integer cents. | Implemented | Converted by `currencyToCents`. |
| ACC-006 | Every referenced account must exist. | Partial | `getAccount` eventually rejects unknown IDs, but no early reference validation exists. |
| ACC-007 | Account balance equals opening balance plus charged inflows minus charged outflows. | Implemented | `Account.charge`. |

## 3. Operations

| ID | Rule | Status | Current evidence or gap |
|---|---|---|---|
| OP-001 | An operation must define a source, a destination, or both. | Implemented | Enforced by `Operation` constructor. |
| OP-002 | Source and destination must not be the same account. | Partial | Enforced only when a ledger entry is created. |
| OP-003 | Operation amount cannot be negative. | Implemented | Enforced for configured and resolved amounts. |
| OP-004 | Monetary operation amounts are stored as integer cents. | Implemented | Configured values converted; resolved values asserted. |
| OP-005 | A configured standard operation must have a resolved amount before posting. | Partial | Null is accepted, then compilation eventually fails if no resolver exists. |
| OP-006 | Only known operation kinds may have unresolved amounts. | Proposed | No kind-specific validation exists. |
| OP-007 | Income has only a destination. | Implemented as classification | `isIncome`. |
| OP-008 | Expense has only a source. | Implemented as classification | `isExpense`. |
| OP-009 | Transfer has both source and destination. | Implemented as classification | `isTransfer`. |
| OP-010 | Generated operations are distinguishable from configured operations. | Implemented | `origin`. |
| OP-011 | Operation kinds distinguish standard, interest payment, and funding. | Implemented | `kind`. |

## 4. Effective-dated operation changes

| ID | Rule | Status | Current evidence or gap |
|---|---|---|---|
| CHG-001 | Changes are applied in chronological order. | Implemented | Changes are sorted before compilation. |
| CHG-002 | A change is effective on its stated date. | Implemented | Prior version ends one day earlier. |
| CHG-003 | An unspecified property retains its previous value. | Implemented for amount | Object copy plus nullish fallback. |
| CHG-004 | Changes before simulation start still affect the first simulated version. | Implemented | Pre-start loop applies them. |
| CHG-005 | Changes outside the operation's authored active period are ignored. | Implemented | Filtered against authored dates. |
| CHG-006 | Amount may change. | Implemented | `applyTransform`. |
| CHG-007 | Recurrence type may change. | Declared only | Field exists but is ignored. |
| CHG-008 | Recurrence day may change. | Declared only | Field exists but is ignored. |
| CHG-009 | Every operation version has a unique identity and a stable link to its definition. | Proposed | Multiple versions can currently share one configured ID. |
| CHG-010 | Two changes on the same date have deterministic, documented semantics. | Partial | Stable sort/input order likely determines composition, but this is undocumented and unvalidated. |

## 5. Schedules and occurrences

| ID | Rule | Status | Current evidence or gap |
|---|---|---|---|
| SCH-001 | Schedule start and end dates are inclusive. | Implemented | `isActive` and generators use inclusive comparisons. |
| SCH-002 | A schedule is clipped to the simulation period. | Implemented | Operation compiler and generated behaviors clip dates. |
| SCH-003 | Weekly schedules require a day selector. | Implemented at construction | Runtime range is not validated. |
| SCH-004 | Biweekly schedules require a day selector. | Implemented at construction | Meaning is epoch modulo 14, not a documented weekday plus anchor. |
| SCH-005 | Monthly schedules require a day selector. | Implemented at construction | Runtime range is not validated. |
| SCH-006 | Yearly schedules require month and day selectors. | Implemented at construction | Runtime ranges are not validated. |
| SCH-007 | Monthly day `-1` means last day of month. | Implemented | Monthly schedule. |
| SCH-008 | A monthly day beyond month length is clamped to month end. | Implemented | Monthly schedule. |
| SCH-009 | Yearly day `-1` means last day of selected month. | Implemented | Yearly schedule. |
| SCH-010 | A yearly day beyond month length is clamped to month end. | Implemented | Yearly schedule. |
| SCH-011 | Daily recurrence is supported. | Declared only | Registry maps `daily` to null and factory rejects it. |
| SCH-012 | Schedule field values are validated with useful diagnostics. | Proposed | No configuration validation exists. |
| SCH-013 | Biweekly schedules have an explicit anchor date. | Proposed | Current recurrence is globally anchored to epoch-day modulo 14. |
| SCH-014 | Every occurrence belongs to exactly one operation version. | Implemented implicitly | Generator is called per version. |

## 6. Posting dates and business days

| ID | Rule | Status | Current evidence or gap |
|---|---|---|---|
| DATE-001 | A transaction records both scheduled date and posting/charge date. | Implemented | `Transaction`. |
| DATE-002 | Only transactions whose charge date is inside the simulation period are included. | Implemented | `populateLedgers`. |
| DATE-003 | The business-day policy may be none, next, or previous. | Implemented | Type and adjustment function. |
| DATE-004 | Current adjustment order is business-day adjustment, processing delay, then business-day adjustment again. | Implemented | `resolveTransactionDate`. |
| DATE-005 | The adjustment order is an intentional, documented domain rule. | Open decision | Current behavior may be accidental or may be correct. |
| DATE-006 | The business calendar is selected by the plan or simulation context. | Proposed | Canada calendar is hard-coded. |
| DATE-007 | Holiday rules include observed dates and applicable regional holidays. | Proposed | Current calendar is incomplete. |
| DATE-008 | Good Friday is recognized correctly. | Partial | Implementation requires a value-comparison test for `LocalDate`. |

## 7. Transactions and ledger entries

| ID | Rule | Status | Current evidence or gap |
|---|---|---|---|
| TX-001 | One occurrence creates one transaction. | Implemented | `populateLedgers`. |
| TX-002 | A transaction must have a resolved non-negative amount before posting. | Implemented late | Resolution is checked before/while charging and validating. |
| TX-003 | Income creates exactly one inflow ledger entry. | Implemented | Destination ledger only. |
| TX-004 | Expense creates exactly one outflow ledger entry. | Implemented | Source ledger only. |
| TX-005 | Transfer creates two ledger entries linked to one transaction. | Implemented | Source and destination both receive the transaction. |
| TX-006 | Transfer entries have equal amounts and opposite directions. | Implemented by shared transaction amount | No explicit aggregate assertion exists. |
| TX-007 | Interest entries post before other same-day entries. | Implemented | Ledger sort. |
| TX-008 | Other inflows post before outflows on the same day. | Implemented | Ledger sort. |
| TX-009 | Same-day ordering among otherwise equivalent entries is deterministic. | Partial | Sort returns zero; effective order depends on stable sort and insertion order. |
| TX-010 | Transaction IDs are stable across recompilation of unchanged inputs. | Not implemented | Result builder generates random IDs. |
| TX-011 | Ledger-entry IDs are stable across recompilation of unchanged inputs. | Not implemented | Result builder generates random IDs. |

## 8. Interest

| ID | Rule | Status | Current evidence or gap |
|---|---|---|---|
| INT-001 | Interest rate must be finite and non-negative. | Implemented | Interest operation constructor. |
| INT-002 | Interest calculation period is daily. | Implemented | Other values rejected. |
| INT-003 | Daily rate uses actual days in the current year. | Implemented | 365/366 denominator. |
| INT-004 | Interest accrues on positive closing balance only. | Implemented | `balance > 0`. |
| INT-005 | A payment includes accrual through the preceding day. | Implemented | Payment occurs before today's ordinary entries and before today's accrual. |
| INT-006 | Accrued interest is rounded to cents on payment. | Implemented | `Math.round`. |
| INT-007 | An account has at most one interest-payment operation. | Implemented | Resolver rejects more than one. |
| INT-008 | The first interest payment follows at least one day of accrual. | Intended but not implemented | Comment states this, generated schedule does not enforce it. |
| INT-009 | Interest and funding are solved consistently with each other. | Not implemented by design | Funding excludes interest, then interest is resolved. |
| INT-010 | Negative-balance interest may be modeled. | Not implemented | Accrual is positive-balance only and always an inflow. |

## 9. Funding

| ID | Rule | Status | Current evidence or gap |
|---|---|---|---|
| FUND-001 | Even-payments funding creates one generated recurring operation per strategy. | Implemented | Strategy generator. |
| FUND-002 | Funding amount is constant across occurrences of one strategy period. | Implemented | Amount resolved on operation. |
| FUND-003 | Funding amount is the smallest whole-cent equal payment found by the current algorithm that prevents a projected negative target balance after funding begins. | Implemented | Maximum deficit divided by payments seen, rounded up. |
| FUND-004 | Funding periods for one account must not overlap. | Implemented | Explicit assertion. |
| FUND-005 | Funding fails if the target becomes negative before the first funding payment. | Implemented | Explicit error. |
| FUND-006 | Funding ignores interest during amount calculation. | Implemented by design | Explicit exclusion. |
| FUND-007 | Funding may target a configurable minimum balance rather than zero. | Proposed | No target field exists. |
| FUND-008 | Funding respects affordability of its source account. | Proposed | Source-account balance does not constrain the calculation. |
| FUND-009 | Funding strategy source must reference an existing account when provided. | Partial | Eventually fails during ledger population, without early validation. |

## 10. Results and totals

| ID | Rule | Status | Current evidence or gap |
|---|---|---|---|
| RES-001 | Result DTO monetary values are integer cents. | Implemented | Shared types and builders. |
| RES-002 | Result includes period, accounts, operations, transactions, and ledger entries. | Implemented | `Result`. |
| RES-003 | Result accounts include opening and closing balances. | Implemented | Result builder. |
| RES-004 | Result transactions reference their operation and ledger entries. | Implemented | IDs in DTO. |
| RES-005 | Operation totals are normalized nominal equivalents, not actual period sums. | Implemented | `Totals.fromOperations` and conversion factors. |
| RES-006 | Result identity is reproducible for unchanged input. | Not implemented | Random transaction and ledger IDs; generated account/operation IDs when omitted. |
| RES-007 | Operation versions are unambiguously identifiable. | Partial | Duplicate IDs are possible after transformations. |

## 11. Minimum test suite derived from the domain

The following tests would give the documents practical force:

1. Reject simulation start after end.
2. Reject duplicate account IDs.
3. Reject unknown source and destination IDs before compilation.
4. Reject an operation with neither endpoint.
5. Reject an operation whose source equals destination.
6. Verify income, expense, and transfer ledger cardinality and directions.
7. Verify monthly and yearly month-end clamping.
8. Verify exact weekly and biweekly anchoring semantics.
9. Verify posting-date adjustment order for weekend dates and delays.
10. Verify changes before start, on start, during the period, and on end date.
11. Verify that declared schedule/day changes either work or are rejected as unsupported.
12. Verify interest opening-date behavior.
13. Verify Good Friday recognition.
14. Verify leap-year daily interest denominator.
15. Verify funding failure before first payment.
16. Verify non-overlapping funding periods.
17. Verify same-day interest, inflow, and outflow ordering.
18. Verify unique operation-version identity after transformations.
