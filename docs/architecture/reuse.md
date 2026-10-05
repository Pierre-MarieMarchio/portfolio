# Reusable units

knowledge-date: 2026-10-05
knowledge-commit: b299e1d

## .github/**,src/app/\*,src/app/features/observatory/**,src/app/features/profile/**,src/app/shared/space-scene/components/**

- `ObservatoryManager` — `src/app/features/observatory/states/observatory/observatory.manager.ts:35` — the only door to the observatory state (view, slug, pins, minimized, held sheets, preview, selection) and its commands; use from components/services/pages; never inject `ObservatoryState` (only updater/effect/manager do) — 9 callers
- `AnimationManager` — `src/app/features/observatory/states/animation/animation.manager.ts:8` — scene pause flag + `togglePause()`; use for the pause; not for reduced-motion (that is `MediaPreferencesService`) — 2 callers
- `ObservatoryEffect` — `src/app/features/observatory/states/observatory/observatory.effect.ts:17` — turns close/escape/step-back actions into navigation or follow-up actions; registered only in `provideStatewise` — 1 caller (`src/app/app.config.ts:43`)
- `OBSERVATORY_TEXTS` / `ObservatoryTexts` — `src/app/features/observatory/ports/observatory-texts.port.ts:45` — the observatory text slice as a `Signal`, answered by i18n; use for any observatory wording; no default factory — 11 callers (incl. i18n provider and test fixture)
- `PROFILE_TEXTS` / `ProfileTexts` — `src/app/features/profile/ports/profile-texts.port.ts:63` — the about/contact text slice as a Signal ; use for any profile wording ; no default factory — 5 callers
- `OBSERVATORY_IDS` — `src/app/features/observatory/models/observatory-ids.model.ts:1` — DOM ids referenced by markup and code (skip-link target `main`, home title, preview panel) ; use whenever code addresses an id ; not for ad-hoc ids — 3 callers
- `SCENE_ANCHORS` — `src/app/features/observatory/models/scene-anchors.model.ts:3` — literal map of anchor kinds except `line` ; use to tag a panel ; for scene anchor registration — 1 caller (page)
- `CONTACT_EMAIL` / `CONTACT_ADDRESSES` — `src/app/features/profile/data/contact.data.ts:3` — single source of the e-mail and the four contact links ; use for the identity/facts lists ; never hardcoded — 3 / 1 callers
- `COPY_ICON` — `src/app/features/profile/data/copy-icon.data.ts:1` — SVG path of the copy icon shared by desktop rail and phone sheet ; use for the copy button ; single shared source — 2 callers
- `CopyFeedbackService` — `src/app/features/profile/services/copy-feedback.service.ts:7` — copy a text through `ClipboardService` and expose `isCopied` for 4000 ms; provide per component (`providers: [...]`); note it is `@Service()` without `autoProvided: false`, unlike every other service of the zone — 2 callers
- `HomeRevealService` — `src/app/features/observatory/services/home-reveal.service.ts:15` — holds home content during the intro and releases it on presence or when leaving home; provided by the page — 2 callers
- `FeaturedTourService` — `src/app/features/observatory/services/featured-tour.service.ts:9` — the "curtain": hovers featured slugs one by one (4200 ms then 900 ms) until `takeOver()`; provided by the page — 1 caller
- `HomeBottomSheetService` — `src/app/features/observatory/services/home-bottom-sheet.service.ts:15` — phone home bottom-sheet detent, posed slug and index ; provide by the page ; when home interaction is needed — 2 callers
- `TabNavigationService` — `src/app/features/observatory/services/tab-navigation.service.ts:20` — phone tab history rules and desktop restore-on-tab ; provide by the page ; depends on HomeBottomSheetService and ViewWindowsService in the same injector — 1 caller
- `ViewWindowsService` — `src/app/features/observatory/services/view-windows.service.ts:35` — brings the view's window to the front of WindowStackService, claims focus after navigations, idle-mounts index/about ; use to manage window focus and visibility ; from view-slot registration — 3 callers
- `MobileNavLayoutService` — `src/app/features/observatory/services/mobile-nav-layout.service.ts:5` — implements `MobileNavLayout` from core display service ; provide as `MOBILE_NAV_LAYOUT` in the page ; never root — 1 caller
- `ProjectSheetService` — `src/app/features/observatory/services/project-sheet.service.ts:27` — counts sheet openings via linkedSignal ; use for sheet opening tracking ; internal to directive — 1 caller (its directive)
- `SceneSurroundingsService` — `src/app/features/observatory/services/scene-surroundings.service.ts:21` — answers `SCENE_SURROUNDINGS` from LayoutAnchorsService, mapping anchor kinds to scene panel roles ; use to expose scene surroundings ; internal to scene — 1 caller
- `ScrollEndService` — `src/app/shared/mobile-nav/services/scroll-end.service.ts:1` — settles scroll via scrollend event or 120 ms fallback ; use for pager, carousel, scroll-release ; scroll detection — 3 callers
- `HandleTapService` — `src/app/shared/mobile-nav/services/handle-tap.service.ts:1` — toggles bottom-sheet folded detent on grip tap ; provided by bottom-sheet only — 1 caller
- `ViewSlotDirective` (`appViewSlot`) — `src/app/features/observatory/directives/view-slot.directive.ts:6` — registers an element as the slot of a view window in ViewWindowsService ; use on view slot elements ; for window registration — 1 caller (page)
- `BottomSheetFoldDirective` (`app-bottom-sheet[appBottomSheetFold]`) — `src/app/features/observatory/directives/bottom-sheet-fold.directive.ts:9` — adapts a bottom sheet to WINDOW_FOLD ; use on sheet wrapping windows ; for fold support — 1 caller
- `ProjectSheetDirective` (`app-bottom-sheet[appProjectSheet]`) — `src/app/features/observatory/directives/project-sheet.directive.ts:9` — raises the sheet to full on each project opening ; use on project sheet ; for project interaction — 1 caller
- `SpaceSceneComponent` (`app-space-scene`) — `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:56` — boots/stops the scene engine, feeds it bodies, direction, figure names, layout ; use as the scene host ; the only component of the library — 1 caller (`ObservatorySceneComponent`)
- `loadHoleFocus` — `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:47` — lazy import of phone hole-focus rules ; use for phone scenes ; loaded dynamically — 3 callers (worker, worker engine, fixture)
- `ObservatorySceneComponent` — `src/app/features/observatory/components/observatory-scene/observatory-scene.component.ts:30` — translates observatory inputs into SceneDirection/SceneBody and projects planet buttons ; use as scene translator ; internal integration — 1 caller
- `NotFoundWindowComponent`, `HomeTitleComponent`, `IntroCardComponent`, `IntroSkipComponent`, `AnimationToggleComponent`, `ObservatoryDockComponent` — `src/app/features/observatory/components/index.ts:1` — screen pieces, one per component ; use as page components ; internal to page — 1 caller each (page)
- `PlanetButtonsComponent` — `src/app/features/observatory/components/planet-buttons/planet-buttons.component.ts:15` — invisible accessible buttons registered as scene targets ; use for planet interaction ; target registration — 1 caller
- `AboutWindowComponent`, `ContactLinksComponent` — `src/app/features/profile/components/index.ts:1` — profile window and contact list ; use as page components ; internal to page — 1 caller each (page); `ContactMenuComponent` — `src/app/features/profile/components/contact-menu/contact-menu.component.ts:19` — not exported by the barrel ; use for contact actions ; internal to ContactLinksComponent — 1 caller
- Pure rules: `viewAtAddress`, `closeLabelsOf`, `sheetOnShowOf` (`src/app/features/observatory/rules/view.rules.ts:130`, `src/app/features/observatory/rules/view.rules.ts:42`, `src/app/features/observatory/rules/view.rules.ts:158`) — 1 caller each (page); `sheetWindowsOf` (`src/app/features/observatory/rules/sheet-windows.rules.ts:86`) — 1 (page); `handOverSheet` (`src/app/features/observatory/rules/sheet-windows.rules.ts:55`) — 1 (updater); `sheetIdOf` (`src/app/features/observatory/rules/sheet-windows.rules.ts:44`) — 1; `homeDetentAfter`/`posedSlugOf` (`src/app/features/observatory/rules/home-bottom-sheet.rules.ts:3`, `src/app/features/observatory/rules/home-bottom-sheet.rules.ts:13`) — 1 each; `TABS`/`tabOf`/`tabOfWindow`/`windowsOfTab` (`src/app/features/observatory/rules/tabs.rules.ts:5`) — 1 each; `sceneDirectionOf`/`sceneBodiesOf` (`src/app/features/observatory/rules/scene-direction.rules.ts:34`, `src/app/features/observatory/rules/scene-direction.rules.ts:116`) — 1 each
- `hydrationProviders` — `src/app/app.config.ts:25` — providers list exported for testing ; use in app.config tests ; production inert — 0 production callers
- `provideTexts` — `src/testing/fixtures/texts.fixture.ts:12` — provides every text port (SHARED, WINDOW, MOBILE_NAV, PROJECTS, OBSERVATORY, PROFILE, PAGES) as a signal of the French catalogue `FR`, plus `LINKS` built on `pathOf(…, 'fr')`; use in any spec that renders a component reading a text port; not for English assertions (French only, `src/testing/fixtures/texts.fixture.ts:7`, `src/testing/fixtures/texts.fixture.ts:23`) — all 30 / zone 14
- `stubMedia` — `src/testing/doubles/browser.double.ts:19` — stubs global `matchMedia` with a predicate or a `Set` of matching queries; returns a trigger to fire change listeners; use to put a spec on phone/touch/reduced-motion; restore with `vi.unstubAllGlobals()` — all 16 / zone 8
- `resizeTo` — `src/testing/doubles/browser.double.ts:10` — stubs `innerWidth`/`innerHeight` then dispatches `resize` (or the given event); use to switch display format — all 9 / zone 4
- `stubViewport` — `src/testing/doubles/browser.double.ts:5` — stub innerWidth/innerHeight without dispatch ; use when format change event is not needed ; faster than resizeTo — all 9 / zone 2
- `stubObservers` — `src/testing/doubles/browser.double.ts:51` — replaces ResizeObserver and IntersectionObserver with recorders ; use to mock observers ; `resizeObserved` fires the resize ones — all 5 / zone 1 (resizeObserved: all 3 / zone 0)
- `stubDialogs` / `restoreDialogs` — `src/testing/doubles/browser.double.ts:89`, `src/testing/doubles/browser.double.ts:105` — define showModal/close on HTMLDialogElement.prototype and delete them ; use in pairs in beforeEach/afterEach ; for dialog testing — all 3 / zone 2 each
- `provideMobileNavLayout` / `MobileNavLayoutDouble` — `src/testing/doubles/mobile-nav-layout.double.ts:10`, `src/testing/doubles/mobile-nav-layout.double.ts:4` — in-memory MOBILE_NAV_LAYOUT with compact signal ; use to mock navigation layout ; for mobile nav testing — all 6 / zone 2
- `ClockDouble` — `src/testing/doubles/browser-services.double.ts:8` — frame and after timers without real time ; use for timer testing ; frame stepping — 3 callers
- `ElementObserverDouble` — `src/testing/doubles/browser-services.double.ts:44` — mocks resize, intersection, snap-change and whenStill ; use for observer mocking ; visibility testing — 3 callers
- `MediaPreferencesDouble` — `src/testing/doubles/browser-services.double.ts:1` — stubs reducedMotion, hover and coarse-pointer ; use for motion/hover testing — 2 callers
- `HapticsDouble` — `src/testing/doubles/browser-services.double.ts:1` — stubs vibrate ; use for haptics testing — 1 caller
- `BrowserWindowDouble` — `src/testing/doubles/browser-services.double.ts:1` — stubs size and supportsEvent ; use for event capability testing — 2 callers
- `HistoryStackDouble` — `src/testing/doubles/session-history.double.ts:56` — mocks history stack entries and position ; use for history testing — 1 caller
- `SessionHistoryDouble` / `provideSessionHistoryDouble` — `src/testing/doubles/session-history.double.ts:4`, `src/testing/doubles/session-history.double.ts:52` — records pushes, replaces and back steps instead of SessionHistoryService ; use to record history ; for zone specs — all 2 / zone 2 (both callers are zone specs)
- `provideRecordingRouter` — `src/testing/fixtures/observatory.fixture.ts:5` — Router whose navigateByUrl pushes the url into an array and resolves true ; use when only target URL matters ; not for navigate/events — all 2 / zone 2
- `stillObservatory` — `src/testing/fixtures/observatory.fixture.ts:37` — stubs media, nulls getContext, and sets --arrival-at from ARRIVAL_AT.css ; use for observatory setup ; common baseline — all 3 / zone 0
- `recordOutput` — `src/testing/fixtures/testbed.fixture.ts:23` — subscribes to an OutputRef and returns the array of emitted values ; use to record outputs ; for output testing — all 12 / zone 3
- `componentOf` — `src/testing/fixtures/testbed.fixture.ts:31` — finds a child component instance by type in a fixture ; use to locate components in fixture ; for component lookup — all 7 / zone 2
- `onPlatform` / `Platform` — `src/testing/fixtures/testbed.fixture.ts:12`, `src/testing/fixtures/testbed.fixture.ts:10` — sets PLATFORM_ID to browser or server used for prerender inertness ; use for platform-specific tests ; for prerender behavior — all 3 / zone 1
- `recordingContext` — `src/testing/doubles/recording-canvas.double.ts:19` — canvas 2D context double recording calls ; use to mock canvas ; for drawing verification — all 3 / zone 1
- `pointer` — `src/testing/fixtures/pointer.fixture.ts:11` — builds a pointer event ; use for pointer events ; other helpers (tap, drag, touch, swipe, firePointer) are not zone imports — all 2 / zone 1
- `formats` (`phone`, `phone-landscape`, `tablet`, `can-hover`, `coarse-pointer`) — `src/assets/styles/mixins/_formats.scss:5` — media queries of the display formats with thresholds $phone-width-below: 620px and 500px with coarse pointer ; use for responsive rules ; thresholds couple with display-format.rules.ts — all 21 / zone 7
- `type` (`mono`, `caps`, `title`) — `src/assets/styles/mixins/_type.scss:1`, `src/assets/styles/mixins/_type.scss:7`, `src/assets/styles/mixins/_type.scss:13` — typography families and tracking ; use for text styling ; font styles — all 15 / zone 7
- `controls` (`glass`, `divider`, `marker`, `icon-button`, `next-link`) — `src/assets/styles/mixins/_controls.scss:4`, `src/assets/styles/mixins/_controls.scss:10`, `src/assets/styles/mixins/_controls.scss:17`, `src/assets/styles/mixins/_controls.scss:35`, `src/assets/styles/mixins/_controls.scss:169` — visual control patterns ; use for interactive elements ; button, link, and control styles — all 16 / zone 6
- `motion` (`reduced`) — `src/assets/styles/mixins/_motion.scss:1` — prefers-reduced-motion media block ; use for motion sensitivity ; accessibility — all 13 / zone 3
- `arrival` (`on-its-own`, `held`, `shown`) — `src/assets/styles/mixins/_arrival.scss:9`, `src/assets/styles/mixins/_arrival.scss:13`, `src/assets/styles/mixins/_arrival.scss:23` — animations keyed on var(--arrival-at) ; use for timed reveals ; entrance animations — all 4 / zone 1 (home-title)
- `facts` (`term`, `value`) — `src/assets/styles/mixins/_facts.scss:9`, `src/assets/styles/mixins/_facts.scss:13` — dl row styling with term and value ; use for identity/facts lists ; data display — all 3 / zone 1 (about-window)
- `pager` (`in-window`) — `src/assets/styles/mixins/_pager.scss:15` — full-width pager styling and scroll behavior ; use for page carousels ; in windows — all 2 / zone 1 (about-window)
- Local mixin `sky-takes-the-hand` — `src/app/shared/space-scene/components/space-scene/space-scene.component.scss:33` — scene hand styling applied on phone and tablet ; use for scene hand display ; phone/tablet only — 1 file

