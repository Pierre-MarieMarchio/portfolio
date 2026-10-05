# 0006 — Observatory state is split along its actions

- **Id**: 0006
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

A state is a set of signals no action crosses. The observatory has two states: observatory (view, sheet, chapter, windows, selection, hover, filter) and animation (pause).

**Reason.** Arriving at a view changes both the view, the preview according to pins and the hover. Split by named concept, these signals would force a business rule to scatter in chains of effects between managers.

## Alternatives set aside

- One state per concept (location, windows, selection).

## References

origin: docs/architecture/decisions.md:340 @ b299e1d — `src/app/features/observatory/states/animation/animation.state.ts:5` ; source: docs/architecture/decisions.md:338 @ b299e1d ; merges: 0007-observatory-state-is-split-along-its-actions.md
