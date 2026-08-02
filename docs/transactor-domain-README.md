# Domain documentation

These files define the financial domain represented by Transactor and track the difference between the model the application currently implements and the model it is intended to implement.

They are design references, not generated API documentation. Their purpose is to keep the configuration format, core types, compiler, simulation behavior, result DTOs, tests, and future editors aligned around the same meanings.

## Files

- [`domain-model.md`](./domain-model.md) defines the domain vocabulary, entities, value objects, relationships, and boundaries.
- [`domain-rules.md`](./domain-rules.md) lists observable rules and invariants, including whether each rule is implemented, partial, or proposed.
- [`domain-gaps.md`](./domain-gaps.md) tracks mismatches, missing capabilities, and decisions that still need to be made.

## Status vocabulary

Each statement is marked with one of these statuses when its implementation state matters:

- **Implemented** — the current source code clearly enforces or produces this behavior.
- **Partial** — some form of the behavior exists, but it is incomplete, inconsistent, or narrower than the intended model.
- **Declared only** — the input or TypeScript type exposes the concept, but the compiler does not currently implement it.
- **Proposed** — this is a recommended domain rule or concept, not current behavior.
- **Open decision** — the domain meaning has not yet been chosen.

## How to use these files

When adding or changing a feature:

1. Identify the domain concept being changed.
2. Update its definition in `domain-model.md` if its meaning changes.
3. Add or update observable rules in `domain-rules.md`.
4. Add tests for rules that become implemented.
5. Remove or revise the corresponding item in `domain-gaps.md`.
6. Check that JSON fields, core types, compiler stages, result DTOs, and UI wording use the same terminology.

These documents should describe behavior, not mirror the class hierarchy. Class names may change without changing the domain. Conversely, a small code change can require a documentation update if it changes financial meaning.

## Maintenance rule

Documentation should distinguish facts from intentions. Do not rewrite a proposed rule as implemented until source code and tests support it. When behavior is accidental or uncertain, record it as an open decision rather than silently formalizing it.
