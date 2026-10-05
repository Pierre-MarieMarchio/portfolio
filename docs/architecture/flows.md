# Flows

knowledge-date: 2026-10-05
knowledge-commit: b299e1d

## Boot and first render

1. `appConfig` providers: zoneless, router with component input binding, `RouteHeadStrategy`, hydration, statewise effects, i18n — `src/app/app.config.ts:27`
2. Initializer awaits `ProjectsManager.load()` — `src/app/app.config.ts:48`
3. `AppComponent` renders skip link, `<router-outlet>` (route markers) then `<app-observatory-page>` once, outside the outlet — `src/app/app.component.html:1`, `src/app/app.component.html:4`, `src/app/app.component.html:5`

## Address to view

1. Each route (both languages) maps to `ObservatoryRouteComponent` with `data.view`, guard `loadCatalog`, title and resolvers — `src/app/app.routes.ts:17`
2. Unknown paths per language → `not-found` — `src/app/app.routes.ts:41`
3. Page/route component calls `ObservatoryManager.syncRoute(view, slug)` with `canHoldSheets` = not phone — `src/app/features/observatory/states/observatory/observatory.manager.ts:119`
4. Updater `syncRoute`: resume point, sheet hand-over, view/slug/chapter, minimized cleanup, seen, preview drop, arrival notes — `src/app/features/observatory/states/observatory/observatory.updater.ts:119`
5. `ViewWindowsService` brings the view window to front and claims focus — `src/app/features/observatory/services/view-windows.service.ts:121`, `src/app/features/observatory/services/view-windows.service.ts:140`

## Prerender

1. Server config merges `serverRoutes` — `src/app/app.config.server.ts:10`
2. Sheet routes enumerate slugs from `ProjectsRepositoryService.getCatalog()` — `src/app/app.routes.server.ts:12`
3. Per-language 404 and `**` prerendered — `src/app/app.routes.server.ts:20`, `src/app/app.routes.server.ts:24`

## Close a window

1. `ObservatoryManager.close(window)` dispatches async — `src/app/features/observatory/states/observatory/observatory.manager.ts:145`
2. Updater unpins and clears preview/minimized — `src/app/features/observatory/states/observatory/observatory.updater.ts:174`
3. Effect computes parent and goes back in history or `navigateByUrl(replaceUrl)` — `src/app/features/observatory/states/observatory/observatory.effect.ts:23`, `src/app/features/observatory/states/observatory/observatory.effect.ts:58`

## Escape / background step back

1. `escape()` / `stepBack()` — `src/app/features/observatory/states/observatory/observatory.manager.ts:181`
2. Effect returns `observatorySelected(null)` or `observatoryPreviewClosed()` or nothing — `src/app/features/observatory/states/observatory/observatory.effect.ts:39`

## Home intro and tour

1. `HomeRevealService.start` holds the rest until presence or `--arrival-at` — `src/app/features/observatory/services/home-reveal.service.ts:42`
2. Skip button calls `arrive()` while withheld — `src/app/features/observatory/components/intro-skip/intro-skip.component.html:2`
3. `FeaturedTourService.play` waits 4200 ms then hovers each featured slug — `src/app/features/observatory/services/featured-tour.service.ts:21`

## Scene

1. `ObservatorySceneComponent.direction` = `sceneDirectionOf(...)` — `src/app/features/observatory/components/observatory-scene/observatory-scene.component.ts:66`
2. `SpaceSceneComponent` boots the engine after first render, then pushes inputs snapshot through an effect — `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:134`, `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:107`, `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:194`
3. Layout re-measured after every render and on resize/pointerup/animationend/transitionend/drag — `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:127`, `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:243`, `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:292`

## Phone tab choice

1. `TabNavigationService.choose(address)` — desktop restores minimized windows of the tab, phone applies history rules — `src/app/features/observatory/services/tab-navigation.service.ts:67`, `src/app/features/observatory/services/tab-navigation.service.ts:108`

## Copy contact address

