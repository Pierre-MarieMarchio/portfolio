# Tooling

knowledge-date: 2026-10-05
knowledge-commit: b299e1d

## README.md — Déploiement et branches

- CI reruns npm run check as parallel jobs: format/lint/structure, tests with coverage, build and prerender — `.github/workflows/ci.yml:31` — origin: README.md:41 @ b299e1d
- sky-touch.rules.ts ends up in a small initial chunk of 315 bytes (needs a build stats read) — origin: docs/architecture/decisions.md:1383 @ b299e1d — status: declared
- SonarQube Cloud analyses coverage and blocks on its quality gate (skipped on pushes to dev, ci.yml:88) — `.github/workflows/ci.yml:106` — origin: README.md:42 @ b299e1d
- A push on dev deploys a password-protected staging — `.github/workflows/ci.yml:186` — origin: README.md:45 @ b299e1d
- The staging is served at https://pm-marchio.fr/staging/ (the host comes from the STAGING_SITE_URL repository variable) — origin: README.md:46 @ b299e1d — status: declared
- Merging dev into main publishes production (deploy runs on push to main, never on pull_request) — `.github/workflows/ci.yml:113` — origin: README.md:47 @ b299e1d
- The deploy job ships the build artifact as is without a second build — `.github/workflows/ci.yml:164` — origin: README.md:48 @ b299e1d
- Deployment uses SFTP with the server key pinned — `.github/workflows/ci.yml:299` — origin: README.md:49 @ b299e1d
- Site address and route base are build variables SITE_URL and BASE_HREF — `.github/workflows/ci.yml:74` — origin: README.md:51 @ b299e1d
- CI reruns npm run check as parallel jobs: format lint structure; tests with coverage; build and prerender — `.github/workflows/ci.yml:31` — origin: README.md:41 @ b299e1d
- SonarQube Cloud analyses coverage and blocks on its quality gate — `.github/workflows/ci.yml:106` — origin: README.md:42 @ b299e1d
- A push on dev deploys a password-protected staging under https://pm-marchio.fr/staging/ (the host comes from repository variables) — origin: README.md:46 @ b299e1d — status: declared
- Deploy ships the build artifact as is without a second build over SFTP with the pinned server key — `.github/workflows/ci.yml:299` — origin: README.md:48 @ b299e1d
- The site address and route base are build variables SITE_URL and BASE_HREF — `.github/workflows/ci.yml:74` — origin: README.md:51 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/models/lang.model.ts`

- check-prerender runs in CI after build and build:finish (the script itself is outside the zone) — `.github/workflows/ci.yml:76` — origin: docs/architecture/raisons/core-et-interface.md:41 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/services/head/document-head.service.ts`

- SITE_URL is injected at build by --define, which the head service uses for absolute links — `.github/workflows/ci.yml:74` — origin: docs/architecture/raisons/core-et-interface.md:123 @ b299e1d
- SITE_URL is used for absolute links — `src/app/core/services/head/document-head.service.ts:6` — origin: docs/architecture/raisons/core-et-interface.md:123 @ b299e1d

## README.md — Démarrer

- The project runs on Node 24 pinned by .nvmrc — `.nvmrc:1` — origin: README.md:21 @ b299e1d
- npm run build produces a production build with every route prerendered (static output) — `angular.json:33` — origin: README.md:28 @ b299e1d
- npm test runs Vitest with jsdom in a single pass — `angular.json:82` — origin: README.md:30 @ b299e1d
- test:coverage runs the same pass with coverage and an lcov report in coverage/ — `package.json:28` — origin: README.md:31 @ b299e1d
- npm run lint runs ESLint including the dependency law then Stylelint with zero warnings — `package.json:18` — origin: README.md:32 @ b299e1d
- check:structure checks the organisation.md section 3 nomenclature and fails on a gap — `package.json:25` — origin: README.md:33 @ b299e1d
- check:comments fails listing any comment left in the code (D10) — `package.json:23` — origin: README.md:34 @ b299e1d
- npm run check chains format:check typecheck:tools lint test build check:prerender check:structure check:comments — `package.json:22` — origin: README.md:35 @ b299e1d
- Commit messages follow Conventional Commits through Husky and commitlint — `.husky/commit-msg:1` — origin: README.md:37 @ b299e1d
- check:structure holds the organisation.md section 3 nomenclature and fails on a deviation — `scripts/check-structure.mjs:338` — origin: README.md:33 @ b299e1d
- check:comments fails listing the comments left in the code — `scripts/check-comments.mjs:103` — origin: README.md:34 @ b299e1d
- npm run check chains format:check typecheck:tools lint test build check:prerender check:structure check:comments — `package.json:22` — origin: README.md:35 @ b299e1d

