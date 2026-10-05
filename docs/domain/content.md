# Content

knowledge-date: 2026-10-05
knowledge-commit: b299e1d

## docs/contenu.md — Ajouter un projet

- The project page is prerendered on its own in French and English — `src/app/app.routes.server.ts:9` — origin: docs/contenu.md:45 @ b299e1d
- The 'none of the NN projects' sentence follows the project count — `src/app/features/observatory/components/not-found-window/not-found-window.component.ts:22` — origin: docs/contenu.md:46 @ b299e1d
- All projects live in one file, src/app/features/projects/data/projects.data.json, an array. — `src/app/features/projects/data/projects.data.ts:3` — origin: docs/contenu.md:8 @ b299e1d
- The order of the array is the rank: rank = index in the array, and featured = first FEATURED of that order. — `src/app/features/projects/rules/ranking.rules.ts:10` — origin: docs/contenu.md:10 @ b299e1d
- An entry has exactly three blocks project, facts, detail with the fields shown in the example (slug, title, short, tag, family, subject, summary / proof, role, stack, context, period / lede, links, chapters). — `src/app/features/projects/rules/project-entry.rules.ts:222` — origin: docs/contenu.md:14 @ b299e1d
- family is professional or personal. — `src/app/features/projects/models/project-family.model.ts:1` — origin: docs/contenu.md:42 @ b299e1d
- short is the planet label and tag a state word (label use is in scene/observatory code not read). Note: tag is optional in the factory (project-entry.rules.ts:122), which the guide does not say. — origin: docs/contenu.md:41 @ b299e1d — status: declared
- Refused: missing or mistyped field (line 29-30), unknown field (line 50), unknown family (line 93), a text with both en and enDraft (line 69-70), a duplicate slug (line 253). — `src/app/features/projects/rules/project-entry.rules.ts:50` — origin: docs/contenu.md:50 @ b299e1d
- The error message names the project and the field, e.g. mon-projet: facts.role: expected an object, found missing (slug prefix line 245, path line 25, missing from JSON.stringify(undefined) line 29). — `src/app/features/projects/rules/project-entry.rules.ts:245` — origin: docs/contenu.md:53 @ b299e1d
- A chapter without title takes the default title of its place (Le besoin, Ce que j'ai fait, Un choix technique, Aujourd'hui, src/app/i18n/data/fr.data.ts:38-41). — `src/app/features/projects/rules/project-labels.rules.ts:18` — origin: docs/contenu.md:58 @ b299e1d
- A chapter may carry bullets, term/text pairs. — `src/app/features/projects/rules/project-entry.rules.ts:156` — origin: docs/contenu.md:60 @ b299e1d
- A figure of kind flow has steps, loop and caption, all required. — `src/app/features/projects/rules/project-entry.rules.ts:169` — origin: docs/contenu.md:63 @ b299e1d
- A figure of kind layers has layers of name/projects, and caption; any other kind is refused (line 197). — `src/app/features/projects/rules/project-entry.rules.ts:178` — origin: docs/contenu.md:65 @ b299e1d
- A figure is a reading diagram, never a screenshot presented as proof (editorial rule, nothing in code holds it). — origin: docs/contenu.md:68 @ b299e1d — status: declared
- The facts (proof, role, stack, context, period) are never repeated in the sheet: the sheet reads them from facts (lines 55-71). — `src/app/features/projects/components/project-detail/project-detail.component.html:55` — origin: docs/contenu.md:69 @ b299e1d

## docs/contenu.md — Changer les projets mis en avant

- Featured planets follow the featured count (bodies past it are faint) — `src/app/features/observatory/rules/scene-direction.rules.ts:124` — origin: docs/contenu.md:76 @ b299e1d
- To change which projects are featured, change the order of the array. — `src/app/features/projects/rules/ranking.rules.ts:12` — origin: docs/contenu.md:79 @ b299e1d

## docs/contenu.md — Changer un texte