1. `ContactLinksComponent.copy()` / `ContactMenuComponent.copy()` — `src/app/features/profile/components/contact-links/contact-links.component.ts:57`
2. `CopyFeedbackService.copy` → `isCopied` 4 s → `<output>` announces — `src/app/features/profile/services/copy-feedback.service.ts:20`, `src/app/features/profile/components/contact-links/contact-links.component.html:13`

## CI / deploy

1. Triggers: PR, push main/dev, dispatch; concurrency per ref — `.github/workflows/ci.yml:3`, `.github/workflows/ci.yml:12`
2. Jobs lint (format, typecheck tools, lint, structure, comments), test (coverage artifact), build (base-href, SITE_URL define, build:finish, check:prerender, artifact with hidden files) — `.github/workflows/ci.yml:21`, `.github/workflows/ci.yml:37`, `.github/workflows/ci.yml:54`
3. Sonar on PR and non-dev pushes, waits quality gate — `.github/workflows/ci.yml:74`
4. Deploy: checks, staging closing (.htaccess rewrite, Basic auth, robots, no sitemap), htpasswd, lftp SFTP mirror with pinned host key — `.github/workflows/ci.yml:94`, `.github/workflows/ci.yml:156`, `.github/workflows/ci.yml:209`

## A spec that renders an observatory component

1. Provide French texts and links — `src/testing/fixtures/texts.fixture.ts:12`
2. Put the format with `stubMedia` / `resizeTo` / `stubViewport` — `src/testing/doubles/browser.double.ts:19`, `src/testing/doubles/browser.double.ts:10`, `src/testing/doubles/browser.double.ts:5`
3. Set tokens the global stylesheet would give (`--arrival-at`, `--intro-duration`) on `<html>` — `src/app/features/observatory/components/intro-skip/intro-skip.component.spec.ts:15`, `src/app/features/observatory/components/intro-card/intro-card.component.spec.ts:16`
4. Tear down in `afterEach` (`removeProperty`, `useRealTimers`, `unstubAllGlobals`) — `src/app/features/observatory/services/home-reveal.service.spec.ts:41`

## Local gate (`npm run check`)

1. format:check, typecheck:tools (JS configs and scripts, `tsconfig.tools.json:15-20`) — `package.json:22`, `package.json:27`
2. lint: ESLint then Stylelint, `--max-warnings 0` — `package.json:18`; ESLint first asserts folders vs lists — `eslint.config.ts:15-44`
3. test: `ng test --watch=false` (Vitest runner, `angular.json:82`) — `package.json:16`
4. build + `build:finish` — `package.json:12-13`; then check:prerender, check:structure --strict, check:comments — `package.json:24`, `package.json:25`, `package.json:23`

## Commit

1. Husky installed by `prepare` — `package.json:26`
2. `commit-msg` hook runs commitlint on the message — `.husky/commit-msg:1`
3. rule set = config-conventional, nothing else — `commitlint.config.ts:1`

## CI (.github/workflows/ci.yml, read to check claims; outside the zone globs)

1. lint, test (coverage), build jobs in parallel — `.github/workflows/ci.yml:21`, `.github/workflows/ci.yml:37`, `.github/workflows/ci.yml:54`
2. sonar after test, quality gate waited, skipped on dev pushes — `.github/workflows/ci.yml:76`, `.github/workflows/ci.yml:92`
3. deploy on main/dev pushes and manual runs, from the build artifact, SFTP with pinned host key — `.github/workflows/ci.yml:96-104`, `.github/workflows/ci.yml:244`, `.github/workflows/ci.yml:252`

## Turning the scene by drag

1. window-level capturing `pointerdown` stops the click absorber; primary pointers go to `grab` — `src/app/shared/space-scene/directives/turn-gesture.directive.ts:20-29`
2. reject if no scene, non-left button, or not on sky — `:39` → `src/app/shared/space-scene/rules/gestures/sky-touch.rules.ts:7`
3. `scene.grab` must accept; cursor `grabbing`; listeners for that pointer id — `src/app/shared/space-scene/directives/turn-gesture.directive.ts:42-68`
4. `pointermove` → `scene.turn`; `pointerup`/`pointercancel` → `release` — `:53`, `:58`, `:63`
5. release: if it was a drag, absorb the next click — `:71-77`

