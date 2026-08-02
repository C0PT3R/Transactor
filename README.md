# Transactor

> A declarative financial projection engine written in TypeScript.

**Transactor** is a personal project that models accounts, recurring operations, schedules and account policies to produce an immutable financial projection over time.

Instead of manually tracking transactions in a spreadsheet, the application describes a financial system declaratively and compiles it into a complete timeline of transactions, balances and reports.

> **⚠️ Work in Progress**
>
> This project is actively evolving. The architecture is still being refined, features are added as real-world needs arise, and breaking changes should be expected. At the moment, Transactor primarily serves my own financial planning, so some concepts are intentionally opinionated.

---

## Philosophy

The goal is to describe **what** should happen rather than **how** to calculate it.

A financial model is composed of:

* Accounts
* Account policies (interest, fees, ...)
* Funding strategies
* User-defined operations
* Schedules

The compiler expands those declarations into generated operations, transactions, ledgers and finally an immutable result.

```
JSON
    ↓
FinancialModel
    ↓
Generated operations
    ↓
Transactions
    ↓
Charged accounts
    ↓
Immutable Result
```

---

## Current Features

* Declarative JSON model
* Multiple account types
* Flexible recurring schedules
* Transfers between accounts
* Account ledgers
* Immutable simulation results
* Budget period reports
* Interactive balance charts
* Generated operations
* Interest policies
* Funding strategies (work in progress)

---

## Project Status

This project is **not** intended to compete with budgeting software.

It exists because I wanted a financial model that could answer questions such as:

* *What will my account balances look like over the next two years?*
* *How much should I automatically transfer each week to cover irregular expenses?*
* *How do account policies such as interest or fees affect long-term balances?*

As the project evolves, it is becoming less of a budgeting application and more of a small financial modeling engine.

---

## Design Principles

Some principles that guide development:

* Declarative configuration
* Immutable results
* Strong domain vocabulary
* Predictable compilation pipeline
* Minimal dependencies
* Simplicity over premature generalization

Whenever possible, concepts are modeled after real financial entities rather than implementation details.

---

## Current Architecture

The source code is organized by domain.

```
src/
├── accounts/
├── model/
├── operations/
├── schedules/
├── calendar/
├── queries/
├── renderer/
└── results/
```

The project intentionally distinguishes between:

* **Policies** — contractual account behavior (interest, fees, etc.)
* **Strategies** — management decisions (such as funding an account)

Both generate operations that are compiled into transactions.

---

## Roadmap

Some ideas currently under development:

* Additional account policies
* Fee policies
* Funding strategy improvements
* Smarter balance convergence
* More reporting capabilities
* Improved JSON schema
* Better testing coverage

---

## Disclaimer

This software is an experimental personal project.

It should not be relied upon for financial decisions without independently verifying the results. Use at your own risk.