- About page texts live in fr-profile.data.ts and en-profile.data.ts (i18n data not read; the zone only declares the PROFILE_TEXTS port) — origin: docs/contenu.md:93 @ b299e1d — status: declared
- To validate an interface draft remove draft( and lower INTERFACE_DRAFTS by one — `src/testing/integration/drafts.spec.ts:7` — origin: docs/contenu.md:101 @ b299e1d
- In projects.data.json a draft is enDraft and renaming it en is enough — `src/testing/integration/drafts.spec.ts:12` — origin: docs/contenu.md:104 @ b299e1d
- The site exists in French at the root and English under /en — `src/app/core/models/lang.model.ts:7` — origin: docs/contenu.md:84 @ b299e1d
- A text with a value is a small function — `src/app/i18n/data/fr.data.ts:32` — origin: docs/contenu.md:95 @ b299e1d
- EN interface texts are marked draft and INTERFACE_DRAFTS counts them — `src/testing/integration/drafts.spec.ts:7` — origin: docs/contenu.md:101 @ b299e1d
- View addresses live in paths.data.ts and routes, links, language switch and head derive from them — `src/app/i18n/data/paths.data.ts:19` — origin: docs/contenu.md:108 @ b299e1d
- A project text is in its entry, both languages side by side; a text identical in both languages is a plain string. — `src/app/features/projects/rules/project-entry.rules.ts:83` — origin: docs/contenu.md:86 @ b299e1d
- In projects.data.json a draft is written enDraft; renaming the key to en validates it (en gives bilingual(fr, english), enDraft gives bilingual(fr, draft(english))). — `src/app/features/projects/rules/project-entry.rules.ts:79` — origin: docs/contenu.md:104 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `features/profile/components/about-window/`

- About has four parts profile skills path method; method ends on CONTACT_EMAIL — `src/app/features/profile/components/about-window/about-window.component.ts:23` — origin: docs/architecture/raisons/bureau-et-pages.md:159 @ b299e1d

## docs/architecture/decisions.md — 2026-10-03 — Les projets restent dans le bundle initial, et la fabrique refuse un champ inconnu (D108, amende D106)

- drafts.spec counts enDraft in the JSON and keeps only the interface count written — `src/testing/integration/drafts.spec.ts:12` — origin: docs/architecture/decisions.md:3231 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/rules/draft.rules.ts`

- Reviewing a text removes draft( and the counting spec asks for the new count — `src/testing/integration/drafts.spec.ts:15` — origin: docs/architecture/raisons/core-et-interface.md:46 @ b299e1d
- Draft registration happens at module load — `src/app/core/rules/draft.rules.ts:1` — origin: docs/architecture/raisons/core-et-interface.md:51 @ b299e1d

## docs/architecture/raisons/projets-et-textes.md — `i18n/data/fr.data.ts`, `en.data.ts` et leurs tranches `*-profile.data.ts`

- drafts.spec counts the remaining English drafts — `src/testing/integration/drafts.spec.ts:15` — origin: docs/architecture/raisons/projets-et-textes.md:230 @ b299e1d

## docs/architecture/decisions.md — 2026-10-03 — Les projets sont un JSON, lu par une fabrique (D106, amende D5)

- drafts.spec.ts counts the enDraft keys of the projects JSON instead of a hard-coded figure — `src/testing/integration/drafts.spec.ts:12` — origin: docs/architecture/decisions.md:3201 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Le bilingue : un catalogue à l'exécution, l'adresse fixe la langue

- English written without review is marked draft and a spec counts what remains — `src/app/core/rules/draft.rules.ts:3` — origin: docs/architecture/decisions.md:162 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Un projet, un fichier : identité, faits et fiche ensemble

- An entry is typed ProjectEntry and identity, facts and detail are all three mandatory — `src/app/features/projects/rules/project-entry.rules.ts:225` — origin: docs/architecture/decisions.md:128 @ b299e1d
- A project's texts stay with the project, French and English side by side (fr with en or enDraft in projects.data.json) — `src/app/features/projects/data/projects.data.json:8` — origin: docs/architecture/decisions.md:133 @ b299e1d

## Decided at the onboarding interview (2026-10-05)

- The project factory refuses a slug that is not lowercase letters, digits and hyphens; today it reads any string (`src/app/features/projects/rules/project-entry.rules.ts:124`)
- The CV link, a local PDF (`src/app/features/profile/data/contact.data.ts:25`), opens in a new tab