## Registering a scene target

1. directive constructor adds the element to `SceneTargetsService`, removal on destroy — `src/app/shared/space-scene/directives/scene-target.directive.ts:10-13`

## Per-frame derivation

1. `sceneState(inputs)` — `src/app/shared/space-scene/rules/scene-state.rules.ts:78`
2. `sceneFrame(state, style)` with a veil closure — `src/app/shared/space-scene/rules/scene-frame.rules.ts:99-107`

## Boot and first render

1. `provideI18n` provides the text tokens, SITE_NAME and LINKS, and an initializer loads the catalogue of the current language — `src/app/i18n/providers/i18n.provider.ts:69`
2. `LocaleService.path` falls back to `Location.path()` before the first navigation — `src/app/core/services/i18n/locale.service.ts:9`, :13
3. `ObservatoryPageComponent` is mounted by AppComponent, outside the router (app.component.html:5). Its constructor reads the view from the address, calls `syncRoute`, then `publishOnRoot` — `src/app/pages/observatory/observatory-page.component.ts:256-261`
4. `afterNextRender` starts the home reveal, then the featured tour — `src/app/pages/observatory/observatory-page.component.ts:270-274`

## Navigation

1. Each route has the empty `ObservatoryRouteComponent`, `canActivate: [loadCatalog]` and a title resolver (app.routes.ts:20-22)
2. The guard loads the target-language catalogue — `src/app/i18n/guards/catalog.guard.ts:6`
3. The route component calls `observatory.syncRoute(view, slug)` only if view or slug changed, one frame later after the first navigation — `src/app/pages/observatory/observatory-route.component.ts:35-49`
4. `RouteHeadStrategy.updateTitle` → `DocumentHeadService.set` — `src/app/core/strategies/route-head.strategy.ts:10`

## Scene in a worker

1. `RemoteSceneEngine` posts `boot`, then a `call` for each method, stamped with `at` and `hidden` — `src/app/shared/space-scene/engine/remote-scene.engine.ts:100`, `src/app/shared/space-scene/engine/remote-scene.engine.ts:247-253`
2. The worker builds `SpaceSceneEngine` on OffscreenCanvas, wraps clearRect to detect a drawn canvas — `src/app/shared/space-scene/engine/scene-worker.engine.ts:62-112`; it loads hole-focus lazily — `src/app/shared/space-scene/engine/scene.worker.ts:45`
3. A flush posts bitmaps, the recorded DOM writes, the generations and the pan — `src/app/shared/space-scene/engine/scene-worker.engine.ts:219`
4. The page keeps only writes whose generation still matches, then on its next frame applies writes and paints bitmaps together — `src/app/shared/space-scene/engine/remote-scene.engine.ts:281-287`, `src/app/shared/space-scene/engine/remote-scene.engine.ts:297-305`

## Frame loop

1. `request()` → `wake()` → host.frame(tick) — `src/app/shared/space-scene/engine/space-scene.engine.ts:252`, `src/app/shared/space-scene/engine/frame-loop.engine.ts:38`
2. tick → step → advance + draw ; it re-arms while not settled, gripped or turning — `src/app/shared/space-scene/engine/space-scene.engine.ts:280-288`

## One frame of the scene (body of `tick → step → advance + draw` named in knowledge-3)

