# Code conventions

knowledge-date: 2026-10-05
knowledge-commit: b299e1d

## README.md — Conventions

- Components use templateUrl + styleUrl, inject(), input()/output() and written member accessibility — `src/app/features/profile/components/about-window/about-window.component.ts:34` — origin: README.md:187 @ b299e1d
- An input and the output that changes it form a pair x / xChange and a stateless event is a past participle — `src/app/features/profile/components/about-window/about-window.component.ts:46` — origin: README.md:196 @ b299e1d
- Ids addressed by code are constants (OBSERVATORY_IDS) — `src/app/features/observatory/models/observatory-ids.model.ts:1` — origin: README.md:199 @ b299e1d
- any is banned whether written or inherited via typed lint and no-unsafe rules — `eslint.config.ts:286` — origin: README.md:180 @ b299e1d
- $any() is forbidden in templates — `eslint.config.ts:374` — origin: README.md:182 @ b299e1d
- Member accessibility is always written and checked by lint — `eslint.config.ts:306` — origin: README.md:188 @ b299e1d
- Selectors are prefixed app — `eslint.config.ts:298` — origin: README.md:189 @ b299e1d
- A class carries its file suffix (D7) and check-structure holds the list — `scripts/check-structure.ts:76` — origin: README.md:190 @ b299e1d
- The code carries no comment (D10) — `package.json:23` — origin: README.md:204 @ b299e1d
- Every behaviour is held by a spec (many rules files such as panel-veil.rules.ts have no own spec; indirect coverage not checked) — origin: README.md:206 @ b299e1d — status: declared
- Templates have conditional complexity 4 and cyclomatic complexity 12 — `eslint.config.ts:377` — origin: README.md:210 @ b299e1d
- Names follow NAMES in eslint.config.ts — `eslint.config.ts:327` — origin: README.md:211 @ b299e1d
- Stylelint refuses literals that bypass the design tokens (three listed literals only) — `stylelint.config.ts:36` — origin: README.md:218 @ b299e1d
- A class carries the suffix of its file — `scripts/check-structure.ts:76` — origin: README.md:190 @ b299e1d
- Each component has its own folder named after it — `scripts/check-structure.ts:125` — origin: README.md:195 @ b299e1d
- An input and the output that changes it form an x / xChange pair — `src/app/features/projects/components/featured-bar/featured-bar.component.ts:53` — origin: README.md:196 @ b299e1d
- States are read as English data-* attributes — `src/app/features/projects/components/project-list/project-list.component.html:39` — origin: README.md:199 @ b299e1d
- Tokens live in src/assets/styles/_tokens.scss — `src/styles.scss:2` — origin: README.md:216 @ b299e1d
- Global partials base motion utilities are loaded by styles.scss — `src/styles.scss:3` — origin: README.md:219 @ b299e1d

## docs/architecture/organisation.md — 3.2 Les suffixes : comment on se sert du fichier

- Components reach state through the manager only — `src/app/features/observatory/components/observatory-dock/observatory-dock.component.ts:15` — origin: docs/architecture/organisation.md:153 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `features/observatory/states/observatory/`

- The updater spec registers no effect — `src/app/features/observatory/states/observatory/observatory.updater.spec.ts:30` — origin: docs/architecture/raisons/bureau-et-pages.md:145 @ b299e1d
- Cross-zone imports go through an alias and the folder barrel; relative imports stay inside a zone (not enforced as such by lint) — origin: README.md:146 @ b299e1d — status: declared

## docs/architecture/decisions.md — 2026-09-23 — Une nomenclature précise et modulaire (D13)

- At most 8 source files per role folder, checked by check-structure in npm run check — `scripts/check-structure.ts:14` — origin: docs/architecture/decisions.md:326 @ b299e1d
- At most 8 source files per folder — `scripts/check-structure.ts:14` — origin: docs/architecture/decisions.md:326 @ b299e1d
- A file carrying a role suffix goes in that role's folder (check-structure reports belongs in role/) — `scripts/check-structure.ts:177` — origin: docs/architecture/decisions.md:325 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Les règles du lint et leurs réglages par catégorie (D17)