## _,.husky/_,docs/**,src/app/shared/space-scene/directives/\*,src/app/shared/space-scene/rules/**,src/testing/**

- `SceneTargetDirective` — `src/app/shared/space-scene/directives/scene-target.directive.ts:9` — registers the host element in SceneTargetsService for the life of the view and stamps data-scene-target ; use on elements standing for scene bodies in document order ; not for figures which use data-scene-figure — 1 caller, the only export of the barrel
- `TurnGestureDirective` — `src/app/shared/space-scene/directives/turn-gesture.directive.ts:25` — window-level capture pointerdown → grab/turn/release on TurnableScene, sets cursor, absorbs drag ending click ; use on the stage hosting the engine ; for scene interaction — 1 caller
- `sceneState`/`NO_STATE`/`isCloseUp`/`isAtRest` — `src/app/shared/space-scene/rules/scene-state.rules.ts:78` — derives the per-frame SceneState from SceneInputs ; use for frame state ; scene animation — 12 prod (7 inside rules), 4 specs
- `sceneFrame`/`SceneFrame` — `src/app/shared/space-scene/rules/scene-frame.rules.ts:99` — mutable per-frame record with veil closure ; use for frame state ; animation frames — 17 prod, 0 specs
- `canvasResolution` — `src/app/shared/space-scene/rules/canvas-resolution.rules.ts:16` — pixel ratio capped by format and pixel budget ; use for canvas sizing ; device format adaptation — 1 prod, 1 spec
- `sceneLayout`/`isBottomBand` — `src/app/shared/space-scene/rules/scene-layout.rules.ts:66`, `src/app/shared/space-scene/rules/scene-layout.rules.ts:21` — layout and panel positioning ; use for layout geometry ; scene layout — 1 prod, 3 specs
- `placeOrbits`/`fitOrbits`/`positionOrbit`/`ORBIT_REFERENCE_COUNT` — `src/app/shared/space-scene/rules/scene-bodies.rules.ts:49`, `src/app/shared/space-scene/rules/scene-bodies.rules.ts:194`, `src/app/shared/space-scene/rules/scene-bodies.rules.ts:221` — orbit placement and reference ; use for body layout ; scene geometry — 12 prod, 1 spec
- `panelZones`/`veilAt`/`isUnderPanel` — `src/app/shared/space-scene/rules/panel-veil.rules.ts:11`, `src/app/shared/space-scene/rules/panel-veil.rules.ts:44`, `src/app/shared/space-scene/rules/panel-veil.rules.ts:66` — panel veil and zone mapping ; use for panel occlusion ; scene panels — 8 prod, 0 specs
- `skyRooms`/`holeInFocus` — `src/app/shared/space-scene/rules/hole-focus.rules.ts:54`, `src/app/shared/space-scene/rules/hole-focus.rules.ts:114` — phone-only, loaded by dynamic import ; use for phone focus ; loaded lazily with phoneFigures — 2 prod, 3 specs
- `canMoveLayout` — `src/app/shared/space-scene/rules/layout-change.rules.ts:3` — layout stability check ; use to prevent invalid layout moves ; scene layout — 1 prod, 1 spec
- `onPlatform`/`injectOn`/`recordOutput`/`componentOf`/`at`/`tupleOf` — `src/testing/fixtures/testbed.fixture.ts:12-50` — TestBed helpers where at and tupleOf throw ; use for TestBed setup ; pairs with noUncheckedIndexedAccess — 34 importers
- `provideTexts` — `src/testing/fixtures/texts.fixture.ts:12` — every text port with the FR catalogue + LINKS ; use in any component spec needing words ; not for i18n loading tests — 30 importers
- `stubViewport`/`resizeTo`/`stubMedia`/`stubObservers`/`stubDialogs`/`restoreDialogs` — `src/testing/doubles/browser.double.ts:5-105` — browser globals via vi.stubGlobal requiring cleanup ; use for browser mocking ; restore in afterEach — 32 importers
- `MobileNavLayoutDouble`/`provideMobileNavLayout` — `src/testing/doubles/mobile-nav-layout.double.ts:4`, `src/testing/doubles/mobile-nav-layout.double.ts:10` — in-memory mobile nav layout ; use for nav testing ; compact signal — 6 importers
- `sampleProject`/`provideProjects`/`loadProjects` — `src/testing/fixtures/project.fixture.ts:19-110` — projects built with real rank() and manager ; use for project testing ; real factory — 11 importers
- `pointer`/`tap`/`drag`/`heardClicks`/`touch`/`swipe` — `src/testing/fixtures/pointer.fixture.ts:11-131` — pointer event builders ; use for gesture testing ; interaction events — 9 importers
- `mountEngineScene`/`ENGINE_OPTIONS`/`SCENE_INPUTS`/`WIDE_LAYOUT` — `src/testing/fixtures/engine-scene.fixture.ts:99`, `src/testing/fixtures/engine-scene.fixture.ts:19` — scene engine test setup ; use for engine testing ; pre-configured layout — 5 importers
- `drivenHost`/`FRAME_MS` — `src/testing/doubles/driven-host.double.ts:12` — clock advances only when the spec fires ; use for manual frame stepping ; deterministic timing — 5 importers
- `ROOM`/`chromeLayout`/`holeOf`/`UPRIGHT_*` — `src/testing/fixtures/scene-layout.fixture.ts:8-54` — scene layout constants ; use for layout testing ; room geometry — 5 importers
- `ARRIVAL_AT`/`INTRO_DURATION`/`provideRecordingRouter`/`stillObservatory` — `src/testing/fixtures/observatory.fixture.ts:24`, `src/testing/fixtures/observatory.fixture.ts:25`, `src/testing/fixtures/observatory.fixture.ts:27`, `src/testing/fixtures/observatory.fixture.ts:37` — observatory test fixtures ; use for observatory testing ; timing constants and preset media — 5 importers
- `recordingContext`/`fingerprintOf` — `src/testing/doubles/recording-canvas.double.ts:19`, `src/testing/doubles/recording-canvas.double.ts:6` — canvas context double with golden fingerprints ; use for canvas testing ; visual verification — 4 importers
- `seededRandom` — `src/testing/doubles/seeded-random.double.ts:1` — LCG pseudorandom ; use for deterministic randomness ; seeded reproduction — 4 importers
- `LookableSceneDouble`/`windowEvents` — `src/testing/doubles/scene-look.double.ts:6`, `src/testing/doubles/scene-look.double.ts:36` — scene look mocking ; use for scene testing ; window events — 2 importers
- `SessionHistoryDouble`/`provideSessionHistoryDouble` — `src/testing/doubles/session-history.double.ts:4`, `src/testing/doubles/session-history.double.ts:52` — history recorder instead of service ; use for history testing ; push/replace/back recording — 2 importers
- `pairedScene` — `src/testing/fixtures/scene-worker.fixture.ts:49` — paired worker/local scene ; use for worker testing ; dual engine setup — 1 importer