1. `SceneMotion.advance`: opening ease, grains arrival/density, camera, zoom (+ pan), clock — `src/app/shared/space-scene/engine/motions/scene.motion.ts:86-90`
2. `SceneMotion.lay` writes the SceneFrame: traveling, camera pose (`src/app/shared/space-scene/engine/motions/camera.motion.ts:176-197`), unzoomed hole, zoom/pan offset (`src/app/shared/space-scene/engine/motions/zoom.motion.ts:120-137`, `src/app/shared/space-scene/engine/motions/sky-pan.motion.ts:53-69`), entry, time, phase, disc azimuth, focus — `src/app/shared/space-scene/engine/motions/scene.motion.ts:93-104`
3. `SceneRenderer.draw`: clear matter, grains, orbits, planets (writes labels, buttons, lines, `frame.aim`), comets, then sky (stars, trails, constellations, figure targets), then hole-mark attributes — `src/app/shared/space-scene/engine/renderers/scene.renderer.ts:62-72`

## Stars in a frame

1. `SkyRenderer.draw` maps pose to `SkyCamera` with `finiteOr` fallbacks — `src/app/shared/space-scene/engine/renderers/sky/sky.renderer.ts:20-40`
2. `StarFlowMotion.update` builds the `SkyFrame`, flattens once at the end of the flight — `src/app/shared/space-scene/engine/motions/star-flow.motion.ts:122-136`
3. Per star: `place` (spread, wrap or respawn) → `holeLight` (hidden in the shadow) → `follow` (velocity, trail aim) → trail stroke or batch → dot with lensing — `src/app/shared/space-scene/engine/renderers/sky/star-sky.renderer.ts:154-172`
4. On phone the batch is flushed once — `src/app/shared/space-scene/engine/renderers/sky/star-sky.renderer.ts:148-150`; constellations drawn with the returned pan — `src/app/shared/space-scene/engine/renderers/sky/sky.renderer.ts:41`

## Planet labels in a frame

1. Lines faded by `rising` — `src/app/shared/space-scene/engine/renderers/planets.renderer.ts:61-63`; planets placed and repelled — :64-69; aim written — :70
2. `labels.begin` captures panels, stage, hole (once arrived and marks shown) and, on touch, disc and bodies — `src/app/shared/space-scene/engine/renderers/planet-labels.renderer.ts:133-166`
3. Per shown planet: reach (button), body, then tag or name with a leader line — `src/app/shared/space-scene/engine/renderers/planets.renderer.ts:117-140`, `src/app/shared/space-scene/engine/renderers/planet-labels.renderer.ts:177-183`; planets beyond `focus.shown` hidden — `src/app/shared/space-scene/engine/renderers/planets.renderer.ts:78-80`

## Projects load

1. Initializer calls `load()` — `src/app/features/projects/states/projects/projects.manager.ts:96`
2. Effect reads repository, failure goes to ErrorHandler — `src/app/features/projects/states/projects/projects.effect.ts:12`
3. Repository answers `of()` built from PROJECTS — `src/app/features/projects/services/projects-repository.service.ts:14`
4. PROJECTS built once by the factory at import — `src/app/features/projects/data/projects.data.ts:5`
5. Updater writes projects, facts, details — `src/app/features/projects/states/projects/projects.updater.ts:9`
6. Manager localizes and ranks — `src/app/features/projects/states/projects/projects.manager.ts:29`

## Build and post-build

1. `ng build && build:finish` — `package.json:12`
2. 404 pages moved to 404.html / en/404.html, noindex — `scripts/finish-build.ts:29`, `scripts/finish-build.ts:69`
3. sitemap.xml and robots.txt from page-head links — `scripts/finish-build.ts:81`
4. check:prerender reads dist — `scripts/check-prerender.ts:4`

## Desktop window drag

1. WindowComponent hands section+bar after first render — `src/app/shared/windows/components/window/window.component.ts:102`
2. Directive stores parts, lazy-loads tracker for desktop/tablet — `src/app/shared/windows/directives/window-frame.directive.ts:74`, `src/app/shared/windows/directives/window-frame.directive.ts:101`, `src/app/shared/windows/directives/window-frame.directive.ts:143`
3. Tracker listens bar/edge pointerdown and window resize — `src/app/shared/windows/trackers/window-frame.tracker.ts:61`
4. Grab creates WindowDragTracker — `src/app/shared/windows/trackers/window-frame.tracker.ts:193`
5. Drag clamps move/resize, shows snap outline — `src/app/shared/windows/trackers/window-drag.tracker.ts:67`
6. Drop lands: snap or commit free — `src/app/shared/windows/trackers/window-frame.tracker.ts:180`
7. Directive host binds transform/width/height/data-frame — `src/app/shared/windows/directives/window-frame.directive.ts:55`