## README.md — La loi de dépendance

- Adding a feature or library means adding it to FEATURES or SHARED_LIBS or lint refuses to run — `eslint.config.js:20` — origin: README.md:143 @ b299e1d

## README.md — Conventions

- JS configuration files are type-checked in strict mode — `tsconfig.tools.json:11` — origin: README.md:183 @ b299e1d
- Mixins are imported via the include path of angular.json — `angular.json:40` — origin: README.md:222 @ b299e1d
- Mixins are imported through the include path of angular.json — `angular.json:40` — origin: README.md:222 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Le moteur est corrigé avant le lint, sans exemption provisoire (D16)

- The extended golden shares its bench in engine-scene.fixture.ts and src/testing/doubles — `src/testing/fixtures/engine-scene.fixture.ts:99` — origin: docs/architecture/decisions.md:395 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Les règles du lint et leurs réglages par catégorie (D17)

- check-structure runs in --strict — `package.json:25` — origin: docs/architecture/decisions.md:418 @ b299e1d
- Specs and src/testing have no mandatory access modifier and no line caps — `eslint.config.js:356` — origin: docs/architecture/decisions.md:424 @ b299e1d
- _tokens.scss is exempt from the disallowed-values list — `stylelint.config.mjs:7` — origin: docs/architecture/decisions.md:437 @ b299e1d
- The core group excludes @angular/core — `eslint.config.js:197` — origin: docs/architecture/decisions.md:447 @ b299e1d
- A sister feature is also refused by its bare name — `eslint.config.js:212` — origin: docs/architecture/decisions.md:449 @ b299e1d
- .claude/** is ignored by lint — `eslint.config.js:265` — origin: docs/architecture/decisions.md:455 @ b299e1d
- The lint adds sonarjs recommended, whole — `eslint.config.js:275` — origin: docs/architecture/decisions.md:408 @ b299e1d
- eslint and stylelint both run with --max-warnings 0 — `package.json:18` — origin: docs/architecture/decisions.md:413 @ b299e1d
- The engine has no block of its own for size or formula names (no engine-scoped block in eslint.config.js) — `eslint.config.js:269` — origin: docs/architecture/decisions.md:415 @ b299e1d
- The lint is typed (projectService) so banning any also sees the one nobody wrote — `eslint.config.js:281` — origin: docs/architecture/decisions.md:445 @ b299e1d
- FEATURES is compared to the disk; a feature without its row throws — `eslint.config.js:15` — origin: docs/architecture/decisions.md:451 @ b299e1d
- prefer-on-push-component-change-detection is not enabled (only angular tsRecommended extended, rule never named) — `eslint.config.js:274` — origin: docs/architecture/decisions.md:453 @ b299e1d
- Stylelint leaves layout to Prettier (stylelint.config.mjs only extends stylelint-config-standard-scss; whether that set carries no stylistic rule needs the installed version read) — origin: docs/architecture/decisions.md:457 @ b299e1d — status: declared
- Safari on iOS only reads -webkit-text-size-adjust (text-size-adjust ignored by the prefix rule) — `stylelint.config.mjs:33` — origin: docs/architecture/decisions.md:459 @ b299e1d
- core/services/browser/ is the only folder allowed to touch browser globals — `eslint.config.js:411` — origin: docs/architecture/decisions.md:432 @ b299e1d
- _tokens.scss is where values forbidden elsewhere by declaration-property-value-disallowed-list are written — `stylelint.config.mjs:7` — origin: docs/architecture/decisions.md:437 @ b299e1d
- The core group excludes @angular/core, which a port token needs even in features/common (links.port.ts:1 imports InjectionToken) — `eslint.config.js:197` — origin: docs/architecture/decisions.md:447 @ b299e1d

## docs/architecture/decisions.md — 2026-09-24 — Les raisons du code ont leur dossier, et un garde-fou tient D10 (D21)

- check-comments refuses any comment in src except a spec @ts-expect-error with its reason, using the TS parser — `scripts/check-comments.mjs:52` — origin: docs/architecture/decisions.md:557 @ b299e1d
- check-comments refuses any comment in src except a spec ts-expect-error with its reason, parsed with the compiler — `scripts/check-comments.mjs:8` — origin: docs/architecture/decisions.md:557 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — La CI se découpe, mesure la couverture, passe par Sonar et déploie son propre build (D48)

- SITE_URL is a define whose default lives in angular.json — `angular.json:43` — origin: docs/architecture/decisions.md:1577 @ b299e1d
- Under coverage each test has 30 s — `vitest-coverage.config.ts:5` — origin: docs/architecture/decisions.md:1579 @ b299e1d
- Under coverage each test has 30 s (testTimeout 30_000 in vitest-coverage.config.ts) — `vitest-coverage.config.ts:5` — origin: docs/architecture/decisions.md:1580 @ b299e1d
- Test coverage runs through vitest-coverage.config.ts (test:coverage script) — `package.json:28` — origin: docs/architecture/decisions.md:1569 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Les outils des specs sont écrits une fois, et tout ce qui teste vit sous `src/testing/` (D52)

- Integration suites live in src/testing/integration and hold only specs — `tsconfig.spec.json:9` — origin: docs/architecture/decisions.md:1671 @ b299e1d
- tsconfig.app.json excludes only one folder (src/testing/**) besides the spec glob — `tsconfig.app.json:10` — origin: docs/architecture/decisions.md:1681 @ b299e1d
- The @testing/* alias points at src/testing/ and is kept rather than renaming the folder — `tsconfig.json:24` — origin: docs/architecture/decisions.md:1686 @ b299e1d

## docs/architecture/organisation.md — 3.5 Les tests

- Fixtures are built with the real rules (project.fixture uses the real rank) — `src/testing/fixtures/project.fixture.ts:14` — origin: docs/architecture/organisation.md:271 @ b299e1d
- A manager is never doubled; specs receive the real one — `src/testing/fixtures/project.fixture.ts:110` — origin: docs/architecture/organisation.md:276 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/testing/doubles/driven-host.double.ts`

- Frames run only when the spec advances the clock and now is that clock — `src/testing/doubles/driven-host.double.ts:24` — origin: docs/architecture/raisons/space-scene.md:430 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/testing/fixtures/texts.fixture.ts`

- Texts of every layer and the links are provided at once in FR — `src/testing/fixtures/texts.fixture.ts:12` — origin: docs/architecture/raisons/space-scene.md:441 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `app.config.ts`

- zoneless.spec holds that the app runs without zone — `src/testing/integration/zoneless.spec.ts:41` — origin: docs/architecture/raisons/bureau-et-pages.md:304 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `src/testing/integration/zoneless.spec.ts`

- The zone checked is the one from the composition root — `src/testing/integration/zoneless.spec.ts:39` — origin: docs/architecture/raisons/bureau-et-pages.md:364 @ b299e1d
- Bundle warning threshold of 530 kB unchanged at D38 (historical; HEAD angular.json:51 is 550kB, see 1063) — origin: docs/architecture/decisions.md:1150 @ b299e1d — status: declared

## docs/architecture/decisions.md — 2026-09-23 — Zéro avertissement (D9)

- No eslint-disable and no rule lifted per file; only per-category settings remain (spec and src/testing block) — `eslint.config.js:356` — origin: docs/architecture/decisions.md:258 @ b299e1d
- Lint runs with --max-warnings 0 — `package.json:18` — origin: docs/architecture/decisions.md:256 @ b299e1d
- Only per-category settings remain such as for specs — `eslint.config.js:355` — origin: docs/architecture/decisions.md:261 @ b299e1d
- Lint runs with --max-warnings 0 — `package.json:18` — origin: docs/architecture/decisions.md:256 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Une nomenclature précise et modulaire (D13)

- scripts/check-structure.mjs verifies the structure inside npm run check (in --strict mode, as D19 line 495 says) — `package.json:25` — origin: docs/architecture/decisions.md:328 @ b299e1d
- check-structure runs strict in npm run check — `package.json:25` — origin: docs/architecture/decisions.md:328 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Intégration et déploiement continus sur GitHub Pages

- outputMode static produces a serverless site — `angular.json:33` — origin: docs/architecture/decisions.md:33 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Le bundle initial peut aller jusqu'à 540 kB, le temps de finir le chantier (D77, amende D36)

- The initial bundle error budget stays at 1 MB and the per-component style warning at 4 kB — `angular.json:52` — origin: docs/architecture/decisions.md:2377 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Les défauts relevés par SonarQube Cloud sont corrigés, ou exclus par écrit avec leur raison (D82, étend D48)

- Sonar exclusions are kept in the config file reviewed in PR with no NOSONAR in the code — `sonar-project.properties:15` — origin: docs/architecture/decisions.md:2538 @ b299e1d
- D82: Web:S6822 excluded on card-carousel because role=list gives back the list semantics Safari drops with list-style none (scss line 11 ; sonar-project.properties:20-21) — `src/app/shared/mobile-nav/components/card-carousel/card-carousel.component.html:4` — origin: docs/architecture/decisions.md:2525 @ b299e1d
- D82: Web:S6819 excluded on segmented and language-switch, which are toggle buttons (aria-pressed) and links, not fields (sonar-project.properties:23-27 ; no fieldset in shared/ui) — `src/app/shared/ui/components/segmented/segmented.component.html:7` — origin: docs/architecture/decisions.md:2527 @ b299e1d

## docs/architecture/decisions.md — 2026-10-03 — Le lint borne les fonctions à 40 lignes, une complexité de 8 et deux niveaux, scripts compris (D107)

- Production src code is linted with max-lines-per-function 40, complexity 8, max-depth 2, sonarjs/cognitive-complexity 10, max-params 4, max-lines 300 — `eslint.config.js:318` — origin: docs/architecture/decisions.md:3164 @ b299e1d
- The same six rules now apply to scripts/**/*.mjs — `eslint.config.js:337` — origin: docs/architecture/decisions.md:3166 @ b299e1d
- Specs and src/testing/ stay exempt from size and complexity rules (max-params still applies to them) — `eslint.config.js:356` — origin: docs/architecture/decisions.md:3168 @ b299e1d
- max-lines-per-function 40, complexity 8, max-depth 2, cognitive complexity 10, max-params 4, max-lines 300 — `eslint.config.js:318` — origin: docs/architecture/decisions.md:3164 @ b299e1d
- Size and complexity lint rules apply to scripts/**/*.mjs — `eslint.config.js:337` — origin: docs/architecture/decisions.md:3167 @ b299e1d
- D107: production lint uses complexity 8, max-depth 2 (line 323), sonarjs/cognitive-complexity 10 (line 324), max-lines-per-function from line 318 ; specs exempt (lines 360-363) — `eslint.config.js:322` — origin: docs/architecture/decisions.md:3164 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Le moteur de l'objet devient des objets (D11)

