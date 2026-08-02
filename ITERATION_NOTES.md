# Financial model iteration

This iteration introduces the agreed domain structure:

- `Scenario` is renamed to `FinancialModel`.
- Accounts own contractual policies and management strategies.
- `InterestPolicy` generates an `InterestPaymentOperation`.
- `EvenPaymentsFundingStrategy` generates a `FundingOperation`.
- Funding strategies support an optional `from` account.
- Generated operations are included in `FinancialModel.operations`.
- Operations expose `kind` and `origin` plus semantic helpers.
- Transactions support per-occurrence amount overrides.
- Interest is resolved per transaction before account charging.

## Deliberate limitation

Funding is resolved without interest, then interest is calculated from the funded balances. This is conservative and preserves current behavior. The feedback relationship between funding strategies and account policies is intentionally not solved in this iteration.

Multiple non-overlapping funding strategies are supported for an account. Overlapping funding strategy periods currently produce an explicit error.