## F6 cycle

1. keydown via BrowserWindowService — `src/app/shared/windows/directives/window-cycle.directive.ts:14`
2. target from shown windows front to back — `src/app/shared/windows/services/window-stack.service.ts:47`
3. focus `[data-window-title]` — `src/app/shared/windows/directives/window-cycle.directive.ts:28`

## Window body padding set by the content

1. Feature host sets `--window-body-padding` on a `display: contents` host — `src/app/features/projects/components/project-list/project-list.component.scss:5-8`
2. `app-window` host is `display: contents` too, so the property inherits through — `src/app/shared/windows/components/window/window.component.scss:6`
3. `.body` reads it with a fallback — `src/app/shared/windows/components/window/window.component.scss:104` ; overflow/overscroll the same way from the page slot — `src/app/pages/observatory/observatory-page.component.scss:151`, `src/app/pages/observatory/observatory-page.component.scss:188`
4. pager.in-window then inherits that overflow (`overflow-y: inherit`) — `src/assets/styles/mixins/_pager.scss:20`, `src/assets/styles/mixins/_pager.scss:29`

## Phone index swipe (CSS side)

1. SwipeStepsService writes `--swipe-pane` / `--swipe-t` inline on the `app-window` carrying `[appSwipeSteps]` — `src/app/shared/mobile-nav/services/swipe-steps.service.ts:199-205`, `src/app/features/projects/components/project-list/project-list.component.html:1-2`
2. `.rows` (projected `body`) reads them, phone only — `src/app/features/projects/components/project-list/project-list.component.scss:145-152`
3. End of gesture removes both properties — `src/app/shared/mobile-nav/services/swipe-steps.service.ts:210`

## Featured bar arrival

1. Host attribute from the `arrival` input — `src/app/features/projects/components/featured-bar/featured-bar.component.ts:41`, `src/app/features/projects/components/featured-bar/featured-bar.component.ts:50`
2. timed: `rise` at `--arrival-at + 400ms` over 1300 ms — `src/app/features/projects/components/featured-bar/featured-bar.component.scss:11`, `src/assets/styles/mixins/_arrival.scss:10` ; `@keyframes rise` at `src/assets/styles/_motion.scss:1` ; `--arrival-at: 8700ms` at `src/assets/styles/_tokens.scss:65`, also read by TS `src/app/features/observatory/services/home-reveal.service.ts:49`
3. withheld / shown — `src/app/features/projects/components/featured-bar/featured-bar.component.scss:21`, `src/app/features/projects/components/featured-bar/featured-bar.component.scss:25`

## Window stacking and frame animation (CSS side)

1. `--stack` bound by StackedWindowDirective — `src/app/shared/windows/directives/stacked-window.directive.ts:14` ; read by the slot z-index — `src/app/pages/observatory/observatory-page.component.scss:81`, `src/app/pages/observatory/observatory-page.component.scss:97`, `src/app/pages/observatory/observatory-page.component.scss:108`
2. `data-frame-animating` bound by WindowFrameDirective — `src/app/shared/windows/directives/window-frame.directive.ts:60` ; global transition 280 ms — `src/assets/styles/_base.scss:73-78`

## Back closes an overlay (stacked mode)

