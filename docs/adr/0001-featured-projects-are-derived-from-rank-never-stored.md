# 0001 — Featured projects are derived from rank, never stored

- **Id**: 0001
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

Featured projects on the home page are the first four projects in orbit order, calculated by ProjectsManager.featured, never stored.

**Reason.** The export (featured = 4) and the handoff link the home selection to rank: the two published applications and the two public repositories, four projects that can be opened directly.

## Alternatives set aside

- A boolean per project, which allows rank and selection to diverge.

## References

origin: docs/architecture/decisions.md:41 @ b299e1d — `src/app/features/projects/states/projects/projects.manager.ts:42` ; origin: docs/architecture/decisions.md:44 @ b299e1d — `src/app/features/projects/states/projects/projects.manager.ts:19` ; source: docs/architecture/decisions.md:39 @ b299e1d ; merges: 0001-featured-projects-are-derived-from-rank.md
