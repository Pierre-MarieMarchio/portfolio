# Layers

knowledge-date: 2026-10-05
knowledge-commit: b299e1d

## README.md — Les couches

- app.config.ts is the composition root holding statewise, i18n and the initializer — `src/app/app.config.ts:42` — origin: README.md:62 @ b299e1d
- app.component composes the shell and the router-outlet — `src/app/app.component.html:4` — origin: README.md:70 @ b299e1d
- observatory components are the scene, opening card, title, unknown-address window, pause and dock — `src/app/features/observatory/components/index.ts:1` — origin: README.md:96 @ b299e1d
- observatory holds models ports rules states/observatory and states/animation — `src/app/features/observatory/states/index.ts:1` — origin: README.md:101 @ b299e1d
- src/testing holds what does not ship to production — `tsconfig.app.json:9` — origin: README.md:108 @ b299e1d
- Shared libraries import only core — `eslint.config.ts:140` — origin: README.md:79 @ b299e1d
- shared/windows holds the window, its drag and its stack — `src/app/shared/windows/services/window-stack.service.ts:4` — origin: README.md:81 @ b299e1d
- projects components are the featured bar, list, preview and sheet — `src/app/features/projects/components/index.ts:1` — origin: README.md:92 @ b299e1d
- data/ is content shipped with the site and only the repository reads it — `src/app/features/projects/services/projects-repository.service.ts:3` — origin: README.md:114 @ b299e1d

## docs/architecture/organisation.md — 3.4 Les rôles permis dans chaque zone

- features may have engine/ for observatory (no engine folder exists under features/observatory; check-structure not read) — origin: docs/architecture/organisation.md:257 @ b299e1d — status: declared
- shared/windows role folders are components directives services rules trackers models ports — `scripts/structure-tables.ts:84` — origin: docs/architecture/organisation.md:254 @ b299e1d

## docs/architecture/organisation.md — 5. Arborescence

- observatory/services lists the eight services on disk — `src/app/features/observatory/services/index.ts:1` — origin: docs/architecture/organisation.md:967 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/models/lang.model.ts`

- The routes follow the language prefix table through prefixedPath (also app.routes.server.ts:21); view paths come from PATHS in i18n, outside the zone — `src/app/app.routes.ts:53` — origin: docs/architecture/raisons/core-et-interface.md:41 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/services/errors/console-error-handler.service.ts`

- ConsoleErrorHandlerService is the Angular ErrorHandler, next to provideBrowserGlobalErrorListeners (app.config.ts:30); that ngx-statewise failures reach it is not checked here — `src/app/app.config.ts:31` — origin: docs/architecture/raisons/core-et-interface.md:99 @ b299e1d
- The error handler writes to the console in every build — `src/app/core/services/errors/console-error-handler.service.ts:6` — origin: docs/architecture/raisons/core-et-interface.md:104 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/strategies/route-head.strategy.ts`

- The head is written in one place: RouteHeadStrategy is provided as the TitleStrategy — `src/app/app.config.ts:40` — origin: docs/architecture/raisons/core-et-interface.md:139 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/ports/shared-texts.port.ts`

- The composition root answers the shared-texts token with the reader catalogue (provideI18n, provider at i18n/providers/i18n.provider.ts:40); contact-menu reads it (contact-menu.component.ts:25) — `src/app/app.config.ts:46` — origin: docs/architecture/raisons/core-et-interface.md:212 @ b299e1d
- Shared components own words come through a port that knows no language; the composition root answers it with the reader catalogue — `src/app/shared/ui/ports/shared-texts.port.ts:3` — origin: docs/architecture/raisons/core-et-interface.md:210 @ b299e1d
- SHARED_TEXTS has no default value so a composition that forgets it fails loudly — `src/app/shared/ui/ports/shared-texts.port.ts:17` — origin: docs/architecture/raisons/core-et-interface.md:214 @ b299e1d

## README.md — La loi de dépendance

- features/common imports nothing from the repository — `eslint.config.ts:159` — origin: README.md:129 @ b299e1d
- A shared library may import core only, never another library, features, i18n or pages — `eslint.config.ts:140` — origin: README.md:130 @ b299e1d
- shared/mobile-nav imports only core, like other shared libraries — `eslint.config.ts:151` — origin: README.md:131 @ b299e1d
- core imports nothing else under app/ — `eslint.config.ts:137` — origin: README.md:132 @ b299e1d
- i18n may import features shared core but never pages or the root — `eslint.config.ts:177` — origin: README.md:127 @ b299e1d
- A feature never imports another feature, i18n, pages or the root — `eslint.config.ts:168` — origin: README.md:128 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Les règles du lint et leurs réglages par catégorie (D17)