1. Overlay opens: `ActionMenuComponent.show` calls `backLayers.push` — `src/app/shared/mobile-nav/components/action-menu/action-menu.component.ts:116`
2. Layer stacked, history entry pushed with depth — `src/app/shared/mobile-nav/services/back-layers.service.ts:76-82`
3. Browser Back pops; `popped` reads depth, closes layers above — `src/app/shared/mobile-nav/services/back-layers.service.ts:191-202`
4. Closing from UI instead goes back `stepsBack` and swallows the pop — `src/app/shared/mobile-nav/services/back-layers.service.ts:113-121`
5. Leaving the page drops all layers via `onLeave` — `src/app/shared/mobile-nav/services/back-layers.service.ts:141`

## Bottom sheet drag to detent

1. Touch start -> `ScrollReleaseDirective.pressed` — `src/app/shared/mobile-nav/directives/scroll-release.directive.ts:96`
2. Lift off -> `released{speed,pull}` — `src/app/shared/mobile-nav/directives/scroll-release.directive.ts:109`
3. `letGo` computes target detent or dismissal — `src/app/shared/mobile-nav/components/bottom-sheet/bottom-sheet.component.ts:151-169`
4. `head` scrolls rail to the stop, `commit` writes CSS vars and `detent` model — `src/app/shared/mobile-nav/components/bottom-sheet/bottom-sheet.component.ts:223`, `src/app/shared/mobile-nav/components/bottom-sheet/bottom-sheet.component.ts:276`
5. `BackClaimService` claims Back when detent becomes full — `src/app/shared/mobile-nav/services/back-claim.service.ts:42-51`

## Scene engine creation

1. `SceneEngineService.create` tries remote first — `src/app/shared/space-scene/services/scene-engine.service.ts:38-45`
2. Remote needs `canDrawOffThread` and bitmap contexts, spawns `../engine/scene.worker` — `src/app/shared/space-scene/services/scene-engine.service.ts:133`, `src/app/shared/space-scene/services/animated-canvas.service.ts:51`
3. Else lazy-import local engine under a PendingTask — `src/app/shared/space-scene/services/scene-engine.service.ts:46-50`, `src/app/shared/space-scene/services/scene-engine.service.ts:85`
4. Commands crossing to the worker are typed by `SceneWorkerCommands` / `PASSED_COMMANDS` — `src/app/shared/space-scene/models/scene-worker.model.ts:32`, `src/app/shared/space-scene/models/scene-worker.model.ts:59`
5. Look (zoom/sky) started on the engine by format — `src/app/shared/space-scene/services/scene-look.service.ts:36`

## Focus after navigation

1. Heading registers after render — `src/app/shared/ui/directives/view-heading.directive.ts:16`
2. Desktop claims a container — `src/app/shared/ui/services/view-focus.service.ts:24`
3. `settle` focuses the heading within it, or `[data-window-title]`, until focused or 2500 ms — `src/app/shared/ui/services/view-focus.service.ts:40-56`

## README.md — Les couches

- app.routes.ts declares each view in both languages with its view in data and its head from the page-head resolver functions — `src/app/app.routes.ts:17` — origin: README.md:63 @ b299e1d
- app.routes.server.ts prerenders one page per project through getPrerenderParams — `src/app/app.routes.server.ts:12` — origin: README.md:65 @ b299e1d

## README.md — SSR et prérendu

- provideAppInitializer waits for the projects so the prerendered HTML holds the content — `src/app/app.config.ts:48` — origin: README.md:167 @ b299e1d

## docs/architecture/organisation.md — 4.9 La racine

- Each route loads ObservatoryRouteComponent, declares its view in data and its heads through page-head — `src/app/app.routes.ts:20` — origin: docs/architecture/organisation.md:905 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `app.routes.ts`

- English unknown paths come before the bare wildcard — `src/app/app.routes.ts:53` — origin: docs/architecture/raisons/bureau-et-pages.md:324 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `app.routes.server.ts`

