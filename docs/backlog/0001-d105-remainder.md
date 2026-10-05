# 0001 — D105 remainder

- **Id**: 0001
- **Date**: 2026-10-05
- **Status**: open
- **Ticket**: [#202](https://github.com/Pierre-MarieMarchio/portfolio/issues/202)

D105 remainder: a sheet opened beside a pinned one reframes the scene only on drag release (SceneWindowDrag lives in the page)

D105 remainder: a detail opened next to a pinned one reframes the scene only on drag release, SceneWindowDrag follows only frames present at start (the port only exposes onDragging, scene-window-drag.port.ts:5 ; the implementation is outside the zone)

origin: docs/architecture/decisions.md:3158 @ b299e1d — status: declared

origin: docs/architecture/decisions.md:3158 @ b299e1d
