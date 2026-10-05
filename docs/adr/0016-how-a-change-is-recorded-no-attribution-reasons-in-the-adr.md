# 0016 — How a change is recorded: no attribution, reasons in the ADR

- **Id**: 0016
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

Commits and pull requests carry no attribution: no Co-Authored-By trailer, no mention of a tool

Commits carry no attribution: this is a rule of the repository, not a habit

The reason behind a key unit lives in an ADR entry under docs/adr, indexed by docs/ADR.md

Source, config and the lockfile are committed; nothing a command can rebuild is. Text in `.gitattributes` is normalised to LF so a Windows checkout cannot rewrite the tree. Local development tools (AI assistants' settings, agents, skills, hooks, memory, instruction files) are never imposed on whoever clones the repository and stay on the machine of the person who chose them; nothing there is needed to build, test or run the site. Documents about building the project stay local (design references, audits, wording notes, docs index); only the architecture and the content guide are committed. Husky writes its own runtime under `.husky/_`; the hooks beside it are committed. Real environment values never enter the repository; an example file documents the keys (.gitignore).

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
