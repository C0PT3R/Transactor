# Transactor

> A declarative financial simulation engine written in TypeScript, with a UI layered on top.

Transactor models accounts, operations, schedules, account policies, and planning strategies, then compiles that model into a complete financial timeline. The engine is the product core; the current renderer is one consumer of its immutable result.

The project began as a way to answer a simple question: **how much should be contributed regularly so that bills are always funded evenly?** It has since grown into a more general financial simulation/planning engine while keeping that original use case as an important strategy.

> **Work in progress**
>
> Transactor is actively evolving. The domain model and compiler architecture are becoming more explicit, and breaking changes are expected.

## Core idea

The configuration describes **what financial system should exist**. The core determines what happens over time.

```text
Declarative configuration
        ↓
FinancialModel
        ↓
Configured + generated operations
        ↓
Ledger population
        ↓
Deterministic resolution
        ↓
Iterative convergence
        ↓
Validation + account charging
        ↓
Immutable Result
        ↓
Renderer / future editors / other consumers
```

Generated operations may come from account policies or planning strategies. Interest and even-funding adjustments can depend on each other, so feedback-driven values are resolved iteratively until they are stable to monetary precision.

## Current domain

A model currently contains:

- a simulation period;
- accounts with opening balances;
- account policies;
- configured operations;
- planning strategies;
- schedules and posting-date rules.

Implemented account policies include interest and fees. The implemented planning strategy is `evenPayments`.

The engine supports one-time, weekly, biweekly, monthly, and yearly schedules. `daily` exists in the shared schedule type but is not currently constructible as a normal schedule.

## Even-payments funding

The even-payments strategy generates a recurring funding operation. It may also generate a signed initial balance adjustment represented internally by opposite one-time adjustment operations.

The strategy supports:

- a source account;
- a target account;
- a recurring funding schedule;
- an optional `minimumBalance` target;
- optional initial-balance adjustment.

The deterministic compiler first derives a recurring funding seed from the actual model periods and their durations. Annual proration uses actual calendar-year lengths through `LocalDate`; no average `365.25` year is used.

When initial adjustment is enabled, iterative resolution then solves the recurring payment and signed initial adjustment together with interest. The selected solution keeps the account at or above `minimumBalance` and minimizes time-weighted excess balance over the strategy lifetime.

## Model periods

`ModelPeriod` is a first-class core concept. It represents a contiguous portion of the simulation during which the set of active recurring operations is stable.

Model periods are used by funding calculations and are included in the immutable result. They are not separate financial models and they are not an old-style frame hierarchy.

One-time operations do not create model-period boundaries.

## Architecture

The current core is organized around domain concepts and compilation stages:

```text
src/
├── transactor-common/
│   └── shared result and schedule types
│
├── transactor-core/
│   ├── accounts/
│   │   └── policies/
│   ├── compiler/
│   │   └── resolution/
│   ├── model/
│   ├── operations/
│   ├── result/
│   ├── schedules/
│   ├── strategies/
│   └── calendar/
│
└── transactor-renderer/
    ├── interpreter/
    └── renderer/
```

`Compiler.ts` is intentionally an orchestration layer. Deterministic funding, ledger population, validation, and iterative resolution live in focused compiler modules.

## Design principles

- Declarative configuration.
- Strong domain vocabulary.
- Accounts own account policies; plans own strategies.
- Generated financial behavior is represented as operations and transactions.
- Immutable public results.
- Actual calendar semantics when dates are known.
- Exact integer cents inside the simulation.
- Compiler orchestration separated from domain-specific resolution.
- Simplicity over premature generalization.

## Current limitations

Important known limitations include:

- configuration validation is still incomplete;
- operation transforms currently apply `amount` only even though additional transform fields are declared;
- `daily` schedules are declared but not constructible;
- business-calendar selection is not configurable;
- some identities are generated and therefore not stable across recompilation;
- operation-version identity after transforms still needs a stronger model;
- same-day ordering is only partly formalized.

See the domain documentation for the precise current rules and gaps.

## Documentation

- `docs/transactor-domain-model.md` — domain vocabulary and relationships.
- `docs/transactor-domain-rules.md` — observable rules and implementation status.
- `docs/transactor-domain-gaps.md` — unresolved correctness, integrity, and design issues.
- `docs/transactor-domain-README.md` — how these documents are maintained.

## Direction

Transactor is best understood today as a **financial simulation engine with a UI layered on top**. It may grow into a fuller financial planner and richer graphical model editor, but the engine and its domain model remain independently useful.

Future input surfaces could all compile to the same financial model:

```text
Graphical editor ─┐
Form editor      ├─→ Financial model → compiler → simulation result
Raw JSON editor  ┘
```

A full DSL remains a possible future input form, not a current architectural requirement.

## Disclaimer

This is experimental financial-planning software. Results should be independently verified before being used for consequential financial decisions.
