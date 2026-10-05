# Glossary

knowledge-date: 2026-10-05
knowledge-commit: b299e1d

## .github/**,src/app/\*,src/app/features/observatory/**,src/app/features/profile/**,src/app/shared/space-scene/components/**

- observatory (the whole screen metaphor; ex-desktop/station) -> `ObservatoryState` (`src/app/features/observatory/states/observatory/observatory.state.ts:25`)
- view (home, index, sheet, about, not-found) -> `ObservatoryView` (`src/app/features/observatory/models/observatory.model.ts:1`)
- window (about, index, sheet, preview) -> `OBSERVATORY_WINDOWS` (`src/app/features/observatory/models/observatory.model.ts:4`)
- slot -> `ViewSlot` (`src/app/features/observatory/models/observatory.model.ts:13`), `ViewSlotDirective` (`src/app/features/observatory/directives/view-slot.directive.ts:6`)
- pin -> `ObservatoryPins` (`src/app/features/observatory/models/observatory.model.ts:17`)
- minimized -> `ObservatoryMinimized` / `MinimizableWindow` (`src/app/features/observatory/models/observatory.model.ts:15`)
- held / parked sheet -> `HeldSheet` (`src/app/features/observatory/models/observatory.model.ts:21`), `handOverSheet` (`src/app/features/observatory/rules/sheet-windows.rules.ts:55`)
- sheet key -> `sheetKey` (`src/app/features/observatory/states/observatory/observatory.state.ts:34`), `sheetIdOf` (`src/app/features/observatory/rules/sheet-windows.rules.ts:44`)
- resume point -> `ResumePoint` (`src/app/features/observatory/models/observatory.model.ts:34`)
- planet -> `Planet` (`src/app/features/observatory/models/observatory.model.ts:28`)
- docked -> `dockedOf` (`src/app/features/observatory/rules/view.rules.ts:91`)
- kept / seen -> `keptOf` (`src/app/features/observatory/rules/view.rules.ts:115`), `seen` (`src/app/features/observatory/states/observatory/observatory.state.ts:42`)
- step back -> `stepBack` (`src/app/features/observatory/rules/view.rules.ts:73`)
- tab -> `Tab` (`src/app/features/observatory/rules/tabs.rules.ts:3`)
- detent / posed (phone home sheet) -> `homeDetentAfter`, `posedSlugOf` (`src/app/features/observatory/rules/home-bottom-sheet.rules.ts:3`)
- curtain / featured tour -> `FeaturedTourService` (`src/app/features/observatory/services/featured-tour.service.ts:9`)
- arrival / reveal / entrance -> `HomeRevealService.arrival` (`src/app/features/observatory/services/home-reveal.service.ts:23`)
- designated (phone-named planet) -> `ObservatoryScene.designated` (`src/app/features/observatory/rules/scene-direction.rules.ts:20`)
- part (about section, lit figure) -> `PARTS` (`src/app/features/profile/components/about-window/about-window.component.ts:23`)
- contact address -> `ContactAddress` (`src/app/features/profile/models/contact.model.ts:3`)
- staging / production target -> `TARGET` (`.github/workflows/ci.yml:131`)
- arrival states `withheld` / `shown` / `timed` -> `data-arrival` host attribute (`src/app/features/observatory/components/home-title/home-title.component.ts:23`) styled at `src/app/features/observatory/components/home-title/home-title.component.scss:29`
- withheld (arrival state: elements withheld until first gesture or end of crossing) -> `Entrance` model (`src/app/shared/ui/models/entrance.model.ts:1`)
- crossing (intro duration before the rest arrives) -> `--arrival-at` (`src/assets/styles/_tokens.scss:65`), spec option `crossing` (`src/app/features/observatory/services/home-reveal.service.spec.ts:47`)
- phone media set -> `TOUCH` (`src/app/features/observatory/services/home-bottom-sheet.service.spec.ts:7`)
- held sheet -> pinned sheet windows kept open with their project, minimizable by index (`tabs.minimizeSheet(0, bar)`), window-stack ids `sheet:<n>` — `src/app/features/observatory/services/tab-navigation.service.spec.ts:324`, `src/app/features/observatory/services/view-windows.service.spec.ts:134`
- grip / handle -> `.bar button.grip` of the home title, held by `WINDOW_FOLD` — `src/app/features/observatory/components/home-title/home-title.component.spec.ts:110`
- dock -> `ObservatoryDockComponent` nav of pinned-and-left windows — `src/app/features/observatory/components/observatory-dock/observatory-dock.component.spec.ts:40`
- part (about) -> one of profile/skills/path/method pages of the about pager — `src/app/features/profile/components/about-window/about-window.component.spec.ts:35`

