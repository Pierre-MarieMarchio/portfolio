# 0003 — Addresses: French at root, English under /en

- **Id**: 0003
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

French keeps its addresses (/, /projets, /projet/:slug, /a-propos); English has them under /en (/en, /en/projects, /en/project/:slug, /en/about). A single table, src/app/i18n/paths.ts, draws routes, links (the LINKS port of features/common), the language selector and the head alternates. Both languages are prerendered; an unknown address stays unknown in the other language.

**Reason.** Existing French addresses do not break, each page is indexable in its language, and a shared address says the language it shows.

## Alternatives set aside

- /fr/… for French (all existing addresses would change); language as parameter or stored preference (the same address would show two pages, which prerendering cannot serve).

## References

origin: docs/architecture/decisions.md:178 @ b299e1d — `src/app/core/models/lang.model.ts:7` ; source: docs/architecture/decisions.md:176 @ b299e1d ; merges: 0003-addresses-french-at-root-english-under-en.md