## src/app/core/**,src/app/i18n/**,src/app/pages/**,src/app/shared/space-scene/engine/**,src/app/shared/space-scene/trackers/*

- `clamp` / `clamp01` / `finiteOr` — `src/app/core/helpers/number.helper.ts:1` — clamp a number to a range; NaN guard (`finiteOr`, :6) ; use for any bounded or possibly non-finite value ; when not to: not established — 21 / 1 / 5 callers
- `TAU`, `nearestTurn`, `onCurrentTurn` — `src/app/core/helpers/angle.helper.ts:1` — TAU is rounded to 6.2832, not Math.PI*2 ; shortest-turn azimuth and re-basing a target on the current turn ; for camera and turntable angles — 7 / 4 / 1 callers
- `halfLifeStep`, `easeOut`, `smoothstep`, `progress` — `src/app/core/helpers/easing.helper.ts:3` — easing that does not depend on frame rate (`halfLifeStep` :10) ; use instead of a fixed lerp factor — 5 / 1 / 3 / 1 callers
- `gaussian` — `src/app/core/helpers/random.helper.ts:1` — polar Box-Muller staying deterministic ; use for random sampling ; seeded randomness — 1 caller
- `twoDigits` — `src/app/core/helpers/format.helper.ts:1` — zero-pads counts and ranks ; use for display format ; numeric padding — 8 callers
- `isOnControl` — `src/app/core/helpers/event.helper.ts:1` — true when event target is inside button or link ; use for click filtering ; control detection — 2 callers
- `langOfUrl` / `prefixedPath` / `unprefixedSegments` / `LANGS` / `DEFAULT_LANG` — `src/app/core/models/lang.model.ts:12` — language from the address; the only prefix table is `LANG_PREFIXES` :7 — 5 / 4 / 1 / 6 / 1 callers
- `bilingual` / `localize` — `src/app/core/rules/localize.rules.ts:22` — content text marked with kind 'bilingual'; localize resolves only marked values (:26, :41) — 2 / 2 callers
- `draft` / `draftsLeft` / `forgetDraftsAfter` — `src/app/core/rules/draft.rules.ts:3` — module-level registry of unreviewed EN texts (global mutable array :1; specs must restore it) — draft 3 callers
- `displayFormatOf` — `src/app/core/rules/display-format.rules.ts:19` — pure phone/tablet/desktop decision ; use for format logic ; display rules — 1 caller (DisplayFormatService)
- `SITE_NAME` — `src/app/core/ports/site-name.port.ts:3` — the site name injected into core ; use for identity ; site branding — 2 callers
- `BrowserWindowService` — `src/app/core/services/browser/browser-window.service.ts:5` — size, supportsEvent, `on()` returns an unsubscribe ; no-op on the server — 10 callers
- `ClockService` — `src/app/core/services/browser/clock.service.ts:8` — now, nextFrame (rAF), after (setTimeout), whenIdle (falls back to 200 ms) ; inert on the server, now() returns 0 — 10 callers
- `MediaPreferencesService` — `src/app/core/services/browser/media-preferences.service.ts:8` — reducedMotion true on server, hover/coarse false ; use for a11y ; motion and hover — 9 callers
- `ElementObserverService` — `src/app/core/services/browser/element-observer.service.ts:9` — resize, intersection, scrollsnapchanging, whenStill ; use for DOM observation ; visibility monitoring — 6 callers
- `DocumentStylesService` — `src/app/core/services/browser/document-styles.service.ts:7` — reads CSS tokens, durations, fontsReady ; use for style values ; design tokens — 4 callers
- `CursorService` — `src/app/core/services/browser/cursor.service.ts:5` — 2 callers ; `CanvasContextsService` :5 of canvas-contexts.service.ts — 1 caller ; `PageVisibilityService` (page-visibility.service.ts:5; isHidden is true on the server) — 1 caller ; `HapticsService` (haptics/haptics.service.ts:5) — 1 caller ; `ClipboardService` (clipboard/clipboard.service.ts:5) — 1 caller
- `DisplayFormatService` — `src/app/core/services/device/display-format.service.ts:26` — `format` signal ; `publishOnRoot` writes data-format once, browser only (:70) — 17 callers
- `FormatCodeService` — `src/app/core/services/device/format-code.service.ts:14` — lazy import once format matches, retried on failure ; use for conditional code ; format-specific loading — 3 callers
- `SessionHistoryService` — `src/app/core/services/history/session-history.service.ts:16` — history and Navigation API with backTo and CloseWatcher ; use for navigation ; history stack — 4 callers
- `UserPresenceService` — `src/app/core/services/presence/user-presence.service.ts:11` — runs a callback on the first real gesture or at a timeout; at once under reduced motion — 2 callers
- `LocaleService` — `src/app/core/services/i18n/locale.service.ts:7` — path and lang computed from the router ; writes `<html lang>` :20 — 5 callers
- `DocumentHeadService` — `src/app/core/services/head/document-head.service.ts:23` — only writer of title, meta, canonical/hreflang ; use for page metadata ; head updates — 1 caller (RouteHeadStrategy)
- `RouteHeadStrategy` — `src/app/core/strategies/route-head.strategy.ts:7` — TitleStrategy reading deepest description and alternating ; use for page titles ; route-based strategy — 1 caller (app.config.ts:40)
- `ConsoleErrorHandlerService` — `src/app/core/services/errors/console-error-handler.service.ts:4` — error logging service ; use for error handling ; console output — 1 caller (app.config.ts:31)
- `CatalogLoaderService` — `src/app/i18n/services/catalog-loader.service.ts:12` — lazy FR/EN catalogue throws before load ; use for i18n loading ; catalogue management — 3 callers
- `pathOf` / `translatePath` — `src/app/i18n/rules/paths.rules.ts:9` / :14 — path rules for routing ; use for localized paths ; route translation — 4 / 2 callers
- `PATHS` — `src/app/i18n/data/paths.data.ts:19` — i18n path catalogue ; use for route localization ; app.routes reference — 3 callers (includes app.routes.ts:19)
- `ViewLinksService` — `src/app/i18n/services/view-links.service.ts:10` — nav items, language items, view routes ; use for navigation ; localized links — 1 caller
- `provideI18n` — `src/app/i18n/providers/i18n.provider.ts:37` — i18n provider setup ; use in app config ; initialization — 1 caller (app.config.ts:46)
- `loadCatalog`, `viewTitle`, `sheetTitle`, `alternates` — `src/app/i18n/guards/catalog.guard.ts:6`, `src/app/i18n/resolvers/page-head.resolver.ts:20` — route guards and resolvers ; use for routing ; app.routes integration
- `FrameLoopEngine` — `src/app/shared/space-scene/engine/frame-loop.engine.ts:13` — frame animation loop ; use for animation timing ; engine driver — 1 caller
- `SpaceSceneEngine` — `src/app/shared/space-scene/engine/space-scene.engine.ts:51` — main scene engine interface ; use as engine entry ; 6 file references
- `RemoteSceneEngine` / `SceneWorkerEngine` / `NodeRecorderEngine` — `src/app/shared/space-scene/engine/remote-scene.engine.ts:69` / `src/app/shared/space-scene/engine/scene-worker.engine.ts:35` / `src/app/shared/space-scene/engine/node-recorder.engine.ts:87` — scene engine implementations ; use as engine variants ; remote/worker/recorder — 2 / 2 / 1
- `SkyPanMotion` — `src/app/shared/space-scene/engine/motions/sky-pan.motion.ts:8` — 3 callers ; `SkyLookTracker` (trackers/sky-look.tracker.ts:144) 1 ; `ZoomGestureTracker` (trackers/zoom-gesture.tracker.ts:253) 1
- `SceneRenderer` — `src/app/shared/space-scene/engine/renderers/scene.renderer.ts:32` — owns every renderer; draw order fixed at :64-71 (clear matter → grains → orbits → planets → comets → sky → hole mark) ; the single place a new layer is plugged ; not for drawing outside the engine — 1 caller (space-scene.engine.ts)
- `SceneMotion` — `src/app/shared/space-scene/engine/motions/scene.motion.ts:17` — composes camera, zoom, hover, grains, clock; `advance` order :86-90, `lay` order :93-104 ; the engine's only motion entry — 2 callers (space-scene.engine.ts, scene.renderer.ts)
- `CameraMotion` — `src/app/shared/space-scene/engine/motions/camera.motion.ts:69` — eases pose (roll, scale, camX, camY, elev, azim, marks, figures) toward a target Frame with halfLifeStep 0.55 s (:163), rest frame with 0.75 s (:257); pose starts NaN and is seeded from the first aim (:70, :230) — 4 callers
- `ZoomMotion` — `src/app/shared/space-scene/engine/motions/zoom.motion.ts:22` — pinch/stretch/double-tap zoom toggle with optional pan ; use for zoom control ; gesture handling — 1 caller (scene.motion.ts)
- `ClockMotion` — `src/app/shared/space-scene/engine/motions/clock.motion.ts:13` — scene time, orbit phase, marks time, crossing pace; yields the orbit spin to a held disc (:100) — 1 caller
- `GrainsMotion` — `src/app/shared/space-scene/engine/motions/grains.motion.ts:13` — matter arrival, lit density, pointer push ; use for grains animation ; matter motion — 2 callers
- `StarFlowMotion` — `src/app/shared/space-scene/engine/motions/star-flow.motion.ts:108` — per-star placement for the sky: drift, parallax, bank, warp "flight" spread, smoothed velocity for trails ; writes into one reused `pass` object (:109) — 1 caller (star-sky.renderer.ts)
- `StarSkyRenderer` — `src/app/shared/space-scene/engine/renderers/sky/star-sky.renderer.ts:103` — stars + trails + pointer lensing ; rebuilds the field on any size change (:136) — 1 caller (sky.renderer.ts)
- `SkyRenderer` — `src/app/shared/space-scene/engine/renderers/sky/sky.renderer.ts:8` — adapts SceneFrame and camera pose to SkyCamera and constellations ; use for sky rendering ; background rendering — 1 caller
- `TrailBatchRenderer` — `src/app/shared/space-scene/engine/renderers/sky/trail-batch.renderer.ts:40` — phone-only trail batching into buckets ; use for trail rendering ; phone optimization — 1 caller
- `ConstellationsRenderer` — `src/app/shared/space-scene/engine/renderers/sky/constellations.renderer.ts:206` — draws constellations, names, and hit targets ; use for figure rendering ; constellation display — 2 callers
- `strokeFigure` / `drawFigureStars` / `nameFigure` — `src/app/shared/space-scene/engine/renderers/sky/figure-strokes.renderer.ts:46` / :95 / :110 — free functions over FigureInk ; use for figure drawing ; constellation functions — 1 caller each (constellations.renderer.ts)
- `FigureTargetsRenderer` — `src/app/shared/space-scene/engine/renderers/sky/figure-targets.renderer.ts:11` — writes figure hit node styles only on change ; use for target updates ; hit target rendering — 2 callers
- `CometsRenderer` — `src/app/shared/space-scene/engine/renderers/sky/comets.renderer.ts:245` — comet heads, two tails, names ; drawn on the matter canvas — 1 caller
- `GrainsRenderer` — `src/app/shared/space-scene/engine/renderers/grains.renderer.ts:25` — accretion-disc grain rendering with optimized reuse ; use for grains drawing ; particle rendering — 1 caller
- `OrbitsRenderer` — `src/app/shared/space-scene/engine/renderers/orbits.renderer.ts:38` — 84 samples per orbit with 7 depth levels ; use for orbit drawing ; orbital paths — 1 caller
- `PlanetsRenderer` — `src/app/shared/space-scene/engine/renderers/planets.renderer.ts:35` — places, repels, draws planets, drives frame aim ; use for planet drawing ; main object rendering — 1 caller
- `PlanetLabelsRenderer` — `src/app/shared/space-scene/engine/renderers/planet-labels.renderer.ts:76` — writes button/label/line DOM styles only when changed (`setStyle` :55); draws leader lines on the matter canvas — 2 callers
- `HoleMarkRenderer` — `src/app/shared/space-scene/engine/renderers/hole-mark.renderer.ts:16` — writes hole/disc/target attributes on stage node ; use for hole mark rendering ; scene markup — 1 caller

