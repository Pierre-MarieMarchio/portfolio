# 0012 — pages/ keeps only its screens; the observatory page assembles only what crosses features

- **Id**: 0012
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

ObservatoryPageComponent keeps what only the page can do, because it crosses features: Project → Planet, the not-found sheet, typed filter, designated project, click on body, and start state read from address. The rest goes where it belongs. First-plane and window focus of the view pass to ViewWindowsService and ViewSlotDirective (features/observatory); navigation and languages to ViewLinksService (i18n); contact rail to ContactLinksComponent (features/profile); reveal home as soon as it is left to HomeRevealService. Its fields carry the name of their type (observatory, featuredTour, homeReveal).

pages/ contains only observatory/. shared/mobile-nav reaches the browser through core services directly (ADR 0009); the page provides only what the library must not know, the display format, as MobileNavLayoutService (features/observatory/services/) implementing MOBILE_NAV_LAYOUT, as the scene provides SceneSurroundingsService to shared/space-scene. provideMobileNav() and app.config.ts no longer name it. The page title resolver goes into i18n/resolvers/, alongside the catalog guard that the same routes call. The workshop (/atelier, dev-only route) disappears with its route. check-structure refuses any role folder in pages/ and accepts i18n/resolvers/.

**Reason.** Page was 330 lines; it is now 199, of which 59 imports. The session 3 survey (current state) lists what was moved and what was set aside, with the gain of each.

The operator wanted pages/ reserved for screens, and each piece where existing zones welcome it, with no new zone: core cannot know a library port, the library imports nothing from the repo (D57), features/common imports nothing; a feature can, and the repo already had this case for the scene. Page title, description, and addresses in each language are text and addresses: the definition of i18n/. The workshop decision said to undo it when pages showed all states of the window and segmented: true since lot B. Prerendered titles and descriptions are identical before and after; initial bundle goes from 532.08 to 532.47 kB.

## Alternatives set aside

- Sub-compositions per view: windows cross observatory and projects or profile, so their composition stays in pages/, which holds one component per screen. An Escape directive: one line in host is enough. A service for start state read from address: three lines, at the sole place that knows i18n and the observatory.
- New folder at repo root (providers/, resolvers/, or app/): one more zone for two files, which the operator refused.
- Keep the provider at injection root: the page is the only tree that uses the library.

## References

origin: docs/architecture/decisions.md:1626 @ b299e1d — `src/app/features/observatory/directives/view-slot.directive.ts:6` ; source: docs/architecture/decisions.md:1620 @ b299e1d ; source: docs/architecture/decisions.md:194 @ b299e1d ; source: docs/architecture/decisions.md:288 @ b299e1d ; origin: docs/architecture/decisions.md:9 @ b299e1d — `src/app/shared/ui/components/segmented/segmented.component.ts:1` ; Component workshop on a dev-only route: docs/architecture/decisions.md:7 @ b299e1d ; source: docs/architecture/decisions.md:2546 @ b299e1d ; merges: 0018-observatory-page-only-assembles-what-crosses-features.md, 0025-pages-keeps-only-its-screens-the-workshop-is-undone.md