- Only the manager imports state and updater — `eslint.config.ts:533` — origin: docs/architecture/decisions.md:430 @ b299e1d
- Only core/services/browser touches browser globals — `eslint.config.ts:545` — origin: docs/architecture/decisions.md:432 @ b299e1d
- features/common: ../../ always exits it and @testing is denied — `eslint.config.ts:347` — origin: docs/architecture/decisions.md:435 @ b299e1d
- i18n/ and pages/ zones have their own law and no zone reaches up to the root app.*.ts files (root group at line 320 denied by every zone) — `eslint.config.ts:175` — origin: docs/architecture/decisions.md:416 @ b299e1d
- The i18n/ and pages/ zones have their law and no zone reaches the root app.*.ts — `eslint.config.ts:174` — origin: docs/architecture/decisions.md:416 @ b299e1d
- features/common imports nothing from the repository; ../../ always leaves it and @testing has nothing to do there (denies core, shared, features, i18n, pages, root, escapes; escapes = ../../ and @testing, eslint.config.ts:347) — `eslint.config.ts:156` — origin: docs/architecture/decisions.md:435 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — `shared/` tient des librairies : ui, windows, space-scene (D20)

- shared/windows holds window, drag, height, scroll memory, stack and its texts behind its own port — `src/app/shared/windows/ports/window-texts.port.ts:18` — origin: docs/architecture/decisions.md:530 @ b299e1d
- Each shared library imports only core, neither the portfolio nor another library (shared/windows non-spec imports are Angular, its own files and @app/core only) — `src/app/shared/windows/directives/kept-window.directive.ts:12` — origin: docs/architecture/decisions.md:527 @ b299e1d

## docs/architecture/organisation.md — 2.1 Où ranger un concept

- Lint holds the law zone by zone with FEATURES and SHARED_LIBS compared to disk — `eslint.config.ts:20` — origin: docs/architecture/organisation.md:63 @ b299e1d
- Shared libraries do not import each other — `eslint.config.ts:146` — origin: docs/architecture/organisation.md:51 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Un projet, un fichier : identité, faits et fiche ensemble

- core must not import features, shared, i18n, pages or root — `eslint.config.ts:137` — origin: docs/architecture/decisions.md:142 @ b299e1d
- Nothing other than the repository reads the project data (outside specs, only the repository imports PROJECTS) — `src/app/features/projects/services/projects-repository.service.ts:3` — origin: docs/architecture/decisions.md:132 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — `core/` et `shared/` ne disent plus un mot du portfolio (D51)

- DocumentHeadService receives the site name via the SITE_NAME port answered by provideI18n with OWNER_NAME — `src/app/core/services/head/document-head.service.ts:30` — origin: docs/architecture/decisions.md:1647 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — `pages/` ne garde que ses écrans, et l'atelier est défait (D83, amende D57 et défait « Atelier de composants en route de développement »)

- pages/ only contains observatory/ and check-structure refuses any role folder there — `scripts/structure-tables.ts:121` — origin: docs/architecture/decisions.md:2548 @ b299e1d
- The page-head resolver lives in i18n/resolvers next to the catalogue guard — `scripts/structure-tables.ts:116` — origin: docs/architecture/decisions.md:2554 @ b299e1d
- D83 (superseded by ADR 0009): mobile-nav reaches the browser through core services directly; the page provides only MobileNavLayoutService as MOBILE_NAV_LAYOUT — `src/app/features/observatory/services/mobile-nav-layout.service.ts:6` — origin: docs/architecture/decisions.md:2549 @ b299e1d
- D83: features/common imports nothing from the repo (lint denies core, shared, features, i18n, pages, root) — `eslint.config.ts:156` — origin: docs/architecture/decisions.md:2561 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/services/device/display-format.service.ts`

- core/services/browser/ is at its eight-source limit — `src/app/core/services/browser/page-visibility.service.ts:5` — origin: docs/architecture/raisons/core-et-interface.md:92 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/assets/styles/_fonts.scss`

- Both font families ship with the site rather than from a CDN — `src/assets/styles/_fonts.scss:1` — origin: docs/architecture/raisons/core-et-interface.md:311 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Une nomenclature précise et modulaire (D13)

- One structure everywhere zone then role folder then concept subfolder then files, each zone accepting only its listed roles — `scripts/check-structure.ts:116` — origin: docs/architecture/decisions.md:324 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Au téléphone, la vitre est une feuille à crans de `shared/mobile-nav` (D64, amende D25, D37, D39 et D62)

