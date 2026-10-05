# 0007 — One route component declares the view; language comes from the router

- **Id**: 0007
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

A single, empty route component (observatory-route.component) serves all views, sheet included: on its activation, it tells the observatory which view its address shows. Language is derived from Router.lastSuccessfulNavigation; the guard only loads the catalogue; page heads read the catalogue of the target language. Amends D3.

**Reason.** A single point of view writing, carried by the unit whose role it is; a single source of language.

## Alternatives set aside

- A resolver that writes the view: a resolver computes a datum, it does not write state, and its name would lie about its role. Two marker components (one per route form). Derive language from the current navigation (the catalogue would be read before being loaded).

## References

origin: docs/architecture/decisions.md:352 @ b299e1d — `src/app/app.routes.ts:20` ; source: docs/architecture/decisions.md:350 @ b299e1d ; merges: 0008-one-route-component-declares-the-view-language-derived-from.md