- @ts-expect-error with a description is allowed — `eslint.config.ts:296` — origin: docs/architecture/decisions.md:428 @ b299e1d
- Prerender code writes data-* with setAttribute although unicorn/dom-node-dataset is an error (eslint.config.ts:74); coexistence not checked — origin: docs/architecture/decisions.md:460 @ b299e1d — status: declared
- Names follow NAMES fed to @typescript-eslint/naming-convention (line 327) — `eslint.config.ts:48` — origin: docs/architecture/decisions.md:442 @ b299e1d
- A spec ts-expect-error with its reason is the only way to test that a type refuses a value (projects.data.spec.ts) — `src/app/features/projects/data/projects.data.spec.ts:103` — origin: docs/architecture/decisions.md:429 @ b299e1d
- Safari on iOS only reads -webkit-text-size-adjust — `src/assets/styles/_base.scss:11` — origin: docs/architecture/decisions.md:459 @ b299e1d

## docs/architecture/organisation.md — 3.1 Les règles

- A role folder holds at most 8 source files — `scripts/check-structure.ts:305` — origin: docs/architecture/organisation.md:121 @ b299e1d
- A role folder holds at most 8 source files — `scripts/check-structure.ts:290` — origin: docs/architecture/organisation.md:122 @ b299e1d
- No empty folder — `scripts/check-structure.ts:323` — origin: docs/architecture/organisation.md:125 @ b299e1d

## docs/architecture/organisation.md — 3.3 Les dossiers de rôle

- Specs sit next to the file they test; src/testing has fixtures doubles integration — `tsconfig.spec.json:9` — origin: docs/architecture/organisation.md:244 @ b299e1d
- data/ holds .data as .ts or .json — `scripts/structure-tables.ts:35` — origin: docs/architecture/organisation.md:240 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Les outils des specs sont écrits une fois, et tout ce qui teste vit sous `src/testing/` (D52)

- A spec helper copied across files lives once under src/testing/ (browser double with stubViewport stubMedia stubObservers in doubles/browser.double.ts) — `src/testing/doubles/browser.double.ts:5` — origin: docs/architecture/decisions.md:1664 @ b299e1d
- Gesture helpers live in fixtures/pointer.fixture.ts — `src/testing/fixtures/pointer.fixture.ts:11` — origin: docs/architecture/decisions.md:1667 @ b299e1d
- TestBed helpers (platform, outputs, child component) live in fixtures/testbed.fixture.ts — `src/testing/fixtures/testbed.fixture.ts:12` — origin: docs/architecture/decisions.md:1667 @ b299e1d
- Scene rules geometry, the looked-at scene and the spec observatory each have their own testing file (scene-layout.fixture, scene-look.double, observatory.fixture) — `src/testing/fixtures/scene-layout.fixture.ts:8` — origin: docs/architecture/decisions.md:1668 @ b299e1d
- Unit specs stay next to what they test — `src/app/shared/space-scene/rules/camera/zoom.rules.spec.ts:1` — origin: docs/architecture/decisions.md:1673 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Un test vérifie un comportement, là où il vit (D54)

- prerender-safety.spec.ts and home-status.spec.ts are gone (no such file under src; absence checked by find) — `src/testing/integration/zoneless.spec.ts:1` — origin: docs/architecture/decisions.md:1716 @ b299e1d

## docs/architecture/decisions.md — 2026-10-03 — Le lint borne les fonctions à 40 lignes, une complexité de 8 et deux niveaux, scripts compris (D107)

- No per-file exception and no eslint-disable (zero eslint-disable found in src and scripts) — `eslint.config.ts:314` — origin: docs/architecture/decisions.md:3169 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Les fichiers gardent leur suffixe (D7)