- One page per project and language, read from the same repository as the pages — `src/app/app.routes.server.ts:13` — origin: docs/architecture/raisons/bureau-et-pages.md:332 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/strategies/route-head.strategy.ts`

- Each route names itself by title and gives description and alternates; they arrive as resolvers (resolve: description, alternates) merged into route data, not as static data — `src/app/app.routes.ts:24` — origin: docs/architecture/raisons/core-et-interface.md:137 @ b299e1d
- A title that depends on content is a route resolver: sheet routes use sheetTitle as title — `src/app/app.routes.ts:33` — origin: docs/architecture/raisons/core-et-interface.md:142 @ b299e1d
- The strategy builds the head from title, data.description and data.alternates — `src/app/core/strategies/route-head.strategy.ts:10` — origin: docs/architecture/raisons/core-et-interface.md:137 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Le bilingue : un catalogue à l'exécution, l'adresse fixe la langue

- The initializer loads the first address catalogue and each route loads its own via loadCatalog — `src/app/i18n/providers/i18n.provider.ts:69` — origin: docs/architecture/decisions.md:156 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Les adresses : le français à la racine, l'anglais sous /en

- An unknown address stays unknown in the other language — `src/app/i18n/rules/paths.rules.ts:28` — origin: docs/architecture/decisions.md:183 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Le composant de route déclare la vue, la langue se dérive du routeur

- A single empty route component serves every view including the sheet — `src/app/pages/observatory/observatory-route.component.ts:23` — origin: docs/architecture/decisions.md:352 @ b299e1d
- Language derives from Router.lastSuccessfulNavigation — `src/app/core/services/i18n/locale.service.ts:12` — origin: docs/architecture/decisions.md:354 @ b299e1d
- The guard only loads the catalogue — `src/app/i18n/guards/catalog.guard.ts:6` — origin: docs/architecture/decisions.md:355 @ b299e1d
- Page heads read the catalogue of the target language — `src/app/i18n/resolvers/page-head.resolver.ts:17` — origin: docs/architecture/decisions.md:356 @ b299e1d

## docs/architecture/decisions.md — 2026-10-02 — Au téléphone, fermer remonte d'un cran sans ajouter d'entrée, et une feuille rétablie au plein redescend au retour (D96, amende D70, D91 et D94)

- SessionHistoryService.backTo reads entries via the Navigation API and goes back if the nearest other address is the parent — `src/app/core/services/history/session-history.service.ts:41` — origin: docs/architecture/decisions.md:2904 @ b299e1d
- D96: a sheet visible again at full retakes its back layer as soon as it is visible (ElementObserverService.onVisible), not only on a resize — `src/app/shared/mobile-nav/components/bottom-sheet/bottom-sheet.component.ts:200` — origin: docs/architecture/decisions.md:2907 @ b299e1d

## README.md — Déploiement et branches

- An .htaccess handles not-found pages, redirects, cache and compression — `public/.htaccess:3` — origin: README.md:55 @ b299e1d

## README.md — L'état

- State keeps a slug and the screen derives the project with manager.find(slug) — `src/app/features/projects/states/projects/projects.manager.ts:67` — origin: README.md:157 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Le catalogue des projets passe par un seul chemin

- Projects, facts and details are read in one go by ProjectsRepository.getCatalog() — `src/app/features/projects/services/projects-repository.service.ts:14` — origin: docs/architecture/decisions.md:56 @ b299e1d
- The catalog is carried by a single success action and held by the state — `src/app/features/projects/states/projects/projects.updater.ts:9` — origin: docs/architecture/decisions.md:57 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/services/view-focus.service.ts`

