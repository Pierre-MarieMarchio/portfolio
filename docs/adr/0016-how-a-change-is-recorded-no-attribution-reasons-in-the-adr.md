# 0016 — How a change is recorded: no attribution, reasons in the ADR

- **Id**: 0016
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

Commits and pull requests carry no attribution: no Co-Authored-By trailer, no mention of a tool

Commits carry no attribution: this is a rule of the repository, not a habit

The reason behind a key unit lives in an ADR entry under docs/adr, indexed by docs/ADR.md

**Reason.** Chosen by the operator at the onboarding interview; the history already has none

Answered with the attribution axis at the onboarding interview

Chosen by the operator at the onboarding interview; docs/architecture/decisions.md is converted into ADR entries

## Alternatives set aside

- A Co-Authored-By trailer on assisted commits
- No rule, left to each author
- A habit with no rule
- Keep the reason in commit and pull request messages only
- Structural reasons in the ADR, one-off reasons in commits

## References

merges: 0043-commits-and-pull-requests-carry-no-attribution.md, 0065-commits-carry-no-attribution.md, 0044-the-reason-behind-a-key-unit-lives-in-an-adr-entry-under-doc.md