- Files and classes keep their role suffix including services — `src/app/core/services/browser/clock.service.ts:8` — origin: docs/architecture/decisions.md:223 @ b299e1d
- Files and classes keep their role suffix — `scripts/check-structure.ts:229` — origin: docs/architecture/decisions.md:223 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Les suffixes disent comment on se sert du fichier (D15)

- Scene units use .engine .motion .renderer suffixes — `scripts/structure-tables.ts:38` — origin: docs/architecture/decisions.md:374 @ b299e1d
- The .helper suffix replaces .utils (helper maps to helpers/ and no utils role exists) — `scripts/structure-tables.ts:21` — origin: docs/architecture/decisions.md:374 @ b299e1d
- A .port file gathers a contract and its token, text slices included — `src/app/features/projects/ports/projects-texts.port.ts:54` — origin: docs/architecture/decisions.md:375 @ b299e1d
- The .signal suffix is a called role, in its own role folder — `src/app/shared/ui/signals/element-size.signal.ts:1` — origin: docs/architecture/decisions.md:373 @ b299e1d
- .port gathers a contract and its token, text slices included — `src/app/shared/ui/ports/shared-texts.port.ts:17` — origin: docs/architecture/decisions.md:375 @ b299e1d

## docs/architecture/decisions.md — 2026-10-03 — Les projets sont un JSON, lu par une fabrique (D106, amende D5)

- check-structure accepts .json only for the .data suffix — `scripts/structure-tables.ts:35` — origin: docs/architecture/decisions.md:3202 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/styles.scss`

- styles.scss loads only global partials from src/assets/styles — `src/styles.scss:1` — origin: docs/architecture/raisons/core-et-interface.md:294 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/assets/styles/_tokens.scss`

- --target-compact serves secondary controls — `src/assets/styles/_tokens.scss:43` — origin: docs/architecture/raisons/core-et-interface.md:349 @ b299e1d

## docs/architecture/decisions.md — 2026-09-24 — Une capture tolère 200 pixels, pas une position fractionnaire (D24)

- --window-top is not rounded to the pixel — `src/assets/styles/_tokens.scss:41` — origin: docs/architecture/decisions.md:615 @ b299e1d

## docs/architecture/decisions.md — 2026-09-25 — Sous la vitre, un seul filtre (D28, amende D25)

- On phone the raised glass puts a single filter --glass-blur-pane on the sky it covers — `src/app/shared/windows/components/window/window.component.scss:124` — origin: docs/architecture/decisions.md:742 @ b299e1d
- --glass-blur-pane is blur(4px) brightness(0.7) saturate(1.08) — `src/assets/styles/_tokens.scss:51` — origin: docs/architecture/decisions.md:743 @ b299e1d
- --vitre-pane is the tint of --vitre at 62 percent — `src/assets/styles/_tokens.scss:15` — origin: docs/architecture/decisions.md:743 @ b299e1d

## docs/architecture/decisions.md — 2026-09-26 — Au téléphone, le pied de la vitre reste à l'écran et la vitre couchée serre son chrome (D34, amende D25 et D27)

- Three _tokens.scss tokens --window-bar-padding --window-footer-padding --window-footer-gap change value per format (landscape phone removes the bar vertical padding and the footer line gap) — `src/assets/styles/_tokens.scss:101` — origin: docs/architecture/decisions.md:946 @ b299e1d

## docs/architecture/decisions.md — 2026-09-27 — Le code propre au téléphone se charge à part (D39, amende D37)

- The .tracker role (trackers/) and rules/ are open to shared/windows in check-structure — `scripts/structure-tables.ts:88` — origin: docs/architecture/decisions.md:1177 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Cinq reprises sur captures : la vitre basse des petits téléphones, le relevé selon sa place, le titre, les segmentés de la tablette, l'accueil couché (D45, amende D27, D28, D34, D38 et D40)