## _,.husky/_,docs/**,src/app/shared/space-scene/directives/\*,src/app/shared/space-scene/rules/**,src/testing/**

- framing (rest, overview, aside, close-up, approach) -> `FramingKind` in `SceneState` (`src/app/shared/space-scene/rules/scene-state.rules.ts:11`); frames `REST_FRAME`/`OVERVIEW_FRAME`/`ASIDE_FRAME` (`src/app/shared/space-scene/rules/camera/camera-frames.rules.ts:17`, `src/app/shared/space-scene/rules/camera/camera-frames.rules.ts:26`, `src/app/shared/space-scene/rules/camera/camera-frames.rules.ts:35`)
- faint body -> `faintFrom` (`src/app/shared/space-scene/rules/scene-state.rules.ts:55`)
- scene state -> `SceneState` (`src/app/shared/space-scene/rules/scene-state.rules.ts:8`); scene frame -> `SceneFrame` (`src/app/shared/space-scene/rules/scene-frame.rules.ts:11`)
- grain (disc matter) -> `Grain` (`src/app/shared/space-scene/rules/scene-bodies.rules.ts:13`); orbit -> `Orbit` (`src/app/shared/space-scene/rules/scene-bodies.rules.ts:35`)
- hole -> `Hole` (`src/app/shared/space-scene/rules/focus/focus-rows.rules.ts:23`), `ScreenHole` (`src/app/shared/space-scene/rules/camera/projection.rules.ts:11`); hole focus -> `HoleFocus` (`src/app/shared/space-scene/rules/hole-focus.rules.ts:26`)
- free sky -> `FreeSky` (`src/app/shared/space-scene/rules/camera/free-sky.rules.ts:8`); sky room -> `SkyRoom` (`src/app/shared/space-scene/rules/figures/figure-room.rules.ts:6`); window room -> `WindowRoom` (`src/app/shared/space-scene/rules/rooms/window-room.rules.ts:13`)
- panel zone / veil -> `Zone`, `veilAt` (`src/app/shared/space-scene/rules/panel-veil.rules.ts:3`, `src/app/shared/space-scene/rules/panel-veil.rules.ts:44`)
- traveling (crossing) -> `Traveling` (`src/app/shared/space-scene/rules/camera/traveling.rules.ts:3`)
- figure / constellation -> `Figure`, `CONSTELLATIONS` (`src/app/shared/space-scene/rules/figures/constellations.rules.ts:1`, `src/app/shared/space-scene/rules/figures/constellations.rules.ts:9`); comet -> `Comet` (`src/app/shared/space-scene/rules/sky/comets.rules.ts:4`); star field -> `StarField` (`src/app/shared/space-scene/rules/sky/star-field.rules.ts:31`)
- planet focus -> `PlanetFocus` (`src/app/shared/space-scene/rules/planets/planet-focus.rules.ts:4`)
- scene target -> `SceneTargetDirective` / `data-scene-target` (`src/app/shared/space-scene/directives/scene-target.directive.ts:7`); sky (empty background) -> `isOnSky` (`src/app/shared/space-scene/rules/gestures/sky-touch.rules.ts:7`)
- turnable scene -> `TurnableScene` (`src/app/shared/space-scene/directives/turn-gesture.directive.ts:22`)
- feature / shared library / zone -> `FEATURES`, `SHARED_LIBS`, `ZONES` (`eslint.config.ts:13`, `eslint.config.ts:28`, `eslint.config.ts:137`)
- English draft -> `INTERFACE_DRAFTS`, `"enDraft"` (`src/testing/integration/drafts.spec.ts:7`, `src/testing/integration/drafts.spec.ts:12`)

