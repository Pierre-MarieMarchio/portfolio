# 0007 — The new SceneLayout fields are not made mandatory because the golden

- **Id**: 0007
- **Date**: 2026-10-05
- **Status**: closed
- **Ticket**: [#203](https://github.com/Pierre-MarieMarchio/portfolio/issues/203)

The new SceneLayout fields are not made mandatory because the golden bench ignores them (all band and panel fields are optional) `src/app/shared/space-scene/models/scene-layout.model.ts:19`

Closed by #203: the nine SceneLayout fields are mandatory; the golden bench and every spec builder set them.

origin: docs/architecture/decisions.md:673 @ b299e1d