- Under short-phone-portrait the title bar and footer take the tight tokens of the landscape phone — `src/assets/styles/_tokens.scss:110` — origin: docs/architecture/decisions.md:1440 @ b299e1d
- The phone-portrait query is (width < 620px) and (orientation portrait) — `src/assets/styles/mixins/_formats.scss:13` — origin: docs/architecture/decisions.md:1456 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Les libs de `shared/` testent ce qu'on voit d'elles (D55, étend D54)

- Window control specs find buttons by their accessible name, not by rank — `src/app/shared/windows/components/window-controls/window-controls.component.spec.ts:22` — origin: docs/architecture/decisions.md:1744 @ b299e1d
- window.model.spec, window-texts.port.spec and scroll-memory.service.spec no longer exist (no spec beside those files) — `src/app/shared/windows/ports/window-texts.port.ts:18` — origin: docs/architecture/decisions.md:1745 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — L'intro se passe d'un geste, aucun geste ne se perd, et la scène se pose à la fin (D80, amende D41)

- The reach animation of the _arrival.scss mixin makes a held panel active at the first frame of its arrival — `src/assets/styles/mixins/_arrival.scss:3` — origin: docs/architecture/decisions.md:2463 @ b299e1d

## docs/architecture/decisions.md — 2026-10-01 — Au téléphone, ce qu'on touche répond, et une feuille vibre en se calant (D88)

- A pressed button, link or sheet bar fades through filter opacity(0.55) in a common _touch.scss rule and the native tap highlight is removed — `src/assets/styles/_touch.scss:13` — origin: docs/architecture/decisions.md:2689 @ b299e1d
- D88: components that declare their own transition list add filter to it for the pressed state (the carousel card transition lists filter) — `src/app/shared/mobile-nav/components/card-carousel/card-carousel.component.scss:47` — origin: docs/architecture/decisions.md:2692 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/components/segmented/`

- The inactive count is written in --ink-2, not --line — `src/app/shared/ui/components/segmented/segmented.component.scss:53` — origin: docs/architecture/raisons/core-et-interface.md:162 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/components/social-links/`

- Each contact link is 44px (--target), never less — `src/assets/styles/mixins/_controls.scss:77` — origin: docs/architecture/raisons/core-et-interface.md:170 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Au téléphone, les projets vedettes sont des cartes qu'on fait glisser (D58, amende D35)

- D58: --mnav-* variables draw the cards and _tokens.scss binds them to the site tokens — `src/assets/styles/_tokens.scss:68` — origin: docs/architecture/decisions.md:1827 @ b299e1d

## Decided at the onboarding interview (2026-10-05)

- A cross-zone import goes through the folder's index.ts and a barrel exports every unit of its folder, unless an exception is written down (bundle size, internal unit); a deep import that has no written exception is a deviation, as at `src/app/pages/observatory/observatory-page.component.ts:135`
- A tracker may compose trackers loaded in the same lazy chunk, as WindowFrameTracker does with WindowDragTracker and WindowHeightTracker, never across chunks nor from the initial bundle — `src/app/shared/windows/trackers/window-frame.tracker.ts:23-24`
- Naming is strict, one name means one thing: the two exported SkyPan types (`src/app/shared/space-scene/engine/renderers/sky/star-sky.renderer.ts:41`, `src/app/shared/space-scene/engine/motions/zoom.motion.ts:14`) and the double meaning of sheet (a held window, the project sheet) are deviations to rename
- Styles go through the shared mixins rather than restating them (font-family must use type.mono mixin, enforced by stylelint rule refusing hand-written `var(--mono)` outside `src/assets/styles/mixins/_type.scss`, `stylelint.config.ts:18-26`), and a token is not re-set to its own fallback value
- A value shared by CSS, TS and specs has the CSS token as its source: TS reads the token (`src/app/features/observatory/services/home-reveal.service.ts:49`), specs take it from one fixture constant (ARRIVAL_AT, INTRO_DURATION at `src/testing/fixtures/observatory.fixture.ts:24`, `src/testing/fixtures/observatory.fixture.ts:25`)