- The engine lint exemption disappears — `eslint.config.js:285` — origin: docs/architecture/decisions.md:297 @ b299e1d

## docs/architecture/decisions.md — 2026-09-24 — Un catalogue de langue se découpe par tranche (D22)

- D22: the lint line limit (300 lines) drives splitting a language catalogue — `eslint.config.js:314` — origin: docs/architecture/decisions.md:570 @ b299e1d

## docs/architecture/decisions.md — 2026-10-03 — Les projets sont un JSON, lu par une fabrique (D106, amende D5)

- drafts.spec.ts counts the enDraft keys of the JSON instead of a hard-coded number — `src/testing/integration/drafts.spec.ts:12` — origin: docs/architecture/decisions.md:3201 @ b299e1d

## docs/architecture/decisions.md — 2026-10-03 — Les projets restent dans le bundle initial, et la fabrique refuse un champ inconnu (D108, amende D106)

- drafts.spec.ts keeps only the interface catalogue count written down and adds the enDraft count of the JSON — `src/testing/integration/drafts.spec.ts:15` — origin: docs/architecture/decisions.md:3231 @ b299e1d

## README.md — SSR et prérendu

- check:prerender rereads the prerendered pages — `scripts/check-prerender.mjs:198` — origin: README.md:176 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — L'arborescence est en place, avec quatre unités de passage (D19)