## src/app/core/**,src/app/i18n/**,src/app/pages/**,src/app/shared/space-scene/engine/**,src/app/shared/space-scene/trackers/*

- display format (phone/tablet/desktop) -> `DisplayFormat` (`src/app/core/models/display-format.model.ts:1`)
- language -> `Lang` (`src/app/core/models/lang.model.ts:1`)
- bilingual text -> `Localized` / `bilingual` (`src/app/core/rules/localize.rules.ts:5`)
- draft (EN text not yet reviewed) -> `draft` (`src/app/core/rules/draft.rules.ts:3`)
- catalogue -> `Catalog` (`src/app/i18n/models/catalog.model.ts:32`)
- addressed view (home/index/about/sheet) -> `AddressedView` (`src/app/i18n/data/paths.data.ts:4`)
- owner/site name -> `OWNER_NAME` (`src/app/i18n/data/owner.data.ts:1`), `SITE_NAME` (`src/app/core/ports/site-name.port.ts:3`)
- observatory (the screen) -> `ObservatoryPageComponent` (`src/app/pages/observatory/observatory-page.component.ts:213`)
- route marker -> `ObservatoryRouteComponent` (`src/app/pages/observatory/observatory-route.component.ts:24`)
- planet (a project in the scene) -> `Planet` built at `src/app/pages/observatory/observatory-page.component.ts:230`
- engine host -> `EngineHost` (`src/app/shared/space-scene/engine/frame-loop.engine.ts:3`)
- remote engine / scene worker -> `RemoteSceneEngine` (`src/app/shared/space-scene/engine/remote-scene.engine.ts:315`), `SceneWorkerEngine` (`src/app/shared/space-scene/engine/scene-worker.engine.ts:35`)
- recorded node / node write -> `NodeRecorderEngine` (`src/app/shared/space-scene/engine/node-recorder.engine.ts:87`)
- sky pan -> `SkyPanMotion` (`src/app/shared/space-scene/engine/motions/sky-pan.motion.ts:8`)
- turntable -> `TurntableMotion` (`src/app/shared/space-scene/engine/motions/turntable.motion.ts:28`)
- star pass (one star's per-frame placement) -> `StarPass` (`src/app/shared/space-scene/engine/motions/star-flow.motion.ts:37`)
- sky frame (per-frame sky parameters: flight run, speed, voyage, lens) -> `SkyFrame` (`src/app/shared/space-scene/engine/motions/star-flow.motion.ts:16`)
- sky camera -> `SkyCamera` (`src/app/shared/space-scene/engine/renderers/sky/star-sky.renderer.ts:23`)
- `SkyOffset` is the sky offset {panX, panY} (`src/app/shared/space-scene/engine/renderers/sky/star-sky.renderer.ts:41`, used by constellations); `SkyPan` is the pan motion contract in `ZoomMotion` (`src/app/shared/space-scene/engine/motions/zoom.motion.ts:14`, implemented by `SkyPanMotion`)
- crossing / traveling (the opening camera journey) -> `TRAVELING_END`, `traveling` used in `ClockMotion` (`src/app/shared/space-scene/engine/motions/clock.motion.ts:5-9`)
- landed (opened on a view other than the crossing) -> `opensLanded` (`src/app/shared/space-scene/engine/motions/scene.motion.ts:23`)
- marks (planets, orbits, labels visibility) / figures (constellations or comets visibility) -> pose keys `marks`, `figures` (`src/app/shared/space-scene/engine/motions/camera.motion.ts:42-51`)
- lit figure -> `state.litFigure`, eased per figure in `lights` (`src/app/shared/space-scene/engine/motions/camera.motion.ts:72`, :291)
- close look (double-tap zoom) -> `CLOSE_LOOK` in `ZoomMotion.toggle` (`src/app/shared/space-scene/engine/motions/zoom.motion.ts:95`)
- grip (pinch hold) -> `ZoomMotion.grip` (`src/app/shared/space-scene/engine/motions/zoom.motion.ts:30`)
- trail warm-up -> `StarSkyRenderer.warm` (`src/app/shared/space-scene/engine/renderers/sky/star-sky.renderer.ts:291`)
- figure target (DOM hit button over a figure) -> `FigureTargetsRenderer` (`src/app/shared/space-scene/engine/renderers/sky/figure-targets.renderer.ts:11`)
- hole mark (stage attributes describing the hole and disc) -> `HoleMarkRenderer` (`src/app/shared/space-scene/engine/renderers/hole-mark.renderer.ts:16`)
- reach (button position/coverage of a planet) -> `PlanetsRenderer.writeReach` (`src/app/shared/space-scene/engine/renderers/planets.renderer.ts:142`)
- tag vs name (two label modes) -> `PlanetLabelsRenderer.tag` / `.name` (`src/app/shared/space-scene/engine/renderers/planet-labels.renderer.ts:253`, :276)
- docked / kept / pinned window -> `observatory.docked()`, `kept()`, `pins()` in `src/app/pages/observatory/observatory-page.component.html:48`, :51, :55
- detent (folded / half / full of a bottom sheet) -> `homeBottomSheet.detent()` (`src/app/pages/observatory/observatory-page.component.html:163`)
- void (transparent step-back button over the scene) -> `.void` (`src/app/pages/observatory/observatory-page.component.html:213`)

## public/_,scripts/_,src/*,src/app/features/projects/**,src/app/shared/windows/**,src/assets/**

- project entry -> `ProjectEntry` (`src/app/features/projects/models/project.model.ts:23`)
- facts (proof, role, stack, context, period) -> `FactsSource` (`src/app/features/projects/models/project.model.ts:15`)
- sheet / fiche -> `DetailSource`, `ProjectDetailComponent` (`src/app/features/projects/models/project-detail.model.ts:38`)
- chapter / approach -> `DetailChapterSource`, `ChapterOnShow` (`src/app/features/projects/components/project-chapter/project-chapter.component.ts:4`)
- family -> `ProjectFamily`, `FamilyFilter` (`src/app/features/projects/models/project-family.model.ts:1`)
- featured / vedette -> `Ranking.featured`, `FEATURED` (`src/app/features/projects/models/project.model.ts:33`)
- catalog -> `ProjectCatalog` (`src/app/features/projects/models/project-catalog.model.ts:4`)
- English draft -> `enDraft` key (`src/app/features/projects/rules/project-entry.rules.ts:68`)
- index / list, rule / featured bar, preview -> `ProjectListComponent`, `FeaturedBarComponent`, `ProjectPreviewComponent` (`src/app/features/projects/components/index.ts:1`)
- frame mode / snap zone -> `FrameMode`, `FrameZone` (`src/app/shared/windows/models/window-frame.model.ts:38`)
- kept window -> `KeptWindowDirective` (`src/app/shared/windows/directives/kept-window.directive.ts:22`)
- fold (phone sheet) -> `WindowFold` (`src/app/shared/windows/ports/window-fold.port.ts:3`)
- reserve -> CSS var `--window-reserve` (`src/app/shared/windows/trackers/window-frame.tracker.ts:27`)
- glass / vitre -> `controls.glass`, `--vitre*` (`src/assets/styles/mixins/_controls.scss:4`, `src/assets/styles/_tokens.scss:14-16`)
- pane (phone window not anchored bottom) -> `.pane` (`src/app/shared/windows/components/window/window.component.scss:122`)
- sheet (project sheet only; project detail window) -> `ProjectDetailComponent` (`src/app/features/projects/components/project-detail/project-detail.component.ts`), body `.body` and scroll key `detail:<slug>` (`src/app/features/projects/components/project-detail/project-detail.component.scss:12`) ; held window (pinned sheet windows) -> `.foldable` in window (`src/app/shared/windows/components/window/window.component.ts:43`), `isFoldable()` signal ; distinct UI term: bottom sheet -> `.bottom-sheet` (`src/app/shared/mobile-nav/components/bottom-sheet/bottom-sheet.component.ts:48`)
- grip -> `.grip` (`src/app/shared/windows/components/window-grip/window-grip.component.scss:5`)
- marker / square / dot -> `controls.marker` (`src/assets/styles/mixins/_controls.scss:17`)
- lit -> `controls.lit` (`src/assets/styles/mixins/_controls.scss:23`), `[data-lit]` (`src/app/features/projects/components/featured-bar/featured-bar.component.scss:92`), `lit-row` (`src/app/features/projects/components/project-list/project-list.component.scss:12`)
- cards (narrow index) -> `@container (width < 500px)` (`src/app/features/projects/components/project-list/project-list.component.scss:124`) ; phone featured cards -> `.cards` (`src/app/features/projects/components/featured-bar/featured-bar.component.scss:139`)
- reading (featured bar caption line) -> `.reading` (`src/app/features/projects/components/featured-bar/featured-bar.component.scss:167`)
- arrival (timed/held/shown) -> `data-arrival` + `arrival.*` (`src/app/features/projects/components/featured-bar/featured-bar.component.scss:21-27`, `src/app/shared/ui/models/entrance.model.ts:1`)
- crowded -> `:host([data-crowded='true'])` (`src/app/features/projects/components/featured-bar/featured-bar.component.scss:197`)
- facts row/term/value -> `facts.*` (`src/assets/styles/mixins/_facts.scss:1`)

## src/app/features/common/**,src/app/shared/mobile-nav/**,src/app/shared/space-scene/models/_,src/app/shared/space-scene/ports/_,src/app/shared/space-scene/services/*,src/app/shared/ui/**

- detent (folded / half / full) -> `SheetDetent` (`src/app/shared/mobile-nav/models/bottom-sheet.model.ts:1`)
- back layer -> `BackLayersService` (`src/app/shared/mobile-nav/services/back-layers.service.ts:19`), history key `mobileNavLayer` (`src/app/shared/mobile-nav/rules/back-layers.rules.ts:1`)
- entrance (timed / held / shown) -> `Entrance` (`src/app/shared/ui/models/entrance.model.ts:1`)
- scene anchor -> `SceneAnchorKind` (`src/app/features/common/models/scene-anchors.model.ts:1`)
- panel role -> `ScenePanelRole` (`src/app/shared/space-scene/models/scene-layout.model.ts:30`)
- framing (rest / overview / aside / close-up / approach) -> `CameraFraming` (`src/app/shared/space-scene/models/scene.model.ts:5`)
- presence (shown / held / hidden) -> `BodiesPresence` (`src/app/shared/space-scene/models/scene.model.ts:14`)
- body -> `SceneBody` (`src/app/shared/space-scene/models/scene.model.ts:20`)
- figures (constellations / comets) -> `SkyFigures` (`src/app/shared/space-scene/models/scene.model.ts:18`)
- look -> `SceneLook` (`src/app/shared/space-scene/models/scene-look.model.ts:15`)
- rail action -> `RailAction` (`src/app/shared/ui/models/rail-action.model.ts:1`)
- swipe stops -> `SwipeStops` (`src/app/shared/mobile-nav/models/swipe.model.ts:17`)