- On arrival focus goes to the view heading; each heading registers via appViewHeading and the desktop claims the one in the view container — `src/app/shared/ui/services/view-focus.service.ts:24` — origin: docs/architecture/raisons/core-et-interface.md:219 @ b299e1d
- The claim holds until the heading is there and is abandoned after 2500 ms (CLAIM_DEADLINE_MS) — `src/app/shared/ui/services/view-focus.service.ts:4` — origin: docs/architecture/raisons/core-et-interface.md:222 @ b299e1d
- The container is re-asked each time and a new claim replaces the previous one — `src/app/shared/ui/services/view-focus.service.ts:49` — origin: docs/architecture/raisons/core-et-interface.md:225 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/directives/view-heading.directive.ts`

- The heading registers once rendered, and only in a browser — `src/app/shared/ui/directives/view-heading.directive.ts:16` — origin: docs/architecture/raisons/core-et-interface.md:232 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Les navigations ne figent plus la page pour rien (D46)

- The focus() of ViewFocusService forces style and layout in the worst navigation frame (a focus call with preventScroll is there; the layout cost itself not measured here) — `src/app/shared/ui/services/view-focus.service.ts:53` — origin: docs/architecture/decisions.md:1515 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Au téléphone, « Contact » ouvre une feuille d'actions, et le retour la ferme d'abord (D60, amende D27)

- D60: back closes the sheet before the view: with CloseWatcher the dialog receives it ; without it BackLayersService pushes a history entry on the same address (line 81) and takes it back when the page closes (line 141) — `src/app/shared/mobile-nav/services/back-layers.service.ts:46` — origin: docs/architecture/decisions.md:1877 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au téléphone, une feuille se reconnaît, et le retour la baisse avant de quitter la page (D84, amende D57, D60 et D64)

- D84: BackLayersService.claim creates a CloseWatcher per layer where the browser has one (watch, line 55), a history entry elsewhere (stack) ; a router navigation releases the layer in both cases (onLeave, lines 69 and 141) — `src/app/shared/mobile-nav/services/back-layers.service.ts:49` — origin: docs/architecture/decisions.md:2586 @ b299e1d
- D84: push stays the dialog path (no-op when the browser closes on back) — `src/app/shared/mobile-nav/services/back-layers.service.ts:45` — origin: docs/architecture/decisions.md:2590 @ b299e1d

## docs/architecture/decisions.md — 2026-10-02 — Au téléphone, chaque onglet garde sa place, et le retour mène à l'accueil avant de quitter le site (D91, amende D57 et D62)

- D91: the tabs emit the chosen address (chosen output) instead of following a router link ; modified clicks still follow the link (line 37) — `src/app/shared/ui/components/main-nav/main-nav.component.ts:41` — origin: docs/architecture/decisions.md:2773 @ b299e1d

## docs/architecture/decisions.md — 2026-10-02 — Au téléphone, une navigation relâche la couche de retour d'une feuille sans la baisser (D94, amende D84)

- D94: BackLayersService.claim takes a second callback for navigation (onLeave) which releases without changing the detent (back-claim.service.ts:85) — `src/app/shared/mobile-nav/services/back-layers.service.ts:49` — origin: docs/architecture/decisions.md:2849 @ b299e1d
- D94: BackClaimService.follow tracks the sheet detent and visibility (wanted = active and full ; seen at line 72) — `src/app/shared/mobile-nav/services/back-claim.service.ts:38` — origin: docs/architecture/decisions.md:2850 @ b299e1d
- D94: a hidden sheet (zero height under content-visibility) never retakes a layer (retake only when clientHeight > 0) — `src/app/shared/mobile-nav/components/bottom-sheet/bottom-sheet.component.ts:243` — origin: docs/architecture/decisions.md:2848 @ b299e1d
- #208 (ends the D94 known limit): a sheet still drawn retakes its layer one frame after the navigation ends, is cancelled or fails, not only on the next resize — `src/app/shared/mobile-nav/services/back-claim.service.ts:60`
- #208: without a close watcher, the layer entries a cancelled or failed navigation leaves are adopted by the layers that retake them, and the rest is removed two frames later with one swallowed `history.back(n)`, so one layer never has two entries and no entry stays without a layer — `src/app/shared/mobile-nav/services/back-layers.service.ts:88`

## docs/architecture/decisions.md — 2026-10-03 — Après une navigation, le focus va au titre visible de la fenêtre (D100, complète D68)

- D100: after a navigation focus goes to the registered heading of the window if any, otherwise to its visible title [data-window-title] — `src/app/shared/ui/services/view-focus.service.ts:52` — origin: docs/architecture/decisions.md:2999 @ b299e1d
