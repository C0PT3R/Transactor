# Domain gaps and decisions

This file tracks unresolved differences between the current implementation and a robust, explicit domain model. Resolved historical gaps have been removed rather than kept as an implementation diary.

## Priority meanings

- **P0 — correctness risk:** behavior may be wrong, ambiguous, or silently misleading.
- **P1 — model integrity:** needed to make the current model reliable and maintainable.
- **P2 — capability completion:** exposed or partially present behavior is incomplete.
- **P3 — future design:** useful later, but not needed to stabilize the current engine.

## P0 — correctness risks

### GAP-001: No comprehensive runtime configuration validation

**Current state:** Input is parsed into `FinancialModelData`, while validation remains distributed and late.

**Risk:** Invalid dates, duplicate IDs, bad selectors, unknown references, and unsupported combinations may fail only after construction/compilation.

**Should be:** Introduce one validation boundary that reports structured diagnostics with the offending configuration path.

### GAP-002: Declared transform fields are silently ignored

**Current state:** `TransformData.params` exposes `schedule` and `day`, but `OperationCompiler.applyTransform()` applies only `amount`.

**Risk:** Valid-looking configuration can be accepted while authored instructions have no effect.

**Should be:** Implement the fields or reject them explicitly as unsupported.

### GAP-003: Operation-version identity remains ambiguous

**Current state:** Transforms create multiple compiled `Operation` objects. A configured ID can therefore represent more than one compiled version.

**Risk:** UI selection, result maps, future graphical editing, comparison, and lineage can become ambiguous.

**Should be:** Separate stable definition identity from compiled-version identity, or otherwise guarantee unique result operation IDs while preserving lineage.

### GAP-004: Same-day ordering is only partly formalized

**Current state:** Interest precedes other entries and inflows precede outflows, but otherwise equivalent entries can rely on stable sort/insertion order.

**Risk:** A future refactor can change intermediate balances and therefore interest/funding results without an obvious domain change.

**Should be:** Define a deterministic final tie-break rule.

### GAP-005: Funding convergence tolerance can hide a one-cent oscillation

**Current state:** Iterative resolution accepts a default maximum delta of one cent.

**Risk:** This is practical for rounded monetary feedback, but the final state can be one cent away from a strict fixed point. A future resolver with different semantics could treat that tolerance incorrectly.

**Should be:** Keep the generic tolerance explicit and add tests proving that accepted convergence cannot violate hard strategy constraints materially.

## P1 — model integrity

### GAP-006: Persistent identity policy is not defined

**Current state:** Missing authored IDs and result transaction/ledger IDs may be generated.

**Consequence:** Structurally identical recompilations need not have identical identities.

**Should be:** Decide which IDs are persisted, deterministic, execution-local, or derived.

### GAP-007: Duplicate IDs are not rejected early

**Current state:** Accounts/operations are stored in arrays and there is no comprehensive uniqueness validation boundary.

**Should be:** Enforce uniqueness in documented namespaces.

### GAP-008: Unknown references fail late

**Current state:** Missing account references generally surface during model access or ledger population.

**Should be:** Validate every `from`, `to`, strategy `target`, and strategy `from` reference before compilation.

### GAP-009: FinancialModel still combines assembled definition and mutable execution objects

**Current state:** `FinancialModel` owns mutable accounts, ledgers, generated operations, and strategies used during compilation.

**Consequence:** This is workable, but future editors/ASTs may need a cleaner separation between canonical authored model and execution model.

**Should be:** Do not refactor prematurely. Revisit when a second input surface or live editor requires it.

### GAP-010: Business-calendar semantics are global and hard-coded

**Current state:** `FinancialModel` constructs `CanadaBusinessCalendar`.

**Should be:** Eventually make calendar/jurisdiction part of model or simulation context if multiple calendars are needed.

## P2 — capability completion

### GAP-011: Daily schedule is declared but not constructible

**Current state:** `ScheduleType` contains `daily`, while the schedule registry maps it to `null`.

**Should be:** Implement `DailySchedule` or remove/restrict the public declaration until supported.

### GAP-012: Schedule `year` field has no clear role

**Current state:** `ScheduleData` exposes `year`, but recurring yearly behavior is based on month/day and effective dates.

