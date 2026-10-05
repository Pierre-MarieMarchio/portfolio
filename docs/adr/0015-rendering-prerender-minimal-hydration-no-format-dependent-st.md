# 0015 — Rendering: prerender, minimal hydration, no format-dependent structure at first render

- **Id**: 0015
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

provideClientHydration() is replaced by the two providers from @angular/core that it activates for this site: ɵwithDomHydration() and ɵwithEventReplay(). HTTP cache transfer and incremental hydration, which the site does not use (no HttpClient, no @defer), are no longer in the initial bundle. A spec verifies that both providers are placed and what they provide.

No structural block depends on the display format at first render: layout differences go through CSS (media or container queries); a block whose DOM must differ renders only after hydration (afterNextRender signal or @defer); a phone e2e test fails on any hydration warning. home-title, about-window, the observatory page and project-preview are in debt against it.

The not-found pages (404 and /en/404) are prerendered at those addresses, the only way the prerender writes a page for an address that is not a real route. They move to 404.html and en/404.html, where the web server's error document points, and are marked noindex. The sitemap and robots.txt are then written from the pages' own head, which already carries the absolute address and the other-language links built from SITE_URL (`scripts/finish-build`).

The prerender renders each page in a DOM without layout (Domino), where a browser API that jsdom has may be missing. A throw there does not fail the build: the page is written anyway, from whatever state was reached, and every page came out as the home page once. The specs run in jsdom and cannot see it, so `scripts/check-prerender` reads the files a reader without JavaScript gets.

**Reason.** @angular/platform-browser imports these two functions statically and only drops them at runtime: their public options (withNoHttpTransferCache, withNoIncrementalHydration) remove no bytes. With the node_modules of the lockfile (Angular 22.2.0), the initial bundle exceeded the 550 kB warning (550.71). After: 542.09 kB, −8.62 kB. Measured: prerendered output identical; prerendered DOM kept at hydration, no NG05xx messages, both formats; a link clicked before startup is replayed; on slowed phone (CPU ×4, 150 ms, 1.6 Mbit/s, 7 cold loads), same medians within milliseconds (hydration end 2 092 → 2 073 ms), 3.5 kB less JS transferred. The price: these are private APIs (ɵ). If an Angular update removes or renames them, compilation fails and npm run check fails too; if they change form, the spec fails. When the site needs HTTP cache or @defer, return to provideClientHydration().

Chosen by the operator at the onboarding interview; the prerender is always desktop while the client reads the real format at start, so a format @if makes server and client DOM differ

## Alternatives set aside

- Also remove event replay (−27 kB): a touch before startup would be lost.
- Lift the rule for these blocks
- Measure with a phone e2e first, then decide

## References

origin: docs/architecture/decisions.md:3103 @ b299e1d — `src/app/app.config.ts:25` ; origin: docs/architecture/decisions.md:2670 @ b299e1d — `angular.json:51` ; origin: docs/architecture/decisions.md:2670 @ b299e1d — `angular.json:51` ; Touch: scene draws at 60 fps max; phone: fewer pixels and grains: docs/architecture/decisions.md:1020 @ b299e1d ; Initial bundle budget up to 540 kB: docs/architecture/decisions.md:2374 @ b299e1d ; Initial bundle budget up to 550 kB until lots C and D end: docs/architecture/decisions.md:2668 @ b299e1d ; source: docs/architecture/decisions.md:3101 @ b299e1d ; merges: 0028-hydration-loads-only-what-the-site-uses.md, 0048-no-structural-block-depends-on-the-display-format-at-first-r.md