## public/_,scripts/_,src/*,src/app/features/projects/**,src/app/shared/windows/**,src/assets/**

- `WindowComponent` — `src/app/shared/windows/components/window/window.component.ts:42` — the window frame: title bar, toolbar/body/footer slots, controls, fold grip, hands section+bar to WindowFrameDirective ; use for any page window ; not for phone-only content that is not a window — 5 callers (project-list, project-detail, project-preview, about-window, not-found-window)
- `WindowControlsComponent` — `src/app/shared/windows/components/window-controls/window-controls.component.ts:13` — Minimize/Pin/frame controls/Close buttons ; used inside WindowComponent ; not standalone elsewhere — 1 caller (window.component.ts:26)
- `WindowGripComponent` — `src/app/shared/windows/components/window-grip/window-grip.component.ts:10` — phone sheet grip toggling WINDOW_FOLD ; only when a WINDOW_FOLD provider exists — 2 callers (window.component.ts:27, home-title.component.ts:14)
- `WindowFrameDirective` — `src/app/shared/windows/directives/window-frame.directive.ts:63` — desktop/tablet move, snap, resize, maximize; lazy code via FormatCodeService ; put on the window slot ; inert on phone (`src/app/shared/windows/directives/window-frame.directive.ts:87`) — 1 caller file, 4 uses (pages/observatory/observatory-page.component.html:45,71,101,142)
- `KeptWindowDirective` — `src/app/shared/windows/directives/kept-window.directive.ts:22` — keep window hidden with inert and content-visibility ; use for hidden windows ; window lifecycle — 2 caller files
- `StackedWindowDirective` — `src/app/shared/windows/directives/stacked-window.directive.ts:19` — register in stack, write --stack, bring to front on pointerdown/focusin ; needs WindowStackService provided — 1 caller file
- `WindowCycleDirective` — `src/app/shared/windows/directives/window-cycle.directive.ts:9` — F6 focus cycling between windows ; use for keyboard navigation ; focus management — 1 caller
- `WindowStackService` — `src/app/shared/windows/services/window-stack.service.ts:4` — z-order of ids; `autoProvided: false`, must be provided by the screen — 2 callers (view-windows.service.ts:18, observatory-page.component.ts:93/140)
- `RememberScrollDirective` + `ScrollMemoryService` — `src/app/shared/windows/directives/remember-scroll.directive.ts:14`, `src/app/shared/windows/services/scroll-memory.service.ts:4` — scroll position per key ; internal to WindowComponent (not in barrels) — 1 caller (window.component.html:40); ScrollMemoryService also deep-imported by about-window.component.spec.ts:9
- `DoublePressDirective` — `src/app/shared/windows/directives/double-press.directive.ts:31` — double click / double tap ; internal, not exported in directives/index.ts — 1 caller (window.component.ts:34)
- `WINDOW_FOLD` / `WINDOW_TEXTS` ports — `src/app/shared/windows/ports/window-fold.port.ts:10`, `src/app/shared/windows/ports/window-texts.port.ts:18` — no default value ; WINDOW_FOLD 2 callers (bottom-sheet-fold.directive.ts:3, home-title.component.ts:15); WINDOW_TEXTS 1 provider (i18n.provider.ts:15)
- window rules — `src/app/shared/windows/rules/window-frame.rules.ts:32` (clampMove, clampResize, areaOf, snapZoneOf, frameOfZone, unsnapAt, clearanceOf, fittedHeight) — pure geometry ; only trackers use them — 0 callers outside lib
- `ProjectsManager` — `src/app/features/projects/states/projects/projects.manager.ts:23` — projects ranked, featured, with find/detail/next methods ; use for project queries ; core manager — 3 non-test callers + 3 feature components
- `FEATURED` token — `src/app/features/projects/states/projects/projects.manager.ts:17` — featured count factory value ; use for featured limit ; manager configuration — 1 test caller
- `readProjectEntries` — `src/app/features/projects/rules/project-entry.rules.ts:259` — JSON factory for projects ; use for projects.data parsing ; factory initialization — 1 caller
- `rank` — `src/app/features/projects/rules/ranking.rules.ts:4` — project ranking algorithm ; use for project sorting ; ordering rule — 2 callers + deep import
- `restingPickOf` — `src/app/features/projects/rules/featured-pick.rules.ts:1` — featured project selection ; use for featured picking ; UI selection — 1 caller
- `rowLabel`/`positionOf`/`chapterTitle` — `src/app/features/projects/rules/project-labels.rules.ts:4` — not in rules/index.ts ; 4 internal callers (featured-bar, project-list, project-preview, project-detail)
- `PROJECTS_TEXTS` — `src/app/features/projects/ports/projects-texts.port.ts:54` — no default ; 1 provider (i18n.provider.ts:11)
- Formats mixin threshold coupling — `src/assets/styles/mixins/_formats.scss:1` and display-format.rules.ts:6 — shared 620px threshold ; note implicit coupling ; design constraint
- `type.mono` — `src/assets/styles/mixins/_type.scss:1` — mono family + size (default --m3) + --ls-mono tracking ; for any figure/data text ; not for caps labels (use caps) — 19 includes / 10 files (12 in zone)
- `type.caps` — `src/assets/styles/mixins/_type.scss:7` — mono + uppercase + --ls-caps, default --m1 ; for labels, tags, meta — 12 / 9 (7 in zone)
- `type.title` — `src/assets/styles/mixins/_type.scss:13` — caps with --ls-title, default --m2 ; window/section headings (window.component.scss:66, featured-bar:45, project-list columns :25) — 7 / 7 (3 in zone)
- `controls.glass` — `src/assets/styles/mixins/_controls.scss:4` — line border + --vitre background + backdrop-filter param (default --glass-blur) ; the window takes `--glass-blur-window` (window.component.scss:27) — 5 / 5 (1 in zone)
- `controls.marker` — `src/assets/styles/mixins/_controls.scss:17` — filled square marker of given size ; use for visual markers ; accent default — 6 / 5 (3 in zone)
- `controls.lit` — `src/assets/styles/mixins/_controls.scss:23` — hover look ink on --vitre-2 ; use for hover states ; also inside icon-button and tab — 3 / 3 external
- `controls.touch-target` — `src/assets/styles/mixins/_controls.scss:28` — min 44px touch target under coarse pointer ; use for touch sizing ; a11y — 4 / 4 external + 3 internal
- `controls.icon-button` — `src/assets/styles/mixins/_controls.scss:35` — square icon button with lit hover and touch target ; use for icon buttons ; control styling — 2 / 2
- `controls.tip` — `src/assets/styles/mixins/_controls.scss:125` — hidden tooltip box toggled by caller ; use for tooltips ; hover display — 1 / 1
- `controls.next-link` — `src/assets/styles/mixins/_controls.scss:169` — mono link underlined in accent with button reset ; use for next links ; navigation styling — 5 / 4
- `controls.divider` / `controls.tab` / `controls.rail-control` / `controls.rail-control-label` — `src/assets/styles/mixins/_controls.scss:10`, `src/assets/styles/mixins/_controls.scss:150`, `src/assets/styles/mixins/_controls.scss:73`, `src/assets/styles/mixins/_controls.scss:106` — structural controls ; use for control layout ; divider/tab/rail styling — 2 / 2 / 1 / 1 external
- `controls.rail-labeled` — `src/assets/styles/mixins/_controls.scss:67` — wide rail styling at 1280px+ ; use for desktop rail ; width-based layout — 0 external, 2 internal
- `facts.row` / `facts.term` / `facts.value` — `src/assets/styles/mixins/_facts.scss:1`, `src/assets/styles/mixins/_facts.scss:9`, `src/assets/styles/mixins/_facts.scss:13` — dl row (baseline flex, bottom line, padding param), fixed-width term, flexible value ; for the identity/facts lists — row 2/2 (both in zone: project-detail:41 at 9px, project-preview:53 at 7px), term 6/3 (2 in zone: 10ch, 9ch), value 5/3 (2 in zone)
- `formats.phone` — `src/assets/styles/mixins/_formats.scss:5` — width < 620px OR height < 500px with coarse pointer ; use for mobile styles ; breakpoint — 15 / 15 (4 in zone) + 1 in _pager
- `formats.phone-portrait` / `phone-landscape` / `short-phone-portrait` — `src/assets/styles/mixins/_formats.scss:12`, `src/assets/styles/mixins/_formats.scss:18`, `src/assets/styles/mixins/_formats.scss:24` — phone orientation formats ; use for orientation-specific styles ; portrait/landscape — 5/5, 6/6, 4/4
- `formats.handheld` / `formats.tablet` — `src/assets/styles/mixins/_formats.scss:30`, `src/assets/styles/mixins/_formats.scss:36` — device class formats ; use for device-based layouts ; handheld/tablet — 2/2, 2/2
- `formats.desktop` — `src/assets/styles/mixins/_formats.scss:42` — desktop format ; unused ; not applied anywhere — 0 callers anywhere in src
- `formats.beyond-phone` — `src/assets/styles/mixins/_formats.scss:66` — non-phone format rule ; use for non-mobile styles ; pager layout — 0 external, 1 internal
- `formats.can-hover` — `src/assets/styles/mixins/_formats.scss:48` — hover media query containing all hover rules ; use for hover effects ; interaction — 9 / 8 (5 in zone)
- `formats.coarse-pointer` — `src/assets/styles/mixins/_formats.scss:54` — coarse pointer media query ; use for touch sizing ; pointer capability — 4 / 4 external + 1 in touch-target
- `formats.short-screen` — `src/assets/styles/mixins/_formats.scss:60` — short screen height <= 640px ; use for short screens ; height constraint — 1 / 1
- `motion.reduced` — `src/assets/styles/mixins/_motion.scss:1` — prefers-reduced-motion block ; use for a11y ; motion removal — 12 / 12 (4 in zone) + 1 in _arrival
- `arrival.on-its-own` / `held` / `shown` — `src/assets/styles/mixins/_arrival.scss:9`, `src/assets/styles/mixins/_arrival.scss:13`, `src/assets/styles/mixins/_arrival.scss:23` — timed rises keyed on --arrival-at ; use for entrance animations ; hidden/shown states — 3/3 each (1 in zone)
- `pager.in-window` — `src/assets/styles/mixins/_pager.scss:15` — phone flex column pages with scroll-timeline fade ; beyond phone visibility toggle ; use for page carousels ; pager layout — 2 / 2
- window body hooks `--window-body-overflow`, `--window-body-overscroll`, `--window-body-padding` — `src/app/shared/windows/components/window/window.component.scss:102`, `src/app/shared/windows/components/window/window.component.scss:103`, `src/app/shared/windows/components/window/window.component.scss:104` — only styling inputs with fallback ; use for window body styling ; feature-set and app-level — fallback auto / contain / var(--s3) var(--s2)
- local units (not shared): mixin `lit-row` — `src/app/features/projects/components/project-list/project-list.component.scss:12` — per-component utilities not shared ; project-list/featured-bar/window ; for component-specific styling

