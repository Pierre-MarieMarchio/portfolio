# Projects and texts

knowledge-date: 2026-10-05
knowledge-commit: b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Le bilingue : un catalogue à l'exécution, l'adresse fixe la langue

- provideI18n serves every slice from the current-language catalogue — `src/app/i18n/providers/i18n.provider.ts:22` — origin: docs/architecture/decisions.md:155 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/models/lang.model.ts`

- LANG_PREFIXES is written once and read by langOfUrl, prefixedPath, unprefixedSegments — `src/app/core/models/lang.model.ts:7` — origin: docs/architecture/raisons/core-et-interface.md:39 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — L'arborescence est en place, avec quatre unités de passage (D19)

- D19: a ProfileTexts slice from features/profile/ports receives about and contact — `src/app/i18n/models/catalog.model.ts:5` — origin: docs/architecture/decisions.md:498 @ b299e1d

## docs/architecture/decisions.md — 2026-09-24 — Un catalogue de langue se découpe par tranche (D22)

- D22: fr-profile.data.ts and en-profile.data.ts carry the profile slice and fr.data.ts / en.data.ts import it (en.data.ts:4 and :166 too) — `src/app/i18n/data/fr.data.ts:3` — origin: docs/architecture/decisions.md:572 @ b299e1d

## docs/architecture/decisions.md — 2026-10-03 — Les projets sont un JSON, lu par une fabrique (D106, amende D5)

- Bilingual texts are built by bilingual() and drafts are marked by draft() from core/rules — `src/app/core/rules/localize.rules.ts:22` — origin: docs/architecture/decisions.md:3197 @ b299e1d
- localize rebuilds objects (Object.fromEntries), which would lose a class prototype — `src/app/core/rules/localize.rules.ts:43` — origin: docs/architecture/decisions.md:3211 @ b299e1d
- A bilingual value carries a kind discriminant that a JSON would otherwise have to spell out — `src/app/core/rules/localize.rules.ts:6` — origin: docs/architecture/decisions.md:3222 @ b299e1d

## docs/architecture/organisation.md — 4.4 `features/projects/`

- One JSON read through the factory, order is rank — `src/app/features/projects/data/projects.data.ts:5` — origin: docs/architecture/organisation.md:626 @ b299e1d
- The featured bar becomes a card carousel on phone — origin: docs/architecture/organisation.md:635 @ b299e1d — status: declared
- Preview navigates to previous and next featured project, looping — `src/app/features/projects/components/project-preview/project-preview.component.ts:49` — origin: docs/architecture/organisation.md:637 @ b299e1d
- ProjectsManager contract projects ranked featured familyCounts find findIn detailOf nextOf isFeatured load — `src/app/features/projects/states/projects/projects.manager.ts:23` — origin: docs/architecture/organisation.md:642 @ b299e1d
- FEATURED is the only source of the featured count — `src/app/features/projects/states/projects/projects.manager.ts:17` — origin: docs/architecture/organisation.md:647 @ b299e1d

## docs/architecture/raisons/projets-et-textes.md — `features/projects/models/project.model.ts`

- A Text is a plain string or a bilingual value — `src/app/features/projects/rules/project-entry.rules.ts:90` — origin: docs/architecture/raisons/projets-et-textes.md:18 @ b299e1d
- Two projects never share a slug — `src/app/features/projects/rules/project-entry.rules.ts:260` — origin: docs/architecture/raisons/projets-et-textes.md:20 @ b299e1d
- Facts are the single source read by rule, index, preview and sheet — `src/app/features/projects/models/project.model.ts:39` — origin: docs/architecture/raisons/projets-et-textes.md:28 @ b299e1d

## docs/architecture/raisons/projets-et-textes.md — `features/projects/models/project-detail.model.ts`

- An untitled chapter takes the default title of its position — `src/app/features/projects/rules/project-labels.rules.ts:18` — origin: docs/architecture/raisons/projets-et-textes.md:40 @ b299e1d
- The identity list of the first chapter is read from the facts — `src/app/features/projects/components/project-detail/project-detail.component.html:51` — origin: docs/architecture/raisons/projets-et-textes.md:41 @ b299e1d

## docs/architecture/raisons/projets-et-textes.md — `features/projects/ports/projects-texts.port.ts`

- PROJECTS_TEXTS has no default value — `src/app/features/projects/ports/projects-texts.port.ts:54` — origin: docs/architecture/raisons/projets-et-textes.md:53 @ b299e1d

## docs/architecture/raisons/projets-et-textes.md — `features/projects/services/projects-repository.service.ts`

- The repository answers synchronously but as an Observable — `src/app/features/projects/services/projects-repository.service.ts:15` — origin: docs/architecture/raisons/projets-et-textes.md:58 @ b299e1d

## docs/architecture/raisons/projets-et-textes.md — `features/projects/states/projects/projects.effect.ts`

- A failure cause goes to ErrorHandler and the state learns only the failure — `src/app/features/projects/states/projects/projects.effect.ts:18` — origin: docs/architecture/raisons/projets-et-textes.md:68 @ b299e1d

## docs/architecture/raisons/projets-et-textes.md — `features/projects/states/projects/projects.manager.ts`

- Featured projects derive from rank with no flag — `src/app/features/projects/states/projects/projects.manager.ts:42` — origin: docs/architecture/raisons/projets-et-textes.md:73 @ b299e1d
- A project missing facts draws no empty row and the others keep their number — `src/app/features/projects/states/projects/projects.manager.ts:36` — origin: docs/architecture/raisons/projets-et-textes.md:75 @ b299e1d
- find derives from the list — `src/app/features/projects/states/projects/projects.manager.ts:59` — origin: docs/architecture/raisons/projets-et-textes.md:79 @ b299e1d

## docs/architecture/raisons/projets-et-textes.md — `features/projects/states/projects/projects.updater.ts`

- requestStatus clears the previous error on each request — origin: docs/architecture/raisons/projets-et-textes.md:92 @ b299e1d — status: declared
- Success writes the whole catalog at once — `src/app/features/projects/states/projects/projects.updater.ts:9` — origin: docs/architecture/raisons/projets-et-textes.md:94 @ b299e1d

## docs/architecture/raisons/projets-et-textes.md — `features/projects/components/featured-bar/`

- The belt starts at 2 percent, 4 markers on 56 percent, up to 94 percent — `src/app/features/projects/components/featured-bar/featured-bar.component.ts:23` — origin: docs/architecture/raisons/projets-et-textes.md:121 @ b299e1d
- Marker names fade below about 130 px per gap through data-crowded — `src/app/features/projects/components/featured-bar/featured-bar.component.ts:28` — origin: docs/architecture/raisons/projets-et-textes.md:125 @ b299e1d

## docs/architecture/raisons/projets-et-textes.md — `features/projects/components/project-list/`

- The shown family is held by the desktop — `src/app/features/projects/components/project-list/project-list.component.ts:39` — origin: docs/architecture/raisons/projets-et-textes.md:146 @ b299e1d
- Filtering never re-sorts — `src/app/features/projects/components/project-list/project-list.component.ts:100` — origin: docs/architecture/raisons/projets-et-textes.md:148 @ b299e1d

## docs/architecture/raisons/projets-et-textes.md — `features/projects/components/project-preview/`

- The preview shows only a featured project — `src/app/features/projects/components/project-preview/project-preview.component.ts:39` — origin: docs/architecture/raisons/projets-et-textes.md:160 @ b299e1d

## docs/architecture/raisons/projets-et-textes.md — `features/projects/data/projects.data.ts`

- Only the repository reads the project data — `src/app/features/projects/services/projects-repository.service.ts:3` — origin: docs/architecture/raisons/projets-et-textes.md:222 @ b299e1d

## docs/contenu.md — Ajouter un projet

- The /projet/<slug> page is prerendered by itself, the prerender params being read from ProjectsRepositoryService.getCatalog(). — `src/app/app.routes.server.ts:14` — origin: docs/contenu.md:45 @ b299e1d
- Index, counters and rule follow the file: ranked, featured and familyCounts are computed from the state loaded from PROJECTS (the not-found sentence and the object are outside this zone, not checked). — `src/app/features/projects/states/projects/projects.manager.ts:73` — origin: docs/contenu.md:46 @ b299e1d
- The file is read by a factory, features/projects/rules/project-entry.rules.ts (readProjectEntries), at module load. — `src/app/features/projects/data/projects.data.ts:5` — origin: docs/contenu.md:49 @ b299e1d

## docs/contenu.md — Changer les projets mis en avant

- The featured projects on the home are the first of the rank (featured = place < featuredCount). — `src/app/features/projects/rules/ranking.rules.ts:12` — origin: docs/contenu.md:74 @ b299e1d
- Their number is one value, the FEATURED token in projects.manager.ts (default factory 4, line 19). — `src/app/features/projects/states/projects/projects.manager.ts:44` — origin: docs/contenu.md:75 @ b299e1d
- Preview and rule follow FEATURED (spec checks rule markers line 77, preview neighbours line 84, index rows line 101); curtain and featured planets not checked here. — `src/testing/integration/featured-count.spec.ts:77` — origin: docs/contenu.md:76 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Un projet, un fichier : identité, faits et fiche ensemble

- The repository derives the catalog (projects, facts and details by slug) from the entries — `src/app/features/projects/services/projects-repository.service.ts:16` — origin: docs/architecture/decisions.md:131 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Le téléphone a une librairie de navigation, et les chapitres se tournent comme des pages (D57, amende D37)

- The links of a project are repeated in each pager page — `src/app/features/projects/components/project-detail/project-detail.component.html:76` — origin: docs/architecture/decisions.md:1799 @ b299e1d

## docs/architecture/decisions.md — 2026-10-03 — La traduction reste maison, avec deux règles écrites, et un texte bilingue se marque (D102, amende D3)

- D102: interface texts live in a typed catalogue per language ; shared/ui reads its slice through the SHARED_TEXTS port as a Signal<SharedTexts> — `src/app/shared/ui/ports/shared-texts.port.ts:17` — origin: docs/architecture/decisions.md:3051 @ b299e1d
- D102: the Catalog type imports the ports of features (lines 3-5) and of shared libs (shared/ui line 6, mobile-nav line 8), so it cannot live in a shared lib ; no shared/ui, mobile-nav or space-scene file imports a feature — `src/app/i18n/models/catalog.model.ts:3` — origin: docs/architecture/decisions.md:3075 @ b299e1d
