# 0009 — shared/ holds independent libraries that say nothing about the portfolio

- **Id**: 0009
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

shared/ is no longer an interface folder: it holds libraries, each portable to another application with some work. Each is a lint zone (SHARED_LIBS, compared to disk like FEATURES) importing only core, neither portfolio nor another library: shared/ui/ (interface components without domain logic); shared/windows/ (window system: the window, drag, height, scroll memory, stack, order, and texts behind its own port); shared/space-scene/ (canvas space scene: black hole, disk and grains, sky, camera, projection, turntable, with orbiting bodies and named figures; API speaks of framings, bodies, and emphasis, never site views, projects, or chapters). features/observatory keeps choreography: which view gives which framing, which planets are featured or targeted, texts, and planet button logic if it carries domain logic.

The site name leaves core/: DocumentHeadService receives it through the SITE_NAME port (core/ports/), to which provideI18n answers with OWNER_NAME (i18n/data/owner.data.ts), which both catalogues reprise for the home name. In the scene, isAbout becomes areFiguresShown, from the figuresShown entry it comes from, and the light of unlit figures unlitWhenShown.

mobile-nav may import core like the other shared libraries; it is no longer a standalone library

Duplicates are accepted between shared libraries, which stay independent (inDocumentOrder); specs share their helpers through src/testing (TOUCH)

The phone portrait tab bar stays MainNavComponent (shared/ui), as D38 placed it: it does not move into shared/mobile-nav/. Oriented transitions (forward push, backward return between list and detail) move to session 6.

**Reason.** The engine mixed generic scene and portfolio words (view: sheet, featured, chapter, part). Separating them makes each readable without the other. The window is a complete system with nothing to do in the middle of small UI components.

Session 3 survey (current state): those were the two sole portfolio words in core/ and shared/. The name was written two more times in catalogues; it is no longer written but once.

Chosen by the operator at the onboarding interview; eslint.config.js:125 made it standalone, reaching the browser and texts through its ports (f962ca0)

Chosen by the operator at the onboarding interview

The bar already does what the brick was to bring: fixed at the bottom, env(safe-area-inset-bottom), 44 px targets, aria-current, and its text through a port. Moving it would not change what the reader sees; do not move to move. Transitions would animate a view whose windows are recreated at each change: this is what still freezes the page beyond 50 ms at ×4, and D46 removed View Transitions for this reason. Session 6 keeps windows mounted; we can then measure a transition on a view that no longer rebuilds.

## Alternatives set aside

- Extract i18n mechanics too: it is welded to the application's Catalog type, and no second user asks for it.
- Read name from current catalogue: title strategy is created with the router, and catalogue depends on language, which depends on the router. The name does not change from one language to the other.
- Keep mobile-nav standalone
- Factor both
- Accept both
- A copy of the bar in the library to make it complete: two bars for one use
- Transitions right now, without measurement: they risked undoing D46.

## References

origin: docs/architecture/decisions.md:548 @ b299e1d — `src/app/i18n/models/catalog.model.ts:32` ; source: docs/architecture/decisions.md:522 @ b299e1d ; source: docs/architecture/decisions.md:492 @ b299e1d ; source: docs/architecture/decisions.md:1902 @ b299e1d ; merges: 0012-shared-holds-libraries-ui-windows-space-scene.md, 0019-core-and-shared-say-nothing-about-the-portfolio.md, 0070-mobile-nav-may-import-core-like-the-other-shared-libraries.md, 0071-duplicates-are-accepted-between-shared-libraries-which-stay.md, 0023-phone-tabs-stay-in-shared-ui-oriented-transitions-wait.md
