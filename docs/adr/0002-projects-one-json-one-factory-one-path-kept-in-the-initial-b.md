# 0002 — Projects: one JSON, one factory, one path, kept in the initial bundle

- **Id**: 0002
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

Projects, facts and sheets, with level labels, default chapter titles and figure layers are read once by ProjectsRepository.getCatalog(), carried by a single success action and held by state. Facts are the only facts table, indexed by slug; a sheet carries none, and its type refuses one.

The projects JSON and its factory stay in main: the separate loading planned by D106 is set aside. The factory now also refuses an unknown field, at all levels of an entry, naming the slug and field path. drafts.spec.ts no longer writes the total of drafts: it keeps only the count of interface catalogs and counts enDraft from the JSON, so that reviewing a project's English touches only the JSON.

**Reason.** A single seam for a remote source, a single loading cycle (a sheet is never present without its project), and the prerendered view reads the same repository.

Measured on slowed phone (protocol of D104, 7 cold loads, replayed): separate loading brings the initial bundle from 546.57 to 521.93 kB, but hydration end moves back from 150 to 190 ms (2 120 → 2 269 ms), even with a modulepreload (+152 ms), for the same JS transferred (175.0 vs 175.4 kB). The visitor pays the same bytes before hydration, plus a round trip: the 'initial' budget drops without anything getting lighter for them. Returning to 520 kB requires removing transferred bytes, not moving them. Refusing unknown field costs +0.32 kB and catches a typo at build.

## Alternatives set aside

- Constants imported by the manager; a read per table.
- Keep separate loading to hold the 520 kB figure: makes the site slower to respond.
- Have the chunk carried by a separately-loaded route to get a modulepreload: hand testing still gives +152 ms.

## References

origin: docs/architecture/decisions.md:58 @ b299e1d — `src/app/features/projects/models/project-detail.model.ts:38` ; origin: docs/architecture/decisions.md:62 @ b299e1d — `src/app/features/projects/states/projects/projects.manager.ts:96` ; source: docs/architecture/decisions.md:53 @ b299e1d ; origin: docs/architecture/decisions.md:130 @ b299e1d — `src/app/features/projects/rules/ranking.rules.ts:8` ; origin: docs/architecture/decisions.md:3189 @ b299e1d — `src/app/features/projects/data/projects.data.ts:3` ; origin: docs/architecture/decisions.md:3193 @ b299e1d — `src/app/features/projects/rules/project-entry.rules.ts:65` ; origin: docs/architecture/decisions.md:3195 @ b299e1d — `src/app/features/projects/rules/project-entry.rules.ts:259` ; origin: docs/architecture/decisions.md:3197 @ b299e1d — `src/app/features/projects/rules/project-entry.rules.ts:249` ; origin: docs/architecture/decisions.md:3229 @ b299e1d — `src/app/features/projects/rules/project-entry.rules.ts:47` ; origin: docs/architecture/decisions.md:3190 @ b299e1d — `src/app/features/projects/rules/ranking.rules.ts:11` ; origin: docs/architecture/decisions.md:3197 @ b299e1d — `src/app/features/projects/rules/project-entry.rules.ts:79` ; origin: docs/architecture/decisions.md:3200 @ b299e1d — `src/app/features/projects/data/projects.data.ts:5` ; One project, one file: identity, facts and sheet together: docs/architecture/decisions.md:125 @ b299e1d ; Projects are one JSON read by a factory: docs/architecture/decisions.md:3187 @ b299e1d ; source: docs/architecture/decisions.md:3226 @ b299e1d
origin: docs/architecture/decisions.md:3203 @ b299e1d — `src/app/features/projects/models/project.model.ts:6`
origin: docs/architecture/decisions.md:3220 @ b299e1d — `src/app/features/projects/data/projects.data.ts:3`
origin: docs/architecture/decisions.md:3228 @ b299e1d — `src/app/features/projects/data/projects.data.ts:3` ; merges: 0002-project-catalogue-goes-through-a-single-path.md, 0030-projects-stay-in-initial-bundle-factory-refuses-unknown-fiel.md
