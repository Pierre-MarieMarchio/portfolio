# 0009 — D94 known limit

- **Id**: 0009
- **Date**: 2026-10-05
- **Status**: closed
- **Ticket**: [#208](https://github.com/Pierre-MarieMarchio/portfolio/issues/208)

D94 known limit: a sheet that stays visible during a navigation retakes its layer only on the next resize, the port exposes only the start of a navigation (onLeave), not its arrival

origin: docs/architecture/decisions.md:2861 @ b299e1d — status: declared

Closed by #208: a bottom sheet retakes its back layer when a navigation ends, cancels or fails, without waiting for a resize, and the history entries a cancelled or failed navigation leaves behind are adopted by the retaken layer or removed.

origin: docs/architecture/decisions.md:2861 @ b299e1d