**Should be:** Define and implement its meaning or remove it.

### GAP-013: Schedule selectors lack comprehensive range validation

Examples include invalid weekdays, months, and day selectors.

**Should be:** Validate at the configuration boundary with useful diagnostics.

### GAP-014: Biweekly schedules have an implicit global anchor

**Current state:** Recurrence is anchored by implementation rather than an explicit user-defined anchor date.

**Should be:** Decide whether the current global phase is intentional. If not, expose an anchor.

### GAP-015: Interest model is intentionally narrow

Current interest supports positive-balance daily accrual and generated inflow payments.

Not currently modeled:

- negative-balance/debt interest;
- tiered rates;
- variable rates;
- alternate day-count conventions;
- multiple simultaneous interest policies.

These should remain future capabilities unless a concrete use case requires them.

### GAP-016: Interest first-payment semantics need a dedicated test

The resolver pays accrued interest through the preceding day, but the generated schedule's first occurrence should be tested explicitly when simulation start coincides with a payment date.

### GAP-017: Funding ignores source-account affordability

**Current state:** Even funding optimizes the target account. It does not constrain the solution based on whether the source account can afford the transfer.

**Should be:** Keep this intentional unless strategy semantics later require cross-account feasibility.

### GAP-018: Global vs per-ModelPeriod funding is not configurable

**Current state:** One even-payments strategy resolves one global recurring amount across its effective lifetime.

**Possible future behavior:** Recompute a different even payment for each stable `ModelPeriod`, similar to the older frame-based smoother.

This is not currently required.

### GAP-019: Even-funding trade-off is fixed

**Current state:** The strategy chooses the solution minimizing time-weighted excess balance, with deterministic tie-breakers.

**Possible future behavior:** A user-facing preference/slider could bias toward:

- larger initial reserve and lower recurring payments;
- smaller initial adjustment and higher recurring payments;
- the current balanced solution.

Do not introduce a generic strategy-objective framework until there is a concrete need.

## P3 — future design

### GAP-020: Account lifetime

Accounts currently exist for the simulation as a whole.

Possible future model:

- account effective/open date;
- optional close date.

This is distinct from a balance checkpoint.

### GAP-021: Dated balance checkpoint / reconciliation

A real account may have a known balance on a date while its earlier balance is irrelevant.

Possible future concept:

- balance checkpoint;
- reconciliation transaction;
- `setAccountBalance(accountId, date)`-style live adjustment.

This should not be conflated with account lifetime.

### GAP-022: Canonical model for multiple editors

Possible future input surfaces include:

- graphical editor;
- form editor;
- raw JSON editor;
- possibly a DSL.

They should converge on one canonical financial model/AST rather than implementing separate simulation semantics.

### GAP-023: Scenario comparison and assumptions

The engine may eventually compare multiple plans or assumptions without mutating one canonical plan.

### GAP-024: Currency identity

Money currently has amount precision but no currency identity.

### GAP-025: Richer strategy composition

Future strategies may depend on balances, thresholds, caps, excess-cash routing, or other strategies. The generic iterative resolver provides a foundation, but no generic optimization framework should be added until required.

## Decisions to preserve

Several decisions are now sufficiently clear that they should not be reopened accidentally:

1. Account policies belong to accounts; funding strategies belong to the plan.
2. Account fees are account policies.
3. `ModelPeriod` is a core first-class concept, not renderer-derived state.
4. Old frames should not return as nested `FinancialModel`s.
5. Even funding currently uses one global recurring amount across the strategy lifetime.
6. `minimumBalance` is a hard strategy constraint.
7. Initial funding adjustment may be positive or negative.
8. Interest and funding adjustment participate in generic iterative convergence.
9. Calendar calculations should use actual `LocalDate` year lengths when dates are known.
10. Zero-value internal transactions may exist, but public results should omit meaningless zero financial effects.

## Suggested implementation order

1. Add comprehensive configuration/reference/ID validation.
2. Resolve or reject unsupported transform fields.
3. Add tests around same-day ordering and convergence tolerance.
4. Define compiled operation-version identity.
5. Decide whether `daily` should become constructible.
6. Expand calendar or strategy capabilities only when driven by an actual use case.
