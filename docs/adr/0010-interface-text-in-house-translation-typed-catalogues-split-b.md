# 0010 — Interface text: in-house translation, typed catalogues split by slice, every visible word in them

- **Id**: 0010
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

When a language catalogue exceeds the line limit for lint, a whole slice — that of one layer — comes out into its own file alongside: fr-profile.data.ts and en-profile.data.ts carry the profile slice, and fr.data.ts / en.data.ts import them. The Catalog type does not change.

The in-house translation mechanism is kept. Two rules share it: interface text lives in a language-typed catalog, loaded separately; content text (projects, addresses) are bilingual values built by bilingual(fr, en), both languages in the object. localize resolves only these marked values: a plain Record<Lang, string> (language names, og:locale table) stays intact. The language → address-prefix table is written once (core/models/lang.model.ts); routes, addresses, and check-prerender follow it (the script reads English addresses in French page hreflang, unable to import TypeScript). Prerendered output does not change.

Every visible interface word goes through the i18n catalogues, including contact labels (E-mail, LinkedIn, GitHub, CV) and template literals

**Reason.** Text rewrite (docs/wording/) took en.data.ts past 300 lines, mostly because of multiline draft(…) marks. Slicing by layer follows ports: each file matches a layer that reads its own texts.

This is the only path that keeps typed keys together (a missing key does not compile), the scene mounted during language change (tested), and the initial bundle under the 550 kB warning (D87). Recognition by shape {fr,en} was a latent error: plain tables have the same shape and would be reduced to string. The reason of D3 'GitHub Pages serves only one 404' no longer holds since D95; D3 holds without it, by the reload that @angular/localize imposes.

Chosen by the operator at the onboarding interview; contact.data.ts:9 hard-codes them today

## Alternatives set aside

- Shorten sentences to fit the limit: text does not adjust to a tool. An exception to lint: forbidden (D9).
- All text inline: about 14.6 kB more in main.
- All text in catalog: breaks 'one file per project', and future projects JSON 'in one place'.
- Transloco: keys as untyped strings, cost unmeasured for 1.4 kB margin.
- @angular/localize: reloads the app on language change.
- shared/i18n/ lib: Catalog type imports feature ports, which a shared lib cannot do; i18n is the root that composes them.
- Proper names and language-neutral glyphs stay hard-coded
- Case by case, listed in content.md

## References

origin: docs/architecture/decisions.md:158 @ b299e1d — `src/app/core/services/i18n/locale.service.ts:15` ; origin: docs/architecture/decisions.md:3054 @ b299e1d — `src/app/core/rules/localize.rules.ts:41` ; origin: docs/architecture/decisions.md:3056 @ b299e1d — `src/app/core/models/lang.model.ts:7` ; Bilingual: runtime catalogue, the address fixes the language: docs/architecture/decisions.md:147 @ b299e1d ; source: docs/architecture/decisions.md:3048 @ b299e1d ; merges: 0014-a-language-catalogue-is-split-by-slice.md, 0027-translation-stays-in-house-with-two-written-rules-bilingual.md, 0045-every-visible-interface-word-goes-through-the-i18n-catalogue.md