## src/app/features/common/**,src/app/shared/mobile-nav/**,src/app/shared/space-scene/models/_,src/app/shared/space-scene/ports/_,src/app/shared/space-scene/services/*,src/app/shared/ui/**

- `LINKS` / `ILinks` — `src/app/features/common/ports/links.port.ts:3` — port giving home/index/about/sheet(slug) URLs ; use when a feature must build an address without importing i18n ; not for router navigation itself — 11 callers
- `SceneAnchorKind` — `src/app/features/common/models/scene-anchors.model.ts:1` — closed list of anchor kinds a feature registers for the scene ; use to tag a panel ; `src/app/features/observatory/models/scene-anchors.model.ts:4` maps all but `'line'` — 4 callers
- `MOBILE_NAV_LAYOUT` / `MobileNavLayout` — `src/app/shared/mobile-nav/ports/mobile-nav-layout.port.ts:7` — display format check (isCompact) for the library ; must be provided by the host (only `src/app/pages/observatory/observatory-page.component.ts:206`) ; no default — 9 callers
- `MOBILE_NAV_TEXTS` — `src/app/shared/mobile-nav/ports/mobile-nav-texts.port.ts:8` — `pageOf`, `close` words, a Signal ; provided by i18n — 5 callers
- `BottomSheetComponent` — `src/app/shared/mobile-nav/components/bottom-sheet/bottom-sheet.component.ts:48` — scroll-snapped sheet with detents folded/half/full, active only when `isCompact()` (:68) ; use for the phone glass ; not on desktop (inert there) — 3 callers
- `ActionMenuComponent` — `src/app/shared/mobile-nav/components/action-menu/action-menu.component.ts:34` — modal `<dialog>` action sheet, closes on back (:112), restores focus to opener (:130) ; ViewEncapsulation.None (:32) — 2 callers
- `ActionRowDirective` — `src/app/shared/mobile-nav/directives/action-row.directive.ts:11` — action menu row dismissing on click ; use for menu items ; unless keepsOpen — 1 caller
- `CardCarouselComponent` — `src/app/shared/mobile-nav/components/card-carousel/card-carousel.component.ts:43` — horizontal snap carousel with dots ; use for card carousels ; content projection — 1 caller
- `PagerComponent` / `PagerPageComponent` — `src/app/shared/mobile-nav/components/pager/pager.component.ts:47`, `src/app/shared/mobile-nav/components/pager-page/pager-page.component.ts:21` — full-width page swiper with inert non-current pages ; use for page swiping ; content carousel — 3 / 4 callers
- `PagerDotsComponent` — `src/app/shared/mobile-nav/components/pager-dots/pager-dots.component.ts:9` — dots companion ; not exported ; use for pagination indicators — 2 callers
- `ScrollReleaseDirective` — `src/app/shared/mobile-nav/directives/scroll-release.directive.ts:27` — turns touch+scroll into press/release/settled ; use for sheet interaction ; gesture to event — 1 caller (bottom sheet)
- `SwipeStepsDirective` / `loadSwipeSteps` — `src/app/shared/mobile-nav/directives/swipe-steps.directive.ts:21`, `src/app/shared/mobile-nav/directives/swipe-steps.directive.ts:15` — horizontal swipe between steps on compact, lazily loads SwipeStepsService ; use for swipe navigation ; step selection — 1 caller
- `BackLayersService` — `src/app/shared/mobile-nav/services/back-layers.service.ts:19` — stacks history entries so Back closes overlays first ; use for back navigation ; overlay management — 3 callers
- `BackClaimService` — `src/app/shared/mobile-nav/services/back-claim.service.ts:16` — per-sheet claim lowers detent on Back ; use for sheet back handling ; bottom-sheet integration — 1 caller
- rules `clampPage`, `pageAt`, `offsetOfPage`, `pageAfterSwipe` — `src/app/shared/mobile-nav/rules/pager.rules.ts:10` — pure pager maths ; use for page math ; carousel and swipe — 3 callers (clampPage)
- rules `stopsOf`, `detentAfter`, `isDismissedBy`, `speedOf` — `src/app/shared/mobile-nav/rules/bottom-sheet.rules.ts:23`, `src/app/shared/mobile-nav/rules/bottom-sheet.rules.ts:87`, `src/app/shared/mobile-nav/rules/bottom-sheet.rules.ts:125`, `src/app/shared/mobile-nav/rules/bottom-sheet.rules.ts:107` — pure sheet maths ; use for sheet logic ; motion calculation
- `SCENE_CONFIG` — `src/app/shared/space-scene/models/scene-config.model.ts:55` — every tuned scene number ; use as config source ; not literals — 19 callers
- `RESTING_DIRECTION` / `SceneDirection` — `src/app/shared/space-scene/models/scene.model.ts:39`, `src/app/shared/space-scene/models/scene.model.ts:26` — what scene shows ; use for scene direction ; direction input — 3 callers
- `SCENE_SURROUNDINGS` — `src/app/shared/space-scene/ports/scene-surroundings.port.ts:14` — panels/lines to avoid ; use for scene surroundings ; page layout coordination — 2 callers
- `SCENE_WINDOW_DRAG` — `src/app/shared/space-scene/ports/scene-window-drag.port.ts:8` — live rect of window being dragged ; use for drag tracking ; observatory-page provided — 2 callers
- `AnimatedCanvasService` — `src/app/shared/space-scene/services/animated-canvas.service.ts:13` — facade over core browser services with Worker/OffscreenCanvas detection ; use for canvas access ; browser abstraction — 4 callers
- `ClickAbsorberService` — `src/app/shared/space-scene/services/click-absorber.service.ts:5` — swallows next click after gesture, one listener ; use for gesture absorption ; click filtering — 3 callers
- `SceneEngineService` — `src/app/shared/space-scene/services/scene-engine.service.ts:24` — builds worker-backed RemoteSceneEngine when possible, else lazy local ; use for engine selection ; component-provided — 1 caller
- `SceneLookService` — `src/app/shared/space-scene/services/scene-look.service.ts:23` — starts pinch/zoom or sky look lazily per format ; use for look interaction ; gesture setup — 1 caller
- `SceneTargetsService` — `src/app/shared/space-scene/services/scene-targets.service.ts:4` — registry of scene target elements in document order ; use for target management ; hit detection — 2 callers
- `SHARED_TEXTS` — `src/app/shared/ui/ports/shared-texts.port.ts:17` — shared component words, Signal, no default ; use for UI text ; port definition — 7 callers
- `SegmentedComponent<T>` — `src/app/shared/ui/components/segmented/segmented.component.ts:28` — tab-like selector emitting valueChange ; use for option selection ; caller controls active item — 3 callers
- `MainNavComponent` — `src/app/shared/ui/components/main-nav/main-nav.component.ts:19` — page bar nav emitting chosen route ; use for page navigation ; route emission — 1 caller
- `LanguageSwitchComponent` — `src/app/shared/ui/components/language-switch/language-switch.component.ts:13` — language links, not on phone ; use for language switching ; desktop only — 1 caller
- `SocialLinksComponent` — `src/app/shared/ui/components/social-links/social-links.component.ts:19` — contact rail with optional extra action ; use for social links ; footer display — 1 caller
- `SOCIAL_ICONS` — `src/app/shared/ui/data/social-icons.data.ts:3` — 4 SVG paths by SocialIcon key ; use for icon rendering ; icon map — 2 callers
- `HoverFocusDirective` — `src/app/shared/ui/directives/hover-focus.directive.ts:14` — entered/exited for mouse hover or non-touch focus ; use for real hover detection ; interaction — 3 callers
- `WithheldInertDirective` — `src/app/shared/ui/directives/withheld-inert.directive.ts:8` — inert while Entrance is withheld ; use for conditional inertness ; entrance binding — 2 callers
- `LayoutAnchorDirective` + `LayoutAnchorsService` — `src/app/shared/ui/directives/layout-anchor.directive.ts:8`, `src/app/shared/ui/services/layout-anchors.service.ts:9` — tag element with kind and list by kind in document order ; use for panel registration ; layout mapping — 3 / 2 callers
- `ViewHeadingDirective` + `ViewFocusService` — `src/app/shared/ui/directives/view-heading.directive.ts:11`, `src/app/shared/ui/services/view-focus.service.ts:7` — move focus to view's heading after navigation ; use for a11y ; focus management — 3 / 2 callers
- `BottomEdgeVariableDirective` — `src/app/shared/ui/directives/bottom-edge-variable.directive.ts:12` — writes element bottom as CSS var on parent ; use for edge measurements ; dynamic spacing — 1 caller
- `elementSize` — `src/app/shared/ui/signals/element-size.signal.ts:11` — element size via ResizeObserver, null at prerender ; use for responsive layout ; size tracking — 1 caller

