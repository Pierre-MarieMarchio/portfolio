# 0005 — No comments anywhere in the repository

- **Id**: 0005
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

Code carries no comment. A just name says what the code does; a function that needs explaining is renamed or split. No trace of the workstream either: no step, no date, no 'we first did…'. The reason for a constraint (a value set by eye, a browser workaround, a limit not to exceed) goes in this journal or in an architecture document, never on the line in question.

The no-comment rule (D10) covers src/, scripts/, the CI/CD configuration and the other configuration files, not only src/

**Reason.** A comment paraphrases the code or tells its history; either way it reads twice and ages alone, and several had become false. We do not leave scaffolding on the house: the thickness of foundations is justified in the plans, not on the floor.

Chosen by the operator at the onboarding interview; check:comments scans only src/ today (package.json:23)

## Alternatives set aside

- Keep the 'why' comments in the code.
- src/ only
- src/ and scripts/, not the configuration

## References

source: docs/architecture/decisions.md:272 @ b299e1d ; merges: 0005-no-comments-in-code.md, 0046-the-no-comment-rule-d10-covers-src-scripts-the-ci-cd-configu.md
