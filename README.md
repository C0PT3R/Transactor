# Transactor

**Transactor** is a deterministic transaction engine for simulating personal or business cash flow.

Instead of tracking balances after the fact, Transactor predicts the future by generating every transaction according to declarative rules and applying them to one or more accounts over time.

The project is designed around reproducibility, deterministic execution, and extensibility rather than accounting features.

---

## Features

* Deterministic simulation
* Declarative transaction definitions
* Multiple accounts
* Recurring transactions
* One-time transactions
* Business day awareness
* Processing delays
* Automatic transfers
* Future scheduling
* Historical replay
* Immutable simulation results
* Zero runtime dependencies (core)

---

## Philosophy

Most budgeting software records what already happened.

Transactor answers a different question:

> *"What will my account balances look like if everything happens exactly as planned?"*

Every simulation starts from an initial state and produces exactly the same output every time.

Given identical inputs, the engine will always generate identical results.

---

## Core Concepts

### Engine

The `Engine` orchestrates the simulation.

It is responsible for:

* generating transactions
* advancing the simulation frame-by-frame
* charging accounts
* resolving balances
* freezing the final state

---

### Account

An `Account` represents a balance capable of receiving and sending money.

Examples include:

* Chequing accounts
* Savings accounts
* Credit cards
* Loans
* Investment accounts
* Virtual accounts

Accounts do not create transactions.

They simply execute them.

---

### Transaction

A transaction represents money moving from one account to another.

Transactions are immutable after generation.

Examples:

* Salary
* Rent
* Mortgage
* Utility bill
* Loan payment
* Internal transfer

---

### Frame

A `Frame` represents a single instant of the simulation.

It contains:

* account balances
* generated transactions
* incoming totals
* outgoing totals
* automatic payments
* computed statistics

Frames become immutable once resolved.

---

### Rules

Transactions are created from declarative rules.

Examples include:

* every Friday
* first business day of the month
* every two weeks
* one-time payment
* quarterly invoice
* yearly subscription

Because rules are deterministic, simulations remain reproducible.

---

## Example

```ts
import * as Transactor from "./Transactor"

const scenario = await Transactor.Scenario.fromFile('./default-scenario.json')
const result = Transactor.run(scenario)

Transactor.renderInto(result, document.body)
```

The engine generates every transaction, applies them in chronological order, and returns an immutable simulation.

---

## Design Goals

* Deterministic
* Predictable
* Testable
* Immutable
* Extensible
* Framework agnostic
* Type-safe
* High performance

---

## Planned Features

* Budget reports
* Category analytics
* Forecast comparison
* Scenario simulations
* Inflation modelling
* Interest calculations
* Tax-aware rules
* Import/export
* JSON schema validation
* Visualization tools
* CLI
* REST API
* Web interface

---

## Why "Transactor"?

A *transaction* is the atomic unit of financial movement.

Rather than being a budgeting application or an accounting package, Transactor is a **transaction engine** capable of powering those applications.

It focuses on moving money through time in a deterministic way.

---

## Project Status

Transactor is currently under active development.

The API is evolving rapidly and breaking changes should be expected until the first stable release.

---

## Contributing

Issues, feature requests, discussions, and pull requests are welcome.

Before contributing, please ensure new functionality includes appropriate documentation and tests.

---

## License

MIT License.
