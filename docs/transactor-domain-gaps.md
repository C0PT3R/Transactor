# Domain gaps and decisions

This file tracks differences between the current implementation and a coherent, explicitly defined domain model. It is not a promise that every item must be implemented. Items may be accepted as intentional limitations, changed, or removed.

## Priority meanings

- **P0 — correctness risk:** Existing behavior can be wrong, ambiguous, or silently misleading.
- **P1 — model integrity:** Needed to make the current domain reliable and maintainable.
- **P2 — capability completion:** A concept is already exposed or partially present but incomplete.
- **P3 — future design:** Useful later, but not required to stabilize the current engine.

## P0 — correctness risks

### GAP-001: No runtime configuration validation

**Current state:** JSON is cast to `FinancialModelData` after parsing. The loader contains a validation TODO.

**Risk:** Missing fields, invalid dates, invalid schedule values, duplicate IDs, unknown references, and unsupported combinations fail late or behave unpredictably.

**Should be:** Validate structure, primitive values, date ranges, identifiers, references, recurrence-specific fields, and supported combinations before constructing the working model. Diagnostics should identify the JSON path and the violated rule.

**Suggested first step:** Add one validation boundary returning a list of diagnostics. Do not scatter all input validation through constructors.

### GAP-002: Declared transformation fields are silently ignored

**Current state:** `TransformData.params` declares `schedule` and `day`, but `applyTransform` applies only `amount`.

**Risk:** A valid-looking model can be accepted while producing a result that ignores authored instructions.

**Should be:** Either implement these fields or reject them explicitly as unsupported. Silent acceptance should not continue.

### GAP-003: Interest opening-date behavior contradicts its source comment

**Current state:** The comment says the first payment must follow at least one day of accrual and that the generated schedule begins one day after the model starts. The implementation does not add one day.

**Risk:** A simulation beginning on an interest payment date may produce a zero-value payment on day one and reset accrual unnecessarily.

**Should be:** Choose the intended rule, implement it, and add tests. The likely intended rule is no payment before at least one completed accrual day.

### GAP-004: Operation-version identity is ambiguous

**Current state:** An authored operation is split into multiple `Operation` objects after changes. If the source has an ID, every version receives that same ID.

**Risk:** Result records may have duplicate operation IDs, breaking maps, UI selection, cross-references, and future editing.

**Should be:** Give each operation definition a stable definition ID and each compiled version a unique version ID, or otherwise guarantee unique result operation IDs while preserving lineage.

### GAP-005: Good Friday calculation may compare object identity

**Current state:** `easter == date` compares two `LocalDate` objects.

**Risk:** Good Friday may never be recognized unless the library implements primitive coercion compatible with this comparison.

**Should be:** Add a direct test. If necessary, compare epoch days or use the library's value equality API.

## P1 — model integrity

### GAP-006: Account and operation identifiers are not guaranteed stable

**Current state:** Missing IDs are randomly generated at load/compile time. Transaction and ledger IDs are randomly generated while building every result.

**Consequence:** The same model can produce structurally equivalent results with different identities, complicating UI state, comparison, caching, and future editor synchronization.

**Should be:** Decide which identities must be persistent and which are execution-local. At minimum, authored entities used as references should have stable IDs.

### GAP-007: Duplicate IDs are not rejected

**Current state:** Accounts and operations are arrays without uniqueness validation.

**Should be:** Enforce uniqueness in the relevant namespace. Decide whether accounts and operations share one global namespace or separate namespaces.

### GAP-008: Unknown references fail late

**Current state:** Account references are resolved while ledger entries are populated.

**Should be:** Resolve and validate all references before generating occurrences. Diagnostics should identify the operation or strategy and offending field.

### GAP-009: Standard operations may carry unresolved amounts

**Current state:** `OperationData.amount` permits `null` for every operation. Only generated funding and interest have resolvers.

**Should be:** Make unresolved amounts a deliberate domain state associated with a known resolution mechanism. Reject unresolved configured standard operations unless a future expression or resolver is explicitly attached.

### GAP-010: Same-day ordering is only partially specified

**Current state:** Interest precedes other entries; then inflows precede outflows; otherwise sort returns equality.

**Consequence:** Multiple same-day inflows or outflows depend on insertion and stable-sort behavior. This may affect intermediate balances and strategies.

**Should be:** Decide whether order among equivalent entries is financially meaningful. If it is, define a deterministic tie-breaker. If not, ensure no calculation relies on the intermediate order.

### GAP-011: FinancialModel mixes definition and mutable execution state

**Current state:** The class owns dates, account objects with mutable ledgers, compiled configured operations, and generated operations.

**Should be:** No immediate rewrite is necessary. As the editor or alternate front ends appear, separate persisted plan data, validated domain definition, and simulation execution state.

## P2 — capability completion

### GAP-012: Daily schedule is declared but not constructible

