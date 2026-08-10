# Domain documentation

These documents define the financial domain represented by Transactor and track the difference between current behavior and intended behavior.

They are design references, not generated API documentation. Their purpose is to keep configuration, core types, compiler stages, results, tests, and future editors aligned around the same meanings.

## Files

- `transactor-domain-model.md` defines vocabulary, concepts, relationships, and boundaries.
- `transactor-domain-rules.md` lists observable rules and their implementation status.
- `transactor-domain-gaps.md` tracks unresolved correctness risks, integrity issues, limitations, and future decisions.

## Status vocabulary

- **Implemented** — current source clearly implements the behavior.
- **Partial** — some form exists but is incomplete, narrower than intended, or not fully validated.
- **Declared only** — configuration/types expose the concept but the engine does not implement it.
- **Proposed** — recommended future behavior, not current behavior.
- **Open decision** — the desired semantics are not yet settled.

## Architectural vocabulary

The current documentation uses these distinctions deliberately:

- **FinancialModel** — mutable working model assembled from declarative input.
- **ModelPeriod** — contiguous simulation interval with a stable set of active recurring operations.
- **Policy** — behavior owned by an account, such as interest or fees.
- **Strategy** — plan-level management behavior, such as even funding.
- **Operation** — instruction capable of producing scheduled occurrences.
- **Transaction** — one realized occurrence of an operation.
- **Ledger entry** — one account-side effect of a transaction.
- **Result** — immutable public representation produced by compilation.
- **Deterministic resolution** — values that can be derived directly before feedback convergence.
- **Iterative resolution** — repeated resolution of mutually dependent values such as interest and funding adjustment.

## How to update these files

When changing behavior:

1. Update the concept definition if its meaning changed.
2. Update the observable rule and status.
3. Remove or revise any gap that the change resolves.
4. Add or update tests.
5. Verify that JSON fields, TypeScript types, compiler terminology, result DTOs, and UI labels still agree.

Do not document a desired behavior as implemented until the source actually supports it.

## Maintenance rule

These documents describe **domain behavior**, not the class hierarchy. File moves and refactors do not automatically require domain changes. Conversely, a small implementation change can require a documentation update if it changes financial meaning.

When behavior is uncertain, record the uncertainty instead of silently formalizing accidental implementation details.