## docs/architecture/organisation.md — 4.6 `features/profile/`

CopyFeedbackService offers copy(text) and isCopied and is provided per component — `src/app/features/profile/components/contact-links/contact-links.component.ts:27` — origin: docs/architecture/organisation.md:836 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/helpers/format.helper.ts`

twoDigits writes a count or a rank on two digits (count here, rank at planet-buttons.component.ts:33, scene-direction.rules.ts:123, about-window.component.ts:61) — `src/app/features/observatory/components/not-found-window/not-found-window.component.ts:22` — origin: docs/architecture/raisons/core-et-interface.md:23 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/components/segmented/`

The same segmented control serves the parts of about; the caller only learns the chosen value (valueChange) and decides which item is active (about-window.component.ts:85) — `src/app/features/profile/components/about-window/about-window.component.html:15` — origin: docs/architecture/raisons/core-et-interface.md:148 @ b299e1d

value is what the click returns: the caller uses its own key (the part index) and re-emits it as partChange — `src/app/features/profile/components/about-window/about-window.component.ts:83` — origin: docs/architecture/raisons/core-et-interface.md:154 @ b299e1d

The segmented selector is one component reused for pages, project families, sheet chapters and about parts — `src/app/shared/ui/components/segmented/segmented.component.ts:29` — origin: docs/architecture/raisons/core-et-interface.md:148 @ b299e1d

The caller gives only value, label, count and active, and learns which value was chosen; which item becomes active stays its decision — `src/app/shared/ui/models/segmented.model.ts:1` — origin: docs/architecture/raisons/core-et-interface.md:149 @ b299e1d

value is what the click returns so the caller never finds the item by label or identity — `src/app/shared/ui/components/segmented/segmented.component.html:11` — origin: docs/architecture/raisons/core-et-interface.md:154 @ b299e1d

count arrives already formatted (two digits) — `src/app/shared/ui/models/segmented.model.ts:4` — origin: docs/architecture/raisons/core-et-interface.md:156 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/directives/hover-focus.directive.ts`

Hover of a planet goes through appHoverFocus (entered/exited outputs at :11-12) — `src/app/features/observatory/components/planet-buttons/planet-buttons.component.html:4` — origin: docs/architecture/raisons/core-et-interface.md:237 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/windows/components/window/`

The window draws the bands once; callers project into toolbar, body (:22) and footer (:100) slots — `src/app/features/profile/components/about-window/about-window.component.html:16` — origin: docs/architecture/raisons/core-et-interface.md:266 @ b299e1d

The caller sets the window body padding via --window-body-padding — `src/app/features/profile/components/about-window/about-window.component.scss:179` — origin: docs/architecture/raisons/core-et-interface.md:269 @ b299e1d

The window input is heading, not title (also about-window.component.html:3) — `src/app/features/observatory/components/not-found-window/not-found-window.component.html:4` — origin: docs/architecture/raisons/core-et-interface.md:271 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/assets/styles/_utilities.scss`

The skip link uses the .skip-link class (with .visually-hidden) and targets the main id — `src/app/app.component.html:1` — origin: docs/architecture/raisons/core-et-interface.md:384 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/assets/styles/mixins/_controls.scss`

marker is a filled square marking a title (also observatory-dock.component.scss:56) — `src/app/features/observatory/components/home-title/home-title.component.scss:47` — origin: docs/architecture/raisons/core-et-interface.md:403 @ b299e1d

next-link serves a button as well as a link: about includes it with $button true, not-found on a link (not-found-window.component.scss:27) — `src/app/features/profile/components/about-window/about-window.component.scss:172` — origin: docs/architecture/raisons/core-et-interface.md:406 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/assets/styles/mixins/_facts.scss`

Each facts list sets its own term width (11ch here, 3ch at :104, 9ch at :110 and :149) — `src/app/features/profile/components/about-window/about-window.component.scss:41` — origin: docs/architecture/raisons/core-et-interface.md:418 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/assets/styles/mixins/_formats.scss`

Format media queries come from the formats mixins; no raw @media and no unguarded :hover found in the zone styles (grep) — `src/app/shared/space-scene/components/space-scene/space-scene.component.scss:44` — origin: docs/architecture/raisons/core-et-interface.md:424 @ b299e1d

Format media queries follow the same rule as display-format.rules.ts — `src/assets/styles/mixins/_formats.scss:1` — origin: docs/architecture/raisons/core-et-interface.md:424 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/assets/styles/mixins/_motion.scss`

Each component writes its reduced-motion exceptions under motion.reduced (also intro-card.component.scss:98, space-scene.component.scss:103) — `src/app/features/observatory/components/home-title/home-title.component.scss:92` — origin: docs/architecture/raisons/core-et-interface.md:438 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/assets/styles/_tokens.scss`