- check-prerender refuses an expected absence that no component selector could produce — `scripts/check-prerender.mjs:238` — origin: docs/architecture/decisions.md:514 @ b299e1d

## docs/contenu.md — Ajouter un projet

- A refused entry makes the prerender fail: not run; scripts/check-prerender.mjs:5-8 says a throw during prerender does not fail the build, though here the throw is at module evaluation. Running the build with a broken entry would settle it. — origin: docs/contenu.md:52 @ b299e1d — status: declared
- A refused entry makes npm run check fail: at least the test step, since drafts.spec imports PROJECTS (and checks its length against the JSON, line 14). — `src/testing/integration/drafts.spec.ts:4` — origin: docs/contenu.md:53 @ b299e1d
- A sheet prerendered without its window fails check-prerender (each /projet/<slug> page must hold <app-window and <app-project-detail). — `scripts/check-prerender.mjs:91` — origin: docs/contenu.md:55 @ b299e1d

## docs/contenu.md — Changer un texte

- The project draft count follows the file: the spec counts enDraft occurrences in the JSON, only INTERFACE_DRAFTS (156, line 7) is hand-maintained. — `src/testing/integration/drafts.spec.ts:12` — origin: docs/contenu.md:105 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `features/observatory/components/observatory-dock/`

- check-prerender refuses <app-window in the prerendered home, and matches by substring (line 190), so any selector starting with app-window would count as a window. — `scripts/check-prerender.mjs:71` — origin: docs/architecture/raisons/bureau-et-pages.md:41 @ b299e1d