- shared/windows opens an optional port WINDOW_FOLD instead of importing mobile-nav — `src/app/shared/windows/components/window/window.component.ts:44` — origin: docs/architecture/decisions.md:1997 @ b299e1d
- D64: the library does not know formats ; MOBILE_NAV_LAYOUT carries isCompact (mobile-nav-layout.port.ts:4) — `src/app/shared/mobile-nav/components/bottom-sheet/bottom-sheet.component.ts:54` — origin: docs/architecture/decisions.md:1996 @ b299e1d
- D64: shared/windows and shared/mobile-nav do not import each other (lint denies every other library ; grep finds no cross import) — `eslint.config.ts:146` — origin: docs/architecture/decisions.md:1997 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au téléphone, l'accueil est une feuille, et l'aperçu en est le plein (D86, amende D57, D58, D64 et D71)

- WindowGripComponent is extracted from the window and shown when the window is held by a sheet — `src/app/shared/windows/components/window/window.component.html:9` — origin: docs/architecture/decisions.md:2640 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/components/segmented/`

- An item says what a choice is, nothing of its look; the look is decided once in the component — `src/app/shared/ui/components/segmented/segmented.component.ts:29` — origin: docs/architecture/raisons/core-et-interface.md:152 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/services/view-focus.service.ts`

- Plain sets, not a state, since nothing here is rendered — `src/app/shared/ui/services/view-focus.service.ts:10` — origin: docs/architecture/raisons/core-et-interface.md:228 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/ports/scene-window-drag.port.ts`

- space-scene knows nothing of windows (shared libraries do not import each other); SCENE_WINDOW_DRAG is the only hole and only a page can close it — `eslint.config.ts:146` — origin: docs/architecture/raisons/space-scene.md:616 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Le bilingue : un catalogue à l'exécution, l'adresse fixe la langue

- Each layer declares its text slice behind its own token, SHARED_TEXTS in shared/ui, served by the composition root — `src/app/shared/ui/ports/shared-texts.port.ts:17` — origin: docs/architecture/decisions.md:152 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Des noms qui se comprennent sans la maquette (D12)

- shared/ui/object-marks becomes shared/ui/layout-anchors; in shared/ui a name does not know its reader — `src/app/shared/ui/services/layout-anchors.service.ts:1` — origin: docs/architecture/decisions.md:310 @ b299e1d
- The anchor vocabulary shared by the featured bar and the scene is a type of features/common/scene-anchors — `src/app/features/common/models/scene-anchors.model.ts:1` — origin: docs/architecture/decisions.md:312 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Le téléphone a une librairie de navigation, et les chapitres se tournent comme des pages (D57, amende D37)

- D57 (superseded): formerly shared/mobile-nav/ imported nothing from the repo; now it imports core like other shared libraries (ADR 0009) — origin: docs/architecture/decisions.md:1777 @ b299e1d — status: superseded by ADR 0009
- D57: mobile-nav words come through MOBILE_NAV_TEXTS, provided by provideI18n — `src/app/i18n/providers/i18n.provider.ts:48` — origin: docs/architecture/decisions.md:1781 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Les onglets du téléphone restent dans `shared/ui`, et les transitions orientées attendent les fenêtres qui durent (D61)

- D61: the upright phone tab bar stays MainNavComponent in shared/ui and does not enter shared/mobile-nav/ — `src/app/shared/ui/components/main-nav/main-nav.component.ts:14` — origin: docs/architecture/decisions.md:1904 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au téléphone, la carte et la page se choisissent dès que le navigateur connaît la cible (D69, amende D57 et D58)

- D69 (superseded by ADR 0009): onSnapChanging and hasSnapChanging come from ElementObserverService, no longer from a mobile-nav port — `src/app/core/services/browser/element-observer.service.ts:1` — origin: docs/architecture/decisions.md:2166 @ b299e1d

## Decided at the onboarding interview (2026-10-05)

- The .effect file of a state concept is optional: a concept with no side effect has none, as the animation state (`src/app/features/observatory/states/animation/animation.manager.ts:8`)
- Rules stay pure: no DOM read and no engine import, and models import no engine either; the lint is to enforce it, and the existing deviations (`src/app/shared/space-scene/rules/scene-frame.rules.ts:1`, `src/app/shared/space-scene/rules/gestures/sky-touch.rules.ts:1`) are to be fixed
- Components and libraries do not couple through hidden CSS: a component exposes an input or a host class instead of a custom property set or read elsewhere (as --swipe-at, `src/app/shared/ui/components/segmented/segmented.component.scss:40`), and global styles do not target another component's internal classes
- Page-level services are autoProvided: false and provided by the component or page that uses them: CopyFeedbackService (`src/app/features/profile/services/copy-feedback.service.ts:6`) is `autoProvided: false` and provided by the profile components that use it (#190)