Layers take --z-* tiers (home-title --z-scene-top, dock --z-chrome, intro --z-intro); space-scene keeps literal z-index 0 and 1 between its own sky and stage (space-scene.component.scss:26) — `src/app/features/observatory/components/intro-skip/intro-skip.component.scss:13` — origin: docs/architecture/raisons/core-et-interface.md:369 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/assets/styles/mixins/_type.scss`

The interface voices go through type mixins (mono, caps, title) with the m-scale — `src/app/features/observatory/components/home-title/home-title.component.scss:75` — origin: docs/architecture/raisons/core-et-interface.md:444 @ b299e1d

## docs/architecture/decisions.md — 2026-09-27 — Au doigt, la scène dessine à 60 i/s au plus ; au téléphone, moins de pixels et de grains (D36)

Comparing two node lists is written once (planets/same-nodes.rules.ts) — `src/app/shared/space-scene/rules/planets/same-nodes.rules.ts:1` — origin: docs/architecture/decisions.md:1065 @ b299e1d

## docs/architecture/decisions.md — 2026-09-27 — Au bureau, la molette rapproche et le clic molette déplace la caméra (D43, étend D32, amende D39)

FormatCodeService.load(formats, importer) loads when the format matches and never on the server — `src/app/core/services/device/format-code.service.ts:23` — origin: docs/architecture/decisions.md:1333 @ b299e1d

The server answers desktop — `src/app/core/rules/display-format.rules.ts:9` — origin: docs/architecture/decisions.md:1335 @ b299e1d

## docs/architecture/decisions.md — 2026-10-01 — Au téléphone, ce qu'on touche répond, et une feuille vibre en se calant (D88)

HapticsService vibrates and does nothing where navigator.vibrate is missing — `src/app/core/services/browser/haptics/haptics.service.ts:13` — origin: docs/architecture/decisions.md:2695 @ b299e1d

D88: a sheet that the user gesture sets on another detent vibrates 10 ms (SETTLE_VIBRATION_MS line 33) through the library port (platform.vibrate) ; not when set by the program or on the same detent (isFelt, bottom-sheet.rules.ts:17) — `src/app/shared/mobile-nav/components/bottom-sheet/bottom-sheet.component.ts:284` — origin: docs/architecture/decisions.md:2694 @ b299e1d

D88: the sheet back layer moved into BackClaimService so the component stays under the line limit — `src/app/shared/mobile-nav/services/back-claim.service.ts:28` — origin: docs/architecture/decisions.md:2698 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/helpers/angle.helper.ts`

nearestTurn brings an azimuth within half a turn of the reference — `src/app/core/helpers/angle.helper.ts:3` — origin: docs/architecture/raisons/core-et-interface.md:8 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/helpers/easing.helper.ts`

halfLifeStep gives a frame-rate-independent share of remaining distance — `src/app/core/helpers/easing.helper.ts:10` — origin: docs/architecture/raisons/core-et-interface.md:16 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/helpers/random.helper.ts`

gaussian uses the polar Box-Muller method — `src/app/core/helpers/random.helper.ts:1` — origin: docs/architecture/raisons/core-et-interface.md:29 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/services/device/display-format.service.ts`

desktop on the server; on the client it follows resize, orientationchange and pointer changes — `src/app/core/services/device/display-format.service.ts:46` — origin: docs/architecture/raisons/core-et-interface.md:83 @ b299e1d

publishOnRoot writes data-format on html, client only, requested by the always-mounted page — `src/app/core/services/device/display-format.service.ts:70` — origin: docs/architecture/raisons/core-et-interface.md:87 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/services/head/document-head.service.ts`

DocumentHeadService is the only writer of the head — `src/app/core/services/head/document-head.service.ts:33` — origin: docs/architecture/raisons/core-et-interface.md:113 @ b299e1d

## docs/architecture/decisions.md — 2026-09-27 — Le code propre au téléphone se charge à part (D39, amende D37)

The device code loader imports at most once, as soon as the format matches, on client start or on format change — `src/app/core/services/device/format-code.service.ts:31` — origin: docs/architecture/decisions.md:1157 @ b299e1d

The device code loader never loads on the server — `src/app/core/services/device/format-code.service.ts:23` — origin: docs/architecture/decisions.md:1159 @ b299e1d

Shared mixins are type controls facts arrival motion formats (a _pager.scss mixin also exists on disk) — origin: README.md:221 @ b299e1d — status: declared

## docs/architecture/organisation.md — `core/services/device/` : le format d'affichage

Format mixins state the same rule as display-format rules in media queries — `src/assets/styles/mixins/_formats.scss:1` — origin: docs/architecture/organisation.md:349 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/components/social-links/`

Icons are on a 24 grid and drawn in the link colour — `src/app/shared/ui/components/social-links/social-links.component.html:11` — origin: docs/architecture/raisons/core-et-interface.md:171 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/data/social-icons.data.ts`

Four icons email, linkedin, github and CV come from one icon set — `src/app/shared/ui/data/social-icons.data.ts:3` — origin: docs/architecture/raisons/core-et-interface.md:190 @ b299e1d

## docs/architecture/decisions.md — 2026-09-25 — Sous la vitre, un seul filtre (D28, amende D25)

On phone the segmented controls hold on one line, tightened, scrolling within their box as a last resort (nowrap, overflow-x auto at :18) — `src/app/shared/ui/components/segmented/segmented.component.scss:12` — origin: docs/architecture/decisions.md:746 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Cinq reprises sur captures : la vitre basse des petits téléphones, le relevé selon sa place, le titre, les segmentés de la tablette, l'accueil couché (D45, amende D27, D28, D34, D38 et D40)

The segmented controls hold on one line at tablet as at phone: the rule applies to everything that is not desktop (handheld) — `src/app/shared/ui/components/segmented/segmented.component.scss:56` — origin: docs/architecture/decisions.md:1449 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Le téléphone a une librairie de navigation, et les chapitres se tournent comme des pages (D57, amende D37)

D57: the pager is a horizontal scroll-snap, one page at a time — `src/app/shared/mobile-nav/components/pager/pager.component.ts:44` — origin: docs/architecture/decisions.md:1782 @ b299e1d

D57: the pager reports the reader page at scrollend, otherwise 120 ms after the last scroll, never before — `src/app/shared/mobile-nav/components/pager/pager.component.ts:28` — origin: docs/architecture/decisions.md:1783 @ b299e1d

D57: a page set from above scrolls after the next frame, without animation under reduced motion (pager.component.ts:285) — `src/app/shared/mobile-nav/components/pager/pager.component.ts:274` — origin: docs/architecture/decisions.md:1785 @ b299e1d

D57: the pages other than the current one are inert — `src/app/shared/mobile-nav/components/pager-page/pager-page.component.ts:17` — origin: docs/architecture/decisions.md:1786 @ b299e1d

D57/D58: --mnav-* variables came with the bricks that draw (the carousel uses them with fallbacks) — `src/app/shared/mobile-nav/components/card-carousel/card-carousel.component.scss:35` — origin: docs/architecture/decisions.md:1809 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Au téléphone, les projets vedettes sont des cartes qu'on fait glisser (D58, amende D35)

D58: shared/mobile-nav/ has a card carousel where each card is a button — `src/app/shared/mobile-nav/components/card-carousel/card-carousel.component.html:10` — origin: docs/architecture/decisions.md:1818 @ b299e1d

D58: the next card overflows the edge (padding var(--mnav-peek, 12%)) — `src/app/shared/mobile-nav/components/card-carousel/card-carousel.component.scss:10` — origin: docs/architecture/decisions.md:1819 @ b299e1d

D58: the carousel reports the settled card at end of scroll (scrollend or 120 ms), never before, like the pager — `src/app/shared/mobile-nav/components/card-carousel/card-carousel.component.ts:25` — origin: docs/architecture/decisions.md:1820 @ b299e1d

D58: a card set from above scrolls after the next frame, without animation under reduced motion — `src/app/shared/mobile-nav/components/card-carousel/card-carousel.component.ts:225` — origin: docs/architecture/decisions.md:1821 @ b299e1d

D58: dots show the settled card with aria-current and stay out of the tab order (tabindex -1 at line 6) — `src/app/shared/mobile-nav/components/pager-dots/pager-dots.component.html:8` — origin: docs/architecture/decisions.md:1822 @ b299e1d

D58: the hand-written gesture is removed along with swallowsTap, swipeStepOf and neighbourOf (absent: featured-pick.rules.ts, which held swipeStepOf and neighbourOf until 1a955b3, now holds only restingPickOf) — `src/app/features/projects/rules/featured-pick.rules.ts:1` — origin: docs/architecture/decisions.md:1834 @ b299e1d

D58: dots reuse the existing Page N of M text (MOBILE_NAV_TEXTS.pageOf), no new word — `src/app/shared/mobile-nav/components/pager-dots/pager-dots.component.html:7` — origin: docs/architecture/decisions.md:1836 @ b299e1d

D58: only opacity and scale animate on the cards, without backdrop-filter ; no backdrop-filter, but filter is also listed in the transition (card-carousel.component.scss:47) with no filter value set in the file — origin: docs/architecture/decisions.md:1838 @ b299e1d — status: declared

## docs/architecture/decisions.md — 2026-09-28 — Au téléphone, « Contact » ouvre une feuille d'actions, et le retour la ferme d'abord (D60, amende D27)

D60: shared/mobile-nav/ has an action sheet built on a dialog opened by showModal() — `src/app/shared/mobile-nav/components/action-menu/action-menu.component.ts:110` — origin: docs/architecture/decisions.md:1872 @ b299e1d

D60: the sheet has a heading, projected rows (appActionRow, link or button, 44 px min height at action-menu.component.scss:83) and a Close button (action-menu.component.html:14) — `src/app/shared/mobile-nav/directives/action-row.directive.ts:5` — origin: docs/architecture/decisions.md:1873 @ b299e1d

D60: the sheet panel is opaque (--mnav-panel background, line 40) and rises from the bottom (translateY(100%)) — `src/app/shared/mobile-nav/components/action-menu/action-menu.component.scss:41` — origin: docs/architecture/decisions.md:1874 @ b299e1d