**Current state:** `ScheduleType` includes `daily`, but the registry maps it to `null`.

**Should be:** Implement daily recurrence or remove/reject the option at the public type and validation boundary.

### GAP-013: Schedule `year` field has no defined behavior

**Current state:** `ScheduleData.year` exists and is unused.

**Should be:** Remove it until needed or define its meaning. An unused accepted field should not imply support.

### GAP-014: Schedule selectors lack range validation

**Current state:** Constructors check presence, not valid ranges.

**Examples requiring decisions:**

- weekly day representation and range
- biweekly phase/anchor representation
- monthly accepted days, including `-1`
- yearly month range
- yearly day range
- negative processing delay

**Should be:** Define and validate each recurrence grammar explicitly.

### GAP-015: Biweekly schedules have an implicit global anchor

**Current state:** Occurrences are selected by epoch-day modulo 14.

**Consequence:** The `day` value is not self-explanatory and cannot naturally express “every second Tuesday beginning on a known payday.”

**Should be:** Introduce an anchor date or define a clear phase plus weekday representation.

### GAP-016: Business calendar is hard-coded and incomplete

**Current state:** Every model uses one Canada calendar with a small holiday list.

**Should be:** Eventually make the calendar part of simulation context. Before expanding it, define whether the purpose is bank-processing days, statutory holidays, employer business days, or another calendar.

### GAP-017: Posting-date adjustment semantics need confirmation

**Current state:** Business-day adjustment occurs both before and after processing delay.

**Possible intended rules:**

1. Adjust occurrence, then add business/processing delay, then adjust again.
2. Add calendar-day delay, then adjust once.
3. Add business days rather than calendar days.

**Should be:** Choose one meaning and encode it through named concepts rather than an incidental sequence of calls.

### GAP-018: Interest model is narrow

**Current state:** Daily accrual on positive balance, periodic inflow, one policy per account.

**Possible future needs:**

- debt interest
- tiered rates
- rate changes
- minimum balances
- different day-count conventions
- withholding or fees

**Should be:** Do not generalize now. Preserve the current rule as a specifically named positive-balance interest policy when a second kind appears.

### GAP-019: Funding and interest are not jointly solved

**Current state:** Funding ignores interest, then interest is resolved from funded balances. The compiler labels this conservative behavior.

**Should be:** Keep the limitation explicit. A fixed-point or iterative solver is only justified if material discrepancies appear in real scenarios.

### GAP-020: Funding objective is hard-coded to zero minimum balance

**Current state:** The strategy attempts to prevent negative balance.

**Should be:** A later version may expose a target minimum balance. Do not add this until the current strategy's semantics and tests are stable.

## P3 — future design, not current work

### GAP-021: Canonical validated model for multiple editors

A graphical editor, form editor, raw JSON editor, and possible textual DSL will eventually need one canonical validated domain representation. This is a future architectural requirement, not a reason to build an AST today.

### GAP-022: Structured calculated amounts

Future calculated amounts may require expressions, formulas, percentages, or references to other values. The current `number | null` model is sufficient for fixed and internally resolved amounts, but it should not be stretched into arbitrary opaque strings without a domain design.

### GAP-023: Scenario comparison and assumptions

The engine may eventually compare alternate plans or assumptions. No scenario abstraction is currently required.

### GAP-024: Currency identity

The engine stores cents but no currency. Add currency only when a real multi-currency or currency-formatting requirement appears.

## Decisions to make before related code changes

### Decision A: What is the canonical name for `chargeDate`?

Candidates:

- posting date
- effective date
- charge date

`postingDate` is the most neutral for income, expense, and transfers.

### Decision B: Is an operation a definition or a compiled version?

Current code uses `Operation` for compiled effective versions. Documentation should continue distinguishing `operation definition` from `operation version`, even if class names remain unchanged.

### Decision C: Are generated behaviors part of the persisted plan?

Currently policies and strategies persist, while their generated operations do not. This is coherent and should remain the default unless the editor needs to expose generated operations as read-only derived objects.

### Decision D: What does “business day” mean for this product?

Possible meanings differ:

- Canadian bank-processing day
- federal statutory business day
- provincial business day
- user-defined calendar

The answer determines the correct holiday set and adjustment behavior.

### Decision E: Must results have stable identity?

A display-only report can tolerate random execution-local IDs. An interactive editor, comparison view, persisted UI state, or incremental simulation likely cannot. Decide before building features that depend on identity.

## Suggested implementation order

1. Add configuration validation and diagnostics.
2. Reject currently ignored transformation fields.
3. Test and fix interest opening-date behavior.
4. Test and fix Good Friday equality.
5. Establish unique operation-version identity.
6. Add core invariant tests for account references, transfers, schedules, posting order, interest, and funding.
7. Decide and document schedule selector semantics, especially biweekly anchoring.
8. Only then expand recurrence, calendars, or calculated amounts.
