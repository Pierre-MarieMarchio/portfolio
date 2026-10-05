# 0005 — Thresholds are written twice, in TS and in _formats.scss

- **Id**: 0005
- **Date**: 2026-10-05
- **Status**: closed
- **Ticket**: [#192](https://github.com/Pierre-MarieMarchio/portfolio/issues/192)

Thresholds are written twice, in TS and in _formats.scss `src/assets/styles/mixins/_formats.scss:1`

Closed by #192: a spec ties the phone thresholds written in TypeScript to the ones in `_formats.scss`, so the two copies cannot drift apart.

origin: docs/architecture/raisons/core-et-interface.md:72 @ b299e1d