D60: on closing, the exit plays, then close(), then open becomes false (lines 121, 129) ; under reduced motion all at once — `src/app/shared/mobile-nav/components/action-menu/action-menu.component.ts:73` — origin: docs/architecture/decisions.md:1875 @ b299e1d

D60: focus returns to the opening element — `src/app/shared/mobile-nav/components/action-menu/action-menu.component.ts:130` — origin: docs/architecture/decisions.md:1877 @ b299e1d

D60: Escape closes only the sheet (propagation stopped, cancel turned into dismiss at action-menu.component.ts:83) — `src/app/shared/mobile-nav/components/action-menu/action-menu.component.html:9` — origin: docs/architecture/decisions.md:1877 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Les onglets du téléphone restent dans `shared/ui`, et les transitions orientées attendent les fenêtres qui durent (D61)

D61: the tab bar is fixed at the bottom with env(safe-area-inset-bottom) (line 99), 44 px targets via --target (line 112), aria-current (main-nav.component.html:8) and its words through a port (SHARED_TEXTS, main-nav.component.ts:27) — `src/app/shared/ui/components/main-nav/main-nav.component.scss:93` — origin: docs/architecture/decisions.md:1909 @ b299e1d

D62: layout reads on a new or hidden window (segmented, pager, carousel, scrollTop) wait until the content is drawn ; no onVisible or visibility wait found in pager, carousel or segmented, the mechanism may sit in shared/windows — origin: docs/architecture/decisions.md:1940 @ b299e1d — status: declared

## docs/architecture/decisions.md — 2026-09-28 — Au téléphone, la vitre est une feuille à crans de `shared/mobile-nav` (D64, amende D25, D37, D39 et D62)

D64: shared/mobile-nav/ has BottomSheetComponent with detents folded, half and full — `src/app/shared/mobile-nav/rules/bottom-sheet.rules.ts:29` — origin: docs/architecture/decisions.md:1984 @ b299e1d

D64: lying down, the half detent merges into full (stopsOf drops a stop that coincides with the previous one) — `src/app/shared/mobile-nav/rules/bottom-sheet.rules.ts:38` — origin: docs/architecture/decisions.md:1987 @ b299e1d

D64: on release the pure rule detentAfter picks the detent: 64 px toward folded, 48 px elsewhere, or more than 0.6 px/ms (lines 8-10) — `src/app/shared/mobile-nav/rules/bottom-sheet.rules.ts:87` — origin: docs/architecture/decisions.md:1988 @ b299e1d

D64: the sheet reports its detent only at end of scroll (scrollend, otherwise 120 ms after the last scroll) — `src/app/shared/mobile-nav/directives/scroll-release.directive.ts:16` — origin: docs/architecture/decisions.md:1991 @ b299e1d

D64: the sheet writes data-detent and the height of its band for the page (--mnav-bottom-sheet-band, line 282) — `src/app/shared/mobile-nav/components/bottom-sheet/bottom-sheet.component.ts:45` — origin: docs/architecture/decisions.md:1993 @ b299e1d

D64: a tap on the folded bar raises the sheet — `src/app/shared/mobile-nav/components/bottom-sheet/bottom-sheet.component.ts:202` — origin: docs/architecture/decisions.md:1993 @ b299e1d

D64: outside the phone the sheet is display: contents — `src/app/shared/mobile-nav/components/bottom-sheet/bottom-sheet.component.scss:5` — origin: docs/architecture/decisions.md:1995 @ b299e1d

D64: the sheet measure waits for the next frame instead of running inside the ResizeObserver callback (onResize at line 185 calls measureSoon) — `src/app/shared/mobile-nav/components/bottom-sheet/bottom-sheet.component.ts:246` — origin: docs/architecture/decisions.md:2015 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au téléphone, la carte et la page se choisissent dès que le navigateur connaît la cible (D69, amende D57 et D58)

D69: carousel and pager move the visible selection (data-current, aria-current) to the target as soon as the browser announces it (scrollsnapchanging), otherwise as soon as the nearest target changes while scrolling (line 130 ; card-carousel.component.ts:97,122) — `src/app/shared/mobile-nav/components/pager/pager.component.ts:100` — origin: docs/architecture/decisions.md:2152 @ b299e1d

D69: the pager publishes the shown page (shownChange) — `src/app/shared/mobile-nav/components/pager/pager.component.ts:55` — origin: docs/architecture/decisions.md:2156 @ b299e1d

D69: the committed index (indexChange, activeChange at card-carousel.component.ts:155) leaves once per gesture at end of scroll, for the nearest page (pageAt), without requiring to be within one pixel of its offset — `src/app/shared/mobile-nav/components/pager/pager.component.ts:161` — origin: docs/architecture/decisions.md:2158 @ b299e1d

D69: while the finger is down or momentum runs nothing scrolls the component ; a target requested from above waits for the end of the gesture (resumePending at line 164) — `src/app/shared/mobile-nav/components/pager/pager.component.ts:257` — origin: docs/architecture/decisions.md:2161 @ b299e1d

D69: the segmented control linked to the pager brings its tab into view without animation (instant input) — `src/app/shared/ui/components/segmented/segmented.component.ts:31` — origin: docs/architecture/decisions.md:2164 @ b299e1d

D69: touch listeners are passive (pager and card-carousel.component.ts:102) — `src/app/shared/mobile-nav/components/pager/pager.component.ts:119` — origin: docs/architecture/decisions.md:2165 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au bureau, le contact se lit en mots, et l'adresse se copie (D79, amende D60)

D79: SocialLinksComponent (shared/ui) gains a generic optional action (action input, actioned output at line 24) and says nothing of the portfolio — `src/app/shared/ui/components/social-links/social-links.component.ts:23` — origin: docs/architecture/decisions.md:2435 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — L'intro se passe d'un geste, aucun geste ne se perd, et la scène se pose à la fin (D80, amende D41)

D80: a control not yet visible is held inert by WithheldInertDirective in shared/ui, set on every panel carrying data-arrival — `src/app/shared/ui/directives/withheld-inert.directive.ts:5` — origin: docs/architecture/decisions.md:2460 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au téléphone, une feuille se reconnaît, et le retour la baisse avant de quitter la page (D84, amende D57, D60 et D64)

D84: a transient sheet emits dismissed when pulled 64 px down from its lowest detent (FOLD_REACH ; bottom-sheet.component.ts:150) — `src/app/shared/mobile-nav/rules/bottom-sheet.rules.ts:125` — origin: docs/architecture/decisions.md:2590 @ b299e1d

D84: each phone sheet top has a 36 x 5 px grip, 16 px rounded top corners, lighter surface and upward shadow (grip lives in WindowGripComponent, outside the zone) — origin: docs/architecture/decisions.md:2577 @ b299e1d — status: declared

## docs/architecture/decisions.md — 2026-09-29 — Au téléphone, le bord d'une page qui défile s'estompe, et un balayage court tourne la page (D85, amende D57)

D85: a pager page scrolled under a window header fades its top 8 px via animation-timeline scroll(self y) ; the mask lives in src/assets/styles/mixins/_pager.scss, outside the zone — origin: docs/architecture/decisions.md:2609 @ b299e1d — status: declared

D85: on finger release pageAfterSwipe advances one page in the gesture direction when it is at least 24 px, more horizontal than vertical, at least 0.1 px/ms average (lines 1-2) — `src/app/shared/mobile-nav/rules/pager.rules.ts:41` — origin: docs/architecture/decisions.md:2612 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au téléphone, l'accueil est une feuille, et l'aperçu en est le plein (D86, amende D57, D58, D64 et D71)

D86: the carousel dots are extracted as PagerDotsComponent, reused under the home preview — `src/app/shared/mobile-nav/components/card-carousel/card-carousel.component.html:25` — origin: docs/architecture/decisions.md:2644 @ b299e1d

## docs/architecture/decisions.md — 2026-10-01 — Au téléphone, la barre du haut ne garde que Contact, et la langue passe dans la feuille Contact (D89, amende D60)

D89: ActionMenuComponent closes the sheet when one of its rows is touched (ActionRowDirective calls dismiss unless keepsOpen) — `src/app/shared/mobile-nav/directives/action-row.directive.ts:17` — origin: docs/architecture/decisions.md:2730 @ b299e1d

## docs/architecture/decisions.md — 2026-10-02 — Au téléphone, on passe d'un filtre de la liste à l'autre en balayant (D92, amende D57)

D92: during the gesture the list and the segmented active state follow the finger through CSS variables written each frame (--swipe-pane, --swipe-at) — `src/app/shared/mobile-nav/services/swipe-steps.service.ts:121` — origin: docs/architecture/decisions.md:2794 @ b299e1d

D92: on release the list leaves in 180 ms and the new one enters in 180 ms — `src/app/shared/mobile-nav/services/swipe-steps.service.ts:5` — origin: docs/architecture/decisions.md:2796 @ b299e1d

D92: the swipe passes at 25 % of the width or on a flick (more than 0.4 px/ms over at least 24 px, lines 5-6) ; at the ends the list resists (RESISTANCE line 7, followOf) — `src/app/shared/mobile-nav/rules/swipe-steps.rules.ts:4` — origin: docs/architecture/decisions.md:2797 @ b299e1d

D92: under reduced motion the filter changes on release without travel — `src/app/shared/mobile-nav/services/swipe-steps.service.ts:142` — origin: docs/architecture/decisions.md:2801 @ b299e1d

D92: SwipeStepsService is loaded separately, on a compact screen only (the lazy import is at the caller, outside the zone) — origin: docs/architecture/decisions.md:2802 @ b299e1d — status: declared

## Decided at the onboarding interview (2026-10-05)

Code with no reader is kept on purpose: ProjectsState.isLoading and isError (`src/app/features/projects/states/projects/projects.state.ts:9`) and the formats.desktop mixin (`src/assets/styles/mixins/_formats.scss:42`).