## docs/architecture/decisions.md — 2026-10-02 — Le site quitte GitHub Pages pour l'hébergement OVH de son domaine (D95)

- The .htaccess serves prerendered 404 pages in French and English, forces HTTPS and the bare host, keeps the trailing directory slash, caches hashed files one year, no-cache for HTML, and compresses — `public/.htaccess:3` — origin: docs/architecture/decisions.md:2877 @ b299e1d
- Not-found pages 404.html and en/404.html are marked noindex — `scripts/finish-build.mjs:57` — origin: docs/architecture/decisions.md:2879 @ b299e1d
- build:finish places the 404 pages and writes sitemap.xml and robots.txt from the canonical and alternate links of the pages — `scripts/finish-build.mjs:75` — origin: docs/architecture/decisions.md:2881 @ b299e1d
- The staging robots.txt forbids everything and staging has no sitemap (scripts/finish-build.mjs:118 always writes an open robots.txt and a sitemap, the staging rewrite would be in CI outside the zone) — origin: docs/architecture/decisions.md:2958 @ b299e1d — status: declared

## docs/architecture/decisions.md — 2026-10-03 — La traduction reste maison, avec deux règles écrites, et un texte bilingue se marque (D102, amende D3)

- check-prerender reads the English addresses in the hreflang of French pages instead of importing the TypeScript — `scripts/check-prerender.mjs:56` — origin: docs/architecture/decisions.md:3058 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Les libs de `shared/` testent ce qu'on voit d'elles (D55, étend D54)

- D55: the AnimatedCanvasService spec checks what it decides (drawing off the main thread or not, falling back when the browser refuses) — `src/app/shared/space-scene/services/animated-canvas.service.spec.ts:91` — origin: docs/architecture/decisions.md:1753 @ b299e1d

## Decided at the onboarding interview (2026-10-05)

- Every spec restores globals and spies in afterEach, and TestBed.resetTestingModule calls are removed since Angular resets the TestBed after each test; remaining calls, as at `src/app/shared/mobile-nav/services/back-layers.service.spec.ts:145`, are deviations
- The 620 px phone threshold written both in `src/assets/styles/mixins/_formats.scss:1` and in `src/app/core/rules/display-format.rules.ts:6` is tied by a spec that compares them; the two 500 px values (phone landscape height, project list container query) are independent facts and carry different names
- Playwright reference screenshots are not a requirement: none was ever set up
- .gitattributes stays tracked with its eol rules (`.gitattributes:9`) and is never ignored
