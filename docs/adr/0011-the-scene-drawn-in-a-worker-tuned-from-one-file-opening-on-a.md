# 0011 — The scene: drawn in a worker, tuned from one file, opening on a close-up held by a test

- **Id**: 0011
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

When the browser can draw off-page (Worker, OffscreenCanvas and its transferToImageBitmap, a bitmaprenderer canvas), SceneEngineService launches scene.worker.ts, which runs SpaceSceneEngine as-is on two OffscreenCanvas. The engine touches the DOM only through SceneNode, the small surface it writes (style.transform, opacity, pointerEvents, cssText, setAttribute, tabIndex) and reads (name size). In the worker, recorder nodes (NodeRecorderEngine) note these writes; each drawn image departs with them, in transferred ImageBitmaps, and RemoteSceneEngine places the image and writes on the same page image. Names stay glued to their planets. The immediate responses gestures need (does the hand take the disk, was it a slide, does zoom fit on canvas, can we look closer) come from the same rules, applied in the page. Desktop pan (SkyPanMotion) lives in the worker and returns with each image. Otherwise, the engine runs in the page as before, loaded separately.

models/scene-config.model.ts carries SCENE_CONFIG, typed by SceneConfig and arranged by theme: matter (density, reserve, phone share, entry, disk colors), sky (stars, drift, parallax, cursor reach, trails), canvas (pixel budget, display density), camera (orbit speed, rest scale, zoom), hand (friction, speed, orbit drive), gestures (slide threshold, press and double-press, wheel step), planets (spread), and figures (touch target, names, lights). Each file keeps its constant name and reads it from config. The three 6 px thresholds (hand, figure, press) become one, gestures.dragPx.

The engine spec verifies that a page arriving on a close-up (a detail opened by address) shows the hole at its size from the first frame, without the opening animation.

**Reason.** Measured on production build, Chrome without interface at 390 × 844, dpr 3, CPU throttled × 4: at rest, main thread spent 466 ms of 500 on tasks, 369 of script; it now spends 95, 17 of script. Initial bundle drops from 529.39 to 476.63 kB: engine no longer there, worker (59.4 kB) and fallback engine (50.9 kB) load separately. A spec draws the same scene both ways, at the same draw: draw orders are the same one by one, names, buttons, and lines get the same styles. On phone and desktop captures, nothing changes, and gestures (spin disk, wheel, middle click, double tap) give the same hole survey.

These values were set in 16 files; they are now changed in one, without searching. Config is pure data: it lives in the worker (D47) as in the page, with nothing to send. Values have not changed: scene goldens pass as-is.

After D54 and D55, coverage rises from 96.99 to 97.45 % of lines and from 92.09 to 92.8 % of branches, but one branch was lost: this open start (startOpen(true)). Only a deleted test passed through it, without checking it. The new test fails if the scene starts closed.

## Alternatives set aside

- transferControlToOffscreen: canvas displays without page, but names, which are DOM, disconnect from their planets once page is busy. Worker for sky only: stars and planets would skid one against the other during flight.
- Convergence tolerances, values derived from other values, selectors, and internal placement settings: changing them breaks an invariant, it does not fix a render. Config supplied at runtime (provideSpaceScene): only one site uses it, and it would have to go to pure rules and the worker.
- D54 states that a test leaves if it repeats what another test already verifies
- D55 states that shared/ libs test what is visible of them

## References

origin: docs/architecture/decisions.md:1617 @ b299e1d — `src/app/shared/space-scene/models/scene-config.model.ts:55` ; origin: docs/architecture/decisions.md:1610 @ b299e1d — `src/app/shared/space-scene/models/scene-config.model.ts:55` ; origin: docs/architecture/decisions.md:1616 @ b299e1d — `src/app/shared/space-scene/models/scene-config.model.ts:55` ; source: docs/architecture/decisions.md:1595 @ b299e1d ; A test checks a behaviour where it lives: docs/architecture/decisions.md:1706 @ b299e1d ; shared/ libs test what is visible of them: docs/architecture/decisions.md:1737 @ b299e1d ; source: docs/architecture/decisions.md:1764 @ b299e1d ; merges: 0016-the-scene-draws-in-a-worker.md, 0017-scene-settings-live-in-one-file-scene-config.md, 0022-scene-opening-on-close-up-is-already-open-held-by-a-test.md
