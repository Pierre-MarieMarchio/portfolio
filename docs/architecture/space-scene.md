# Space scene

knowledge-date: 2026-10-05
knowledge-commit: b299e1d

## docs/architecture/organisation.md — Les composants

- ObservatorySceneComponent translates view and slugs into a scene direction through scene-direction.rules — `src/app/features/observatory/components/observatory-scene/observatory-scene.component.ts:66` — origin: docs/architecture/organisation.md:686 @ b299e1d
- Index frames overview with the selection ringed, bodies shown and tags — `src/app/features/observatory/rules/scene-direction.rules.ts:49` — origin: docs/architecture/organisation.md:695 @ b299e1d
- Sheet approaches the project with chapter as step, bodies shown, no turning — `src/app/features/observatory/rules/scene-direction.rules.ts:62` — origin: docs/architecture/organisation.md:696 @ b299e1d
- About frames aside with bodies hidden, no labels, figures shown and the section as lit figure — `src/app/features/observatory/rules/scene-direction.rules.ts:74` — origin: docs/architecture/organisation.md:697 @ b299e1d
- Not-found frames overview with bodies hidden, no labels, no turning — `src/app/features/observatory/rules/scene-direction.rules.ts:87` — origin: docs/architecture/organisation.md:698 @ b299e1d
- Hover becomes emphasised everywhere, preview only counts on home, bodies past the featured count are faint — `src/app/features/observatory/rules/scene-direction.rules.ts:37` — origin: docs/architecture/organisation.md:700 @ b299e1d
- On the index a label is the rank number — `src/app/features/observatory/rules/scene-direction.rules.ts:123` — origin: docs/architecture/organisation.md:701 @ b299e1d
- Planet buttons are projected on home and index and SCENE_SURROUNDINGS is provided by SceneSurroundingsService reading LayoutAnchorsService — `src/app/features/observatory/components/observatory-scene/observatory-scene.component.ts:25` — origin: docs/architecture/organisation.md:702 @ b299e1d
- The click ending a drag is absorbed by TurnGestureDirective (directive outside the zone) — origin: docs/architecture/organisation.md:709 @ b299e1d — status: declared

## docs/architecture/organisation.md — La scène qu'il anime : `shared/space-scene/`

- SpaceSceneComponent starts and stops the scene and passes bodies, direction and figure names — `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:194` — origin: docs/architecture/organisation.md:761 @ b299e1d
- SceneLookService and SceneTargetsService are provided by SpaceSceneComponent — `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:52` — origin: docs/architecture/organisation.md:765 @ b299e1d
- SpaceSceneComponent asks FormatCodeService for the phone hole focus and passes it in SceneInputs.holeFocus — `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:62` — origin: docs/architecture/organisation.md:778 @ b299e1d
- One effect of SpaceSceneComponent starts the look once the engine is there, stops it on cleanup and passes the pan — `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:114` — origin: docs/architecture/organisation.md:790 @ b299e1d
- The look is stopped on format change (rule lives in SceneLookService, outside the zone) — origin: docs/architecture/organisation.md:792 @ b299e1d — status: declared
- TurnGestureDirective turns the scene by drag and absorbs the click ending a drag — `src/app/shared/space-scene/directives/turn-gesture.directive.ts:75` — origin: docs/architecture/organisation.md:762 @ b299e1d
- SceneTargetDirective registers an element as a body target — `src/app/shared/space-scene/directives/scene-target.directive.ts:12` — origin: docs/architecture/organisation.md:767 @ b299e1d
- A close-up on an unknown id returns to rest — `src/app/shared/space-scene/rules/scene-state.rules.ts:67` — origin: docs/architecture/organisation.md:809 @ b299e1d
- hole-focus rules are loaded apart for phone — `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:47` — origin: docs/architecture/organisation.md:776 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/trackers/zoom-gesture.tracker.ts`

- Only touch pointers count — `src/app/shared/space-scene/trackers/zoom-gesture.tracker.ts:57` — origin: docs/architecture/raisons/space-scene.md:476 @ b299e1d
- A finger counts on the sky or a scene target and double tap only counts taps on the sky — `src/app/shared/space-scene/trackers/zoom-gesture.tracker.ts:138` — origin: docs/architecture/raisons/space-scene.md:481 @ b299e1d
- Tap under 300 ms and 6 px, double tap within 320 ms and 32 px, a pinched gesture is never a tap — `src/app/shared/space-scene/models/scene-config.model.ts:95` — origin: docs/architecture/raisons/space-scene.md:487 @ b299e1d
- The click after a pinch is absorbed through the click absorber — `src/app/shared/space-scene/trackers/zoom-gesture.tracker.ts:137` — origin: docs/architecture/raisons/space-scene.md:490 @ b299e1d
- A touch is a tap under 300 ms and 6 px; two taps within 320 ms and 32 px make a double tap — `src/app/shared/space-scene/models/scene-config.model.ts:95` — origin: docs/architecture/raisons/space-scene.md:487 @ b299e1d
- The click swallowed after a pinch goes through ClickAbsorberService, shared with the object turn, one listener at a time — `src/app/shared/space-scene/services/click-absorber.service.ts:11` — origin: docs/architecture/raisons/space-scene.md:490 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/components/space-scene/space-scene.component.scss`

- On phone and tablet the sky canvas takes the pointer with touch-action none — `src/app/shared/space-scene/components/space-scene/space-scene.component.scss:33` — origin: docs/architecture/raisons/space-scene.md:496 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/pages/observatory/observatory-page.component.ts`, le lien aux fenêtres

- The scene re-measures as soon as a window is dragged — `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:251` — origin: docs/architecture/raisons/space-scene.md:628 @ b299e1d
- onLive is fed by WindowFrameTracker at each moveTo and placeAt — `src/app/shared/windows/trackers/window-frame.tracker.ts:151` — origin: docs/architecture/raisons/space-scene.md:629 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/components/space-scene/space-scene.component.ts`

- measure() skips a panel whose computed visibility is hidden — `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:300` — origin: docs/architecture/raisons/space-scene.md:676 @ b299e1d

## docs/architecture/decisions.md — 2026-09-27 — La traversée et la carte sont l'arrivée par l'accueil (D41)

- D41 revealed is carried by landed in the direction — `src/app/features/observatory/rules/scene-direction.rules.ts:39` — origin: docs/architecture/decisions.md:1242 @ b299e1d
- Revealed at opening means no crossing: the scene opens posed and the crossing is skipped — `src/app/shared/space-scene/engine/motions/scene.motion.ts:73` — origin: docs/architecture/decisions.md:1244 @ b299e1d
- Opening on another view fades the matter in over 0.6 s — `src/app/shared/space-scene/engine/motions/scene.motion.ts:14` — origin: docs/architecture/decisions.md:1240 @ b299e1d
- Revealed during the crossing finishes it in 0.9 s at most through an accelerated clock without changing its curves — `src/app/shared/space-scene/engine/motions/scene.motion.ts:64` — origin: docs/architecture/decisions.md:1241 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — L'intro se passe d'un geste, aucun geste ne se perd, et la scène se pose à la fin (D80, amende D41)

- D80 Skip the intro is shown while the intro holds the rest — `src/app/features/observatory/components/intro-skip/intro-skip.component.html:1` — origin: docs/architecture/decisions.md:2453 @ b299e1d

## docs/architecture/decisions.md — 2026-10-03 — Au téléphone, la visite des planètes nomme sans viser, et la scène se cale sur la place finale d'un panneau qui entre (D103, complète D80)

- D103 on phone the tour emphasises while the camera aims the designated planet first — `src/app/features/observatory/rules/scene-direction.rules.ts:106` — origin: docs/architecture/decisions.md:3082 @ b299e1d
- The scene distinguishes the emphasised planet (name and light) from the aimed planet (what the camera frames at rest) — `src/app/shared/space-scene/rules/scene-state.rules.ts:14` — origin: docs/architecture/decisions.md:3080 @ b299e1d
- A panel animating in is measured at its final place and identical pieces no longer restart the reframing (not located in rules; layout-change.rules.ts only filters paint-only transitions) — origin: docs/architecture/decisions.md:3085 @ b299e1d — status: declared
- D103: the scene distinguishes the highlighted planet (emphasised) from the aimed planet (aimed, line 39) — `src/app/shared/space-scene/models/scene.model.ts:38` — origin: docs/architecture/decisions.md:3080 @ b299e1d
- D103: a panel animating in is measured at the place its animation will leave it, and identical pieces no longer relaunch reframing (mechanism not found in the zone files read) — origin: docs/architecture/decisions.md:3083 @ b299e1d — status: declared

## docs/architecture/organisation.md — 3.4 Les rôles permis dans chaque zone

- shared/space-scene may hold components directives services engine rules trackers models ports — `src/app/shared/space-scene/directives/index.ts:1` — origin: docs/architecture/organisation.md:255 @ b299e1d

## docs/architecture/organisation.md — 5. Arborescence

- The rules tree lists the 8 top-level rules files and subfolders as on disk — `src/app/shared/space-scene/rules/scene-state.rules.ts:78` — origin: docs/architecture/organisation.md:1016 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/rules/scene-bodies.rules.ts`

- Seven reference orbits from the export — `src/app/shared/space-scene/rules/scene-bodies.rules.ts:221` — origin: docs/architecture/raisons/space-scene.md:8 @ b299e1d
- On phone orbits measured at growth 2, min 3.2 and max 4.8 radii — `src/app/shared/space-scene/rules/scene-bodies.rules.ts:176` — origin: docs/architecture/raisons/space-scene.md:10 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/rules/scene-layout.rules.ts`

- A bottom band covers at least 90 percent width with top below mid-screen — `src/app/shared/space-scene/rules/scene-layout.rules.ts:19` — origin: docs/architecture/raisons/space-scene.md:22 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/rules/camera/rest-frame.rules.ts`

- Upright rest raised with elevation 0.6 and roll -0.45 — `src/app/shared/space-scene/rules/camera/rest-frame.rules.ts:33` — origin: docs/architecture/raisons/space-scene.md:76 @ b299e1d
- The rest scale ceiling is 0.42 and its floor 0.07 — `src/app/shared/space-scene/models/scene-config.model.ts:83` — origin: docs/architecture/raisons/space-scene.md:76 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/rules/camera/free-sky.rules.ts`

- Whole object keeps 28 px margin, 16 px gap, growth capped at 2 — `src/app/shared/space-scene/rules/camera/free-sky.rules.ts:15` — origin: docs/architecture/raisons/space-scene.md:93 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/rules/scene-bodies.rules.ts`, la vitesse

- Orbit speed computed on a radius of at least 0.1 — `src/app/shared/space-scene/rules/scene-bodies.rules.ts:174` — origin: docs/architecture/raisons/space-scene.md:134 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/rules/figures/figure-arrangement.rules.ts`

- Figures try 82 places on a 9x9 grid with a shared scale from 1 to 0.42 — `src/app/shared/space-scene/rules/figures/figure-arrangement.rules.ts:29` — origin: docs/architecture/raisons/space-scene.md:199 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/rules/figures/figure-target.rules.ts`

- A figure target is at least 44 x 44 px — `src/app/shared/space-scene/models/scene-config.model.ts:106` — origin: docs/architecture/raisons/space-scene.md:228 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/rules/sky/star-field.rules.ts`

- One star per 3600 px2, phone counted at ratio 2 — `src/app/shared/space-scene/models/scene-config.model.ts:68` — origin: docs/architecture/raisons/space-scene.md:402 @ b299e1d
- One star per 3600 px2; on phone counted at ratio 2, the ratio before the 1.5 cap — `src/app/shared/space-scene/models/scene-config.model.ts:68` — origin: docs/architecture/raisons/space-scene.md:402 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/rules/rooms/window-room.rules.ts`, le miroir progressif

- mirrorTurnStep turns at a bounded 0.6 rad/s — `src/app/shared/space-scene/rules/rooms/window-room.rules.ts:180` — origin: docs/architecture/raisons/space-scene.md:581 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/rules/camera/camera-frames.rules.ts`, l'arrêt sous le pixel

- settledStep snaps to the target under 0.5 CSS px — `src/app/shared/space-scene/rules/camera/camera-frames.rules.ts:60` — origin: docs/architecture/raisons/space-scene.md:596 @ b299e1d

## docs/architecture/decisions.md — 2026-09-24 — La caméra cadre au-dessus d'un panneau du bas (D26)

- A bottom band is a panel at least 90 percent of the viewport width whose top is below the middle (isBottomBand in scene-layout.rules.ts) — `src/app/shared/space-scene/rules/scene-layout.rules.ts:19` — origin: docs/architecture/decisions.md:649 @ b299e1d
- SceneLayout carries approachBandTop and closeUpBandTop, null when the anchor is not a bottom band — `src/app/shared/space-scene/rules/scene-layout.rules.ts:84` — origin: docs/architecture/decisions.md:650 @ b299e1d
- The grain reserve is drawn once for full density and the lit share follows the viewport area (densityShare) — `src/app/shared/space-scene/rules/matter/grain-reserve.rules.ts:20` — origin: docs/architecture/decisions.md:656 @ b299e1d
- The density share moves to its new value with a 0.55 s half-life (engine file, outside rules zone) — `src/app/shared/space-scene/engine/motions/grains.motion.ts:11` — origin: docs/architecture/decisions.md:658 @ b299e1d
- D26: the grain reserve is drawn once, for the full density, at engine construction — `src/app/shared/space-scene/engine/space-scene.engine.ts:83` — origin: docs/architecture/decisions.md:656 @ b299e1d
- D26: the lit share follows the viewport area (densityShare), recomputed on resize and eased with a 0.55 s half-life (grains.motion.ts:11 and :81) — `src/app/shared/space-scene/engine/space-scene.engine.ts:164` — origin: docs/architecture/decisions.md:657 @ b299e1d
- D26: the phone golden PHONE_LAYOUT carries its bottom band, a close-up scene is added, five phone fingerprints (golden.spec.ts:335-339) — `src/app/shared/space-scene/engine/space-scene.engine.golden.spec.ts:115` — origin: docs/architecture/decisions.md:659 @ b299e1d
- SceneLayout carries the bottom band top (approachBandTop, closeUpBandTop), null otherwise (every SceneLayout field is mandatory, #203) — `src/app/shared/space-scene/models/scene-layout.model.ts:19` — origin: docs/architecture/decisions.md:651 @ b299e1d

## docs/architecture/decisions.md — 2026-09-25 — Chaque vue cadre dans le ciel libre (D29, étend D26)

- The engine recognises a bottom band whatever the window role (panelBandTop) and a side panel on an upright screen (sidePanelLeft) — `src/app/shared/space-scene/rules/scene-layout.rules.ts:134` — origin: docs/architecture/decisions.md:765 @ b299e1d
- Overview, side view and not-found centre the object in the free sky and fit it so the outermost orbit holds (free-sky.rules.ts) — `src/app/shared/space-scene/rules/camera/free-sky.rules.ts:62` — origin: docs/architecture/decisions.md:770 @ b299e1d
- At home rest on an upright screen the camera looks from higher up, elevation up to 0.6 — `src/app/shared/space-scene/rules/camera/rest-frame.rules.ts:33` — origin: docs/architecture/decisions.md:776 @ b299e1d
- D29: the scene writes the hole centre and radius as data-hole-* only when they change — `src/app/shared/space-scene/engine/renderers/hole-mark.renderer.ts:43` — origin: docs/architecture/decisions.md:777 @ b299e1d
- The engine recognises a bottom band whatever the window role (panelBandTop) and a side panel on a portrait screen (sidePanelLeft) — `src/app/shared/space-scene/models/scene-layout.model.ts:21` — origin: docs/architecture/decisions.md:766 @ b299e1d

## docs/architecture/decisions.md — 2026-09-25 — L'accueil se pose dans le ciel que le chrome laisse (D30, étend D29)

- Home rest falls back to the centre of the largest free sky rectangle (restInFreeSky) — `src/app/shared/space-scene/rules/camera/free-sky.rules.ts:216` — origin: docs/architecture/decisions.md:799 @ b299e1d
- Home title, contact rail and dock register under a chrome role and with the two bars form SceneLayout.chrome — `src/app/shared/space-scene/rules/scene-layout.rules.ts:46` — origin: docs/architecture/decisions.md:794 @ b299e1d
- D30: the home title and the dock register with the scene under the chrome role (html:269 for the dock) — `src/app/pages/observatory/observatory-page.component.html:35` — origin: docs/architecture/decisions.md:793 @ b299e1d
- D30: the home rest goes through restInFreeSky when the layout is set — `src/app/shared/space-scene/engine/space-scene.engine.ts:134` — origin: docs/architecture/decisions.md:799 @ b299e1d
- Home title, contact rail and dock register with the scene under a chrome role and with the two bars form SceneLayout.chrome (role chrome in ScenePanelRole :31 and SceneAnchorKind, features/common/models/scene-anchors.model.ts:2; used at observatory-page.component.html:35 and :269) — `src/app/shared/space-scene/models/scene-layout.model.ts:26` — origin: docs/architecture/decisions.md:793 @ b299e1d

## docs/architecture/decisions.md — 2026-09-25 — Couché, le ciel commence sous la barre et finit à la vitre (D31, étend D29 et D30)

- A lying glass is recognised by geometry alone: on a landscape screen a side panel flush with the right and bottom edges (cornerPanelLeft) — `src/app/shared/space-scene/rules/scene-layout.rules.ts:122` — origin: docs/architecture/decisions.md:832 @ b299e1d
- SceneLayout keeps the top bar box (topBar) — `src/app/shared/space-scene/rules/scene-layout.rules.ts:80` — origin: docs/architecture/decisions.md:835 @ b299e1d
- D31: the engine also keeps the top bar box (topBar) — `src/app/shared/space-scene/engine/space-scene.engine.ts:144` — origin: docs/architecture/decisions.md:834 @ b299e1d
- The engine recognises a lying glass by its geometry (cornerPanelLeft) and keeps the top bar box (topBar, :25) — `src/app/shared/space-scene/models/scene-layout.model.ts:23` — origin: docs/architecture/decisions.md:834 @ b299e1d

## docs/architecture/decisions.md — 2026-09-25 — Au doigt, on regarde l'objet de près (D32)

- Pinch zoom factor is bounded to [1, 3]; double tap close look is x2.2 (ZOOM_MIN/ZOOM_MAX/CLOSE_LOOK in zoom.rules.ts) — `src/app/shared/space-scene/models/scene-config.model.ts:84` — origin: docs/architecture/decisions.md:868 @ b299e1d
- The point under the fingers stays under them (zoomedAt/anchorKeeping) — `src/app/shared/space-scene/rules/camera/zoom.rules.ts:12` — origin: docs/architecture/decisions.md:869 @ b299e1d
- Double tap close look is only available at home rest (canLookCloser requires framing rest) — `src/app/shared/space-scene/rules/camera/zoom.rules.ts:43` — origin: docs/architecture/decisions.md:876 @ b299e1d
- The factor returns to 1 at each framing change (isSameFraming compares framing, framed, step, litFigure) — `src/app/shared/space-scene/rules/camera/zoom.rules.ts:37` — origin: docs/architecture/decisions.md:877 @ b299e1d
- The factor never shifts the sky beyond the canvas edge, and at 1 there is no shift — `src/app/shared/space-scene/rules/camera/zoom.rules.ts:33` — origin: docs/architecture/decisions.md:909 @ b299e1d
- The object turn follows only the pointer that started it (pointerId held; grab only on the primary pointer) — `src/app/shared/space-scene/directives/turn-gesture.directive.ts:52` — origin: docs/architecture/decisions.md:888 @ b299e1d
- A finger on a window, the chrome, a link or a field keeps its gestures; a finger on the sky or a planet target counts (isOnScene excludes [data-panel], a, input, textarea, select) — `src/app/shared/space-scene/rules/gestures/sky-touch.rules.ts:1` — origin: docs/architecture/decisions.md:871 @ b299e1d
- D32: a pinch multiplies the drawn scale and keeps the point under the fingers midpoint under them (tracker zoom-gesture.tracker.ts:118-119) — `src/app/shared/space-scene/engine/motions/zoom.motion.ts:85` — origin: docs/architecture/decisions.md:867 @ b299e1d
- D32: once a second finger joined, the click that follows is swallowed — `src/app/shared/space-scene/trackers/zoom-gesture.tracker.ts:137` — origin: docs/architecture/decisions.md:874 @ b299e1d
- D32: releasing keeps the factor — `src/app/shared/space-scene/engine/motions/zoom.motion.ts:91` — origin: docs/architecture/decisions.md:875 @ b299e1d
- D32: a double tap toggles between the view framing and a close look centred on the hole (zoom.motion.ts:95-105; tracker:153) — `src/app/shared/space-scene/engine/space-scene.engine.ts:246` — origin: docs/architecture/decisions.md:876 @ b299e1d
- D32: the factor returns to 1 with damping on each framing change and canvas resize (zoom.motion.ts:50-60 and :110) — `src/app/shared/space-scene/engine/motions/scene.motion.ts:58` — origin: docs/architecture/decisions.md:877 @ b299e1d
- D32: under reduced motion the zoom applies without damping — `src/app/shared/space-scene/engine/motions/zoom.motion.ts:110` — origin: docs/architecture/decisions.md:880 @ b299e1d
- D32: the factor is laid after the camera (ZoomMotion.lay), data-hole reflects it, at 1 nothing changes (zoom.motion.ts:122 and :136) — `src/app/shared/space-scene/engine/motions/scene.motion.ts:99` — origin: docs/architecture/decisions.md:881 @ b299e1d
- D32: a second finger ends the turn (grabZoom releases the turntable) — `src/app/shared/space-scene/engine/space-scene.engine.ts:223` — origin: docs/architecture/decisions.md:887 @ b299e1d
- The pinch factor is bounded to [1, 3] and the home double tap gives a close look at x2.2 — `src/app/shared/space-scene/models/scene-config.model.ts:84` — origin: docs/architecture/decisions.md:868 @ b299e1d

## docs/architecture/decisions.md — 2026-09-26 — Au doigt, les noms évitent le disque ; le ciel libre range la figure et reprend la vitre repliée (D33, étend D29 à D31)

- The drawn disc is the ellipse of 2.4 radii (drawnDisc, DISC_REACH) — `src/app/shared/space-scene/rules/camera/pointer.rules.ts:24` — origin: docs/architecture/decisions.md:920 @ b299e1d
- A collapsed lying glass is read as a corner band (cornerBandTop) — `src/app/shared/space-scene/rules/scene-layout.rules.ts:125` — origin: docs/architecture/decisions.md:926 @ b299e1d
- D33: camera arrived and on touch, a planet name avoids the drawn disc and the other planets' buttons (:156-157) — `src/app/shared/space-scene/engine/renderers/planet-labels.renderer.ts:145` — origin: docs/architecture/decisions.md:919 @ b299e1d
- D33: the drawn disc is written as data-disc-* (from drawnDisc, :31) — `src/app/shared/space-scene/engine/renderers/hole-mark.renderer.ts:9` — origin: docs/architecture/decisions.md:920 @ b299e1d
- Lying, the folded glass is read as a corner band (cornerBandTop) and the scene takes the full width above — `src/app/shared/space-scene/models/scene-layout.model.ts:24` — origin: docs/architecture/decisions.md:926 @ b299e1d

## docs/architecture/decisions.md — 2026-09-26 — Au téléphone, le trou noir est le sujet ; les noms se font rares (D35, étend D33, amende D29 à D31)

- On phone the hole grows up to twice its radius while its disc holds in a free room 12 px from chrome, glass and edges (PLACING growth 2, margin 12) — `src/app/shared/space-scene/rules/focus/focus-rows.rules.ts:16` — origin: docs/architecture/decisions.md:974 @ b299e1d
- Phone orbits adjust to the grown hole, no closer than 3.2 radii for the nearest nor 4.8 for the farthest — `src/app/shared/space-scene/rules/scene-bodies.rules.ts:176` — origin: docs/architecture/decisions.md:977 @ b299e1d
- holeRoomBeside and closeUpClearOfChrome were removed (no occurrence under rules at HEAD; hole framing lives in hole-focus.rules.ts) — `src/app/shared/space-scene/rules/hole-focus.rules.ts:114` — origin: docs/architecture/decisions.md:1003 @ b299e1d
- D35: the engine receives a format input that replaces touch, and touch derives from it (engine uses state.touch and state.phone, space-scene.engine.ts:98 and :275) — `src/app/shared/space-scene/engine/space-scene.engine.golden.spec.ts:197` — origin: docs/architecture/decisions.md:969 @ b299e1d
- D35: on phone each view grows the hole up to twice its radius within free sky, 12 px from chrome (hole-focus.rules.ts is outside the zone; engine only wires it at space-scene.engine.ts:96) — origin: docs/architecture/decisions.md:973 @ b299e1d — status: declared
- D35: only the planet that counts is named (labels call isNamed(frame.focus) at planet-labels.renderer.ts:281; the rule is outside the zone) — origin: docs/architecture/decisions.md:979 @ b299e1d — status: declared
- D35: the scene writes where the target planet is drawn (data-target-x, data-target-y) — `src/app/shared/space-scene/engine/renderers/hole-mark.renderer.ts:12` — origin: docs/architecture/decisions.md:985 @ b299e1d
- D35: holeRoomBeside and closeUpClearOfChrome are removed (no occurrence in src/; phone rules go through framing.holeFocus) — `src/app/shared/space-scene/engine/space-scene.engine.ts:325` — origin: docs/architecture/decisions.md:1003 @ b299e1d
- The engine receives the format through a format input that replaces touch — `src/app/shared/space-scene/models/scene.model.ts:66` — origin: docs/architecture/decisions.md:970 @ b299e1d

## docs/architecture/decisions.md — 2026-09-27 — Au doigt, la scène dessine à 60 i/s au plus ; au téléphone, moins de pixels et de grains (D36)

- On phone and tablet the loop never draws two frames less than 10.5 ms apart (engine file, outside rules zone) — `src/app/shared/space-scene/engine/frame-loop.engine.ts:9` — origin: docs/architecture/decisions.md:1023 @ b299e1d
- On phone only the canvas caps at a pixel ratio of 1.5 instead of 2 — `src/app/shared/space-scene/rules/canvas-resolution.rules.ts:23` — origin: docs/architecture/decisions.md:1026 @ b299e1d
- The lit grain share on phone is 0.6 times the desktop share at all times (litShare times phoneShare) — `src/app/shared/space-scene/rules/matter/grain-reserve.rules.ts:36` — origin: docs/architecture/decisions.md:1027 @ b299e1d
- The phone sky keeps the star count it would have at a ratio of 2 (phoneStarRatio 2) — `src/app/shared/space-scene/rules/sky/star-field.rules.ts:39` — origin: docs/architecture/decisions.md:1028 @ b299e1d
- Crossing trails are grouped by tone, brightness step and thickness step; tail at half brightness (TRAIL_TAIL_LIGHT 0.5) — `src/app/shared/space-scene/rules/sky/trail-steps.rules.ts:21` — origin: docs/architecture/decisions.md:1030 @ b299e1d
- A trail takes the nearest brightness step upward, never paler than its gradient (thickness step is rounded to nearest, not upward) — `src/app/shared/space-scene/rules/sky/trail-steps.rules.ts:13` — origin: docs/architecture/decisions.md:1033 @ b299e1d
- The density floor is 0.42 — `src/app/shared/space-scene/rules/matter/grain-reserve.rules.ts:23` — origin: docs/architecture/decisions.md:1048 @ b299e1d
- At touch formats the loop never draws two frames less than 10.5 ms apart — `src/app/shared/space-scene/engine/frame-loop.engine.ts:9` — origin: docs/architecture/decisions.md:1022 @ b299e1d
- The time step covers the whole interval — `src/app/shared/space-scene/engine/frame-loop.engine.ts:67` — origin: docs/architecture/decisions.md:1025 @ b299e1d
- D36: on phone trails are grouped by tint, brightness step and width step, each group drawn in one stroke (:58-67, :37) — `src/app/shared/space-scene/engine/renderers/sky/trail-batch.renderer.ts:47` — origin: docs/architecture/decisions.md:1030 @ b299e1d
- D36: trail batching is phone only; other formats keep one stroke per trail (strokeTrail) — `src/app/shared/space-scene/engine/renderers/sky/star-sky.renderer.ts:223` — origin: docs/architecture/decisions.md:1031 @ b299e1d
- D36: the head is drawn at full brightness and the tail at a reduced light (TRAIL_TAIL_LIGHT; the half value lives in rules) — `src/app/shared/space-scene/engine/renderers/sky/trail-batch.renderer.ts:54` — origin: docs/architecture/decisions.md:1032 @ b299e1d
- At phone and tablet the scene never draws two frames less than 10.5 ms apart (cited outside zone, engine/) — `src/app/shared/space-scene/engine/frame-loop.engine.ts:9` — origin: docs/architecture/decisions.md:1022 @ b299e1d
- At phone only the canvas caps its pixel ratio at 1.5 instead of 2 — `src/app/shared/space-scene/models/scene-config.model.ts:78` — origin: docs/architecture/decisions.md:1026 @ b299e1d
- At phone the lit share of grains is 0.6 times the desktop one — `src/app/shared/space-scene/models/scene-config.model.ts:59` — origin: docs/architecture/decisions.md:1027 @ b299e1d
- At phone the sky keeps the star count it would have at a ratio of 2 — `src/app/shared/space-scene/models/scene-config.model.ts:69` — origin: docs/architecture/decisions.md:1029 @ b299e1d

## docs/architecture/decisions.md — 2026-09-27 — Le code propre au téléphone se charge à part (D39, amende D37)

- free-sky.rules.ts serves the upright tablet too and stays in the initial bundle (imported by space-scene.engine.ts and body-framing.rules.ts besides the lazy hole-focus; bundle placement not measured) — `src/app/shared/space-scene/rules/camera/free-sky.rules.ts:17` — origin: docs/architecture/decisions.md:1199 @ b299e1d
- The engine receives the hole-focus rule with its inputs as SceneInputs.holeFocus, null meaning frame as without it — `src/app/shared/space-scene/engine/space-scene.engine.ts:96` — origin: docs/architecture/decisions.md:1173 @ b299e1d

## docs/architecture/decisions.md — 2026-09-27 — À l'à-propos, les quatre figures se voient, se rangent au téléphone et se touchent (D42, étend D33)

- In the about view an unlit figure draws at 45 percent (20 percent elsewhere); hovered on desktop 70 percent (figures.light unlit 0.2, unlitWhenShown 0.45, hovered 0.7) — `src/app/shared/space-scene/models/scene-config.model.ts:109` — origin: docs/architecture/decisions.md:1262 @ b299e1d
- On phone the three unlit figures are arranged 10 px apart around the lit one — `src/app/shared/space-scene/rules/figures/phone-figures.rules.ts:45` — origin: docs/architecture/decisions.md:1267 @ b299e1d
- Common figure scale steps down from 1 to 0.42 only if needed (SCALES 1, 0.9 ... 0.42) — `src/app/shared/space-scene/rules/figures/figure-arrangement.rules.ts:29` — origin: docs/architecture/decisions.md:1269 @ b299e1d
- A button per figure covers its box at least 44 x 44 px (figures.targetMin 44) — `src/app/shared/space-scene/models/scene-config.model.ts:106` — origin: docs/architecture/decisions.md:1276 @ b299e1d
- A drag of more than 6 px is not a click (gestures.dragPx 6) — `src/app/shared/space-scene/models/scene-config.model.ts:95` — origin: docs/architecture/decisions.md:1284 @ b299e1d
- Phone figure arrangement joins the phone lazy chunk (phone-figures.rules is a value import only of hole-focus.rules.ts; body-framing and constellations.renderer import it as type only) — `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:47` — origin: docs/architecture/decisions.md:1275 @ b299e1d
- In the about view an unlit figure is drawn at 45 percent (20 percent otherwise) and its stars 25 percent larger, the lit one unchanged — `src/app/shared/space-scene/engine/renderers/sky/constellations.renderer.ts:74` — origin: docs/architecture/decisions.md:1262 @ b299e1d
- Outside the about view the fade restarts from the former 20 percent — `src/app/shared/space-scene/engine/renderers/sky/constellations.renderer.ts:109` — origin: docs/architecture/decisions.md:1264 @ b299e1d
- The phone figure arrangement is part of the lazy phone chunk (read from frame.phoneRules, i.e. the hole-focus rules) — `src/app/shared/space-scene/engine/renderers/sky/constellations.renderer.ts:238` — origin: docs/architecture/decisions.md:1275 @ b299e1d
- On the phone figures no longer drift nor follow parallax: placement comes from the phone arrangement instead of figurePoints — `src/app/shared/space-scene/engine/renderers/sky/constellations.renderer.ts:115` — origin: docs/architecture/decisions.md:1273 @ b299e1d
- One button per figure is positioned by transform from the drawing — `src/app/shared/space-scene/engine/renderers/sky/figure-targets.renderer.ts:9` — origin: docs/architecture/decisions.md:1277 @ b299e1d
- An inert figure target is out of the tab order and aria-hidden — `src/app/shared/space-scene/engine/renderers/sky/figure-targets.renderer.ts:32` — origin: docs/architecture/decisions.md:1278 @ b299e1d
- On desktop a hovered unlit figure rises to 70 percent (hovered light 0.7 in SCENE_CONFIG) — `src/app/shared/space-scene/engine/renderers/sky/constellations.renderer.ts:133` — origin: docs/architecture/decisions.md:1287 @ b299e1d
- The loop no longer stops before the end of the figure fade even when paused (figures is an eased camera pose key at camera.motion.ts:39 but the pause path of frame-loop.engine.ts was not traced) — origin: docs/architecture/decisions.md:1288 @ b299e1d — status: declared
- In the about view an unlit figure is drawn at 45 percent (20 percent before) — `src/app/shared/space-scene/models/scene-config.model.ts:51` — origin: docs/architecture/decisions.md:1261 @ b299e1d
- One button per figure covers the figure box, at least 44 x 44 px — `src/app/shared/space-scene/models/scene-config.model.ts:106` — origin: docs/architecture/decisions.md:1276 @ b299e1d
- A drag over 6 px is not a click — `src/app/shared/space-scene/models/scene-config.model.ts:95` — origin: docs/architecture/decisions.md:1284 @ b299e1d
- On desktop under the pointer an unlit figure rises to 70 percent — `src/app/shared/space-scene/models/scene-config.model.ts:109` — origin: docs/architecture/decisions.md:1287 @ b299e1d

## docs/architecture/decisions.md — 2026-09-27 — Au bureau, la molette rapproche et le clic molette déplace la caméra (D43, étend D32, amende D39)

- A wheel notch is x1.1 for 100 px, 3 lines or one page; small trackpad deltas zoom proportionally less (wheelRatio) — `src/app/shared/space-scene/rules/gestures/sky-look.rules.ts:6` — origin: docs/architecture/decisions.md:1317 @ b299e1d
- Middle-button pan is bounded so the hole centre stays inside the canvas (panWithin) — `src/app/shared/space-scene/rules/gestures/sky-look.rules.ts:11` — origin: docs/architecture/decisions.md:1320 @ b299e1d
- Desktop wheel and middle click live in SkyLookTracker, SkyPanMotion and rules/gestures/sky-look.rules.ts, next to sky-touch.rules.ts — `src/app/shared/space-scene/rules/gestures/sky-look.rules.ts:1` — origin: docs/architecture/decisions.md:1340 @ b299e1d
- sky-touch.rules.ts is shared by the object turn directive and both gesture trackers (3 importers: turn-gesture.directive, zoom-gesture.tracker, sky-look.tracker) — `src/app/shared/space-scene/directives/turn-gesture.directive.ts:4` — origin: docs/architecture/decisions.md:1381 @ b299e1d
- Pinch and double tap become ZoomGestureTracker in shared/space-scene/trackers — `src/app/shared/space-scene/trackers/zoom-gesture.tracker.ts:24` — origin: docs/architecture/decisions.md:1338 @ b299e1d
- Desktop wheel and middle-click are SkyLookTracker with SkyPanMotion — `src/app/shared/space-scene/trackers/sky-look.tracker.ts:14` — origin: docs/architecture/decisions.md:1340 @ b299e1d
- The wheel uses the same bounded factor as the pinch (clampZoom) — `src/app/shared/space-scene/engine/motions/zoom.motion.ts:84` — origin: docs/architecture/decisions.md:1317 @ b299e1d
- Holding the middle button on the sky moves the camera and the drawing follows the pointer, releasing keeps the offset — `src/app/shared/space-scene/trackers/sky-look.tracker.ts:87` — origin: docs/architecture/decisions.md:1320 @ b299e1d
- The pan is bounded so the hole center stays in the canvas (panWithin) — `src/app/shared/space-scene/engine/motions/sky-pan.motion.ts:58` — origin: docs/architecture/decisions.md:1321 @ b299e1d
- The offset is laid after the factor and the wheel zooms around the point seen under the pointer — `src/app/shared/space-scene/engine/motions/zoom.motion.ts:125` — origin: docs/architecture/decisions.md:1322 @ b299e1d
- A middle click without dragging does nothing — `src/app/shared/space-scene/trackers/sky-look.tracker.ts:75` — origin: docs/architecture/decisions.md:1326 @ b299e1d
- Factor and offset return to 1 and 0 with camera damping at each framing change and canvas resize, without damping under reduced motion — `src/app/shared/space-scene/engine/motions/scene.motion.ts:57` — origin: docs/architecture/decisions.md:1327 @ b299e1d
- With zero offset the image is the one from before so goldens do not move — `src/app/shared/space-scene/engine/motions/sky-pan.motion.ts:54` — origin: docs/architecture/decisions.md:1329 @ b299e1d
- A finger on a planet or a figure can start a pinch (isOnScene, not only isOnSky) — `src/app/shared/space-scene/trackers/zoom-gesture.tracker.ts:57` — origin: docs/architecture/decisions.md:1345 @ b299e1d
- The click after a pinch is swallowed — `src/app/shared/space-scene/trackers/zoom-gesture.tracker.ts:137` — origin: docs/architecture/decisions.md:1346 @ b299e1d
- The engine receives the desktop offset with its inputs (SceneInputs.pan) and lays it through the ZoomMotion.pan hook — `src/app/shared/space-scene/engine/motions/zoom.motion.ts:32` — origin: docs/architecture/decisions.md:1351 @ b299e1d
- On desktop the wheel zooms within the pinch bounds [1, 3], one notch worth x1.1 (zoom bounds at :84) — `src/app/shared/space-scene/models/scene-config.model.ts:99` — origin: docs/architecture/decisions.md:1316 @ b299e1d
- PhoneCodeService becomes FormatCodeService.load(formats, importer); the touch gestures load for phone and tablet, the sky look for desktop (:31) — `src/app/shared/space-scene/services/scene-look.service.ts:27` — origin: docs/architecture/decisions.md:1332 @ b299e1d
- The zoom-gesture directive becomes ZoomGestureTracker in shared/space-scene/trackers; desktop wheel and middle click are SkyLookTracker (:19) — `src/app/shared/space-scene/services/scene-look.service.ts:14` — origin: docs/architecture/decisions.md:1338 @ b299e1d
- An effect of SpaceSceneComponent starts through SceneLookService the tracker of the current format once the engine and its code are there (start returns null until the code is loaded) — `src/app/shared/space-scene/services/scene-look.service.ts:36` — origin: docs/architecture/decisions.md:1347 @ b299e1d
- The desktop pan offset is handed to the engine with its inputs (SceneInputs.pan) — `src/app/shared/space-scene/models/scene.model.ts:68` — origin: docs/architecture/decisions.md:1351 @ b299e1d
- The tracker is stopped at a format change and at destruction, and the pan offset is given back when the format leaves desktop (lives in SpaceSceneComponent, outside the zone) — origin: docs/architecture/decisions.md:1349 @ b299e1d — status: declared

## docs/architecture/decisions.md — 2026-09-28 — Au téléphone, le cadrage du trou garde ce que la planète n'a pas changé (D44, étend D35)

- The hole-focus rule returns the framing and a FocusMemo that the scene gives back next frame (FramingScene.focusMemo) — `src/app/shared/space-scene/rules/camera/framing/framing.rules.ts:50` — origin: docs/architecture/decisions.md:1400 @ b299e1d
- Group and angle geometry lives in rules/focus/focus-choices.rules.ts, memo and choice in focus-rows.rules.ts; only hole-focus.rules.ts imports them (plus focus-rows importing focus-choices), so they stay in its lazy chunk — `src/app/shared/space-scene/rules/hole-focus.rules.ts:4` — origin: docs/architecture/decisions.md:1402 @ b299e1d
- The hole is exposed as data-hole-x, data-hole-y and data-hole-radius — `src/app/shared/space-scene/engine/renderers/hole-mark.renderer.ts:6` — origin: docs/architecture/decisions.md:1420 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — La scène se dessine dans un worker (D47, amende D11)

- Immediate answers gestures need (can look closer, same framing) come from the same rules applied in the page (zoom.rules canLookCloser/isSameFraming imported by remote-scene.engine.ts) — `src/app/shared/space-scene/engine/remote-scene.engine.ts:4` — origin: docs/architecture/decisions.md:1541 @ b299e1d
- scene.worker.ts runs SpaceSceneEngine unchanged on two OffscreenCanvas — `src/app/shared/space-scene/engine/scene-worker.engine.ts:75` — origin: docs/architecture/decisions.md:1532 @ b299e1d
- In the worker NodeRecorderEngine records DOM writes that travel with each frame — `src/app/shared/space-scene/engine/node-recorder.engine.ts:106` — origin: docs/architecture/decisions.md:1536 @ b299e1d
- RemoteSceneEngine lays the image and the writes in the same page frame — `src/app/shared/space-scene/engine/remote-scene.engine.ts:297` — origin: docs/architecture/decisions.md:1538 @ b299e1d
- Immediate gesture answers come from the same rules applied in the page — `src/app/shared/space-scene/engine/remote-scene.engine.ts:220` — origin: docs/architecture/decisions.md:1540 @ b299e1d
- SkyPanMotion lives in the worker and returns with each frame — `src/app/shared/space-scene/engine/scene-worker.engine.ts:235` — origin: docs/architecture/decisions.md:1543 @ b299e1d
- Otherwise the engine runs in the page, loaded separately — `src/app/shared/space-scene/services/scene-engine.service.ts:85` — origin: docs/architecture/decisions.md:1544 @ b299e1d
- When the browser can draw off the page (Worker, OffscreenCanvas with transferToImageBitmap, a bitmaprenderer canvas) SceneEngineService launches scene.worker (sceneWorker :49, bitmapContext :39, used at scene-engine.service.ts:104 and :143) — `src/app/shared/space-scene/services/animated-canvas.service.ts:30` — origin: docs/architecture/decisions.md:1529 @ b299e1d
- Otherwise the engine runs in the page as before, loaded apart (dynamic import of space-scene.engine) — `src/app/shared/space-scene/services/scene-engine.service.ts:85` — origin: docs/architecture/decisions.md:1544 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Les réglages de la scène tiennent dans un fichier (D49)

- models/scene-config.model.ts carries SCENE_CONFIG typed by SceneConfig, grouped by theme (matter, sky, canvas, camera, hand, gestures, planets, figures) — `src/app/shared/space-scene/models/scene-config.model.ts:55` — origin: docs/architecture/decisions.md:1597 @ b299e1d
- Each rules file keeps the name of its constant and reads its value from SCENE_CONFIG (D49) — `src/app/shared/space-scene/rules/camera/zoom.rules.ts:5` — origin: docs/architecture/decisions.md:1605 @ b299e1d
- The three 6 px thresholds (hand, figure, tap) are now one value gestures.dragPx — `src/app/shared/space-scene/rules/figures/figure-target.rules.ts:6` — origin: docs/architecture/decisions.md:1606 @ b299e1d
- models/scene-config.model.ts holds SCENE_CONFIG typed by SceneConfig, grouped by theme: matter, sky, canvas, camera — `src/app/shared/space-scene/models/scene-config.model.ts:55` — origin: docs/architecture/decisions.md:1597 @ b299e1d
- D49: scene tuning is grouped in one config by subject: matter, sky, canvas, camera, hand, gestures, planets, figures — `src/app/shared/space-scene/models/scene-config.model.ts:4` — origin: docs/architecture/decisions.md:1600 @ b299e1d
- D49: each file keeps the name of its constant and reads its value from the config (the readers are in engine/, outside the checked zone) — origin: docs/architecture/decisions.md:1604 @ b299e1d — status: declared
- D49: the three 6 px thresholds (hand, figure, tap) are now one value, gestures.dragPx — `src/app/shared/space-scene/models/scene-config.model.ts:95` — origin: docs/architecture/decisions.md:1605 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Les réglages de la scène canvas hors moteur (D18)

- PIXEL_BUDGET (canvas-resolution.rules.ts) is 4.2 million pixels per canvas with a ratio capped at 2 — `src/app/shared/space-scene/models/scene-config.model.ts:76` — origin: docs/architecture/decisions.md:476 @ b299e1d
- PIXEL_BUDGET is 4.2 million pixels per canvas with a ratio capped at 2 (value now held in SCENE_CONFIG.canvas, read by canvas-resolution.rules.ts:5) — `src/app/shared/space-scene/models/scene-config.model.ts:76` — origin: docs/architecture/decisions.md:476 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Les libs de `shared/` testent ce qu'on voit d'elles (D55, étend D54)

- A pure rule is tested in its own file's spec: fitOrbits and the traveling leave the engine and camera specs (traveling side checked) — `src/app/shared/space-scene/rules/camera/traveling.rules.spec.ts:1` — origin: docs/architecture/decisions.md:1743 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — La scène cadre dans le ciel libre, de quelque côté que soient les fenêtres (D66, amende D29 et D65)

- The page gives the scene the shown windows (layout.windows) and the scene keeps the widest free band between them edge to edge — `src/app/shared/space-scene/rules/rooms/window-room.rules.ts:68` — origin: docs/architecture/decisions.md:2069 @ b299e1d
- On a tie the widest-gap search keeps the left band (strict comparison over bands sorted left to right) — `src/app/shared/space-scene/rules/rooms/window-room.rules.ts:43` — origin: docs/architecture/decisions.md:2071 @ b299e1d
- Between two windows or when the hole does not fit its band the whole object is fitted into it (wholeInFreeSky) — `src/app/shared/space-scene/rules/camera/free-sky.rules.ts:62` — origin: docs/architecture/decisions.md:2076 @ b299e1d
- Under 15 percent of the width the scene keeps its last band — `src/app/shared/space-scene/rules/rooms/window-room.rules.ts:74` — origin: docs/architecture/decisions.md:2077 @ b299e1d
- D66: the page gives the scene the windows that are displayed (layout.windows, readonly LayoutBox[]) — `src/app/shared/space-scene/models/scene-layout.model.ts:27` — origin: docs/architecture/decisions.md:2070 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au bureau, le trou noir suit la fenêtre qu'on déplace, et ne se retourne plus d'un bloc (D72, amende D66)

- When the free band changes side tilt and azimuth turn toward their mirror at 0.6 rad/s at most (mirrorTurnStep, defined in rules/rooms/window-room.rules.ts) — `src/app/shared/space-scene/rules/rooms/window-room.rules.ts:180` — origin: docs/architecture/decisions.md:2249 @ b299e1d
- Each camera key settles on its target when less than half a pixel remains (settledStep) — `src/app/shared/space-scene/rules/camera/camera-frames.rules.ts:60` — origin: docs/architecture/decisions.md:2251 @ b299e1d
- framing.rules.ts is filed under rules/camera/framing/ — `src/app/shared/space-scene/rules/camera/framing/framing.rules.ts:96` — origin: docs/architecture/decisions.md:2252 @ b299e1d
- D72: the page passes the moving window rectangle to the scene through the optional port SCENE_WINDOW_DRAG (onDragging line 5 ; injected optional at space-scene.component.ts:59 ; provided by observatory-page.component.ts:135) — `src/app/shared/space-scene/ports/scene-window-drag.port.ts:8` — origin: docs/architecture/decisions.md:2247 @ b299e1d
- D72: during a drag the free band is re-read at most once per image (space-scene.component.ts:252 calls measureSoon on each drag event ; its throttle is outside the zone, not read) — origin: docs/architecture/decisions.md:2244 @ b299e1d — status: declared

## docs/architecture/decisions.md — 2026-09-28 — `core/` et `shared/` ne disent plus un mot du portfolio (D51)

- In the scene isAbout became areFiguresShown after its figuresShown input and the unlit light of shown figures is unlitWhenShown (SceneState.figuresShown; renderer and config outside rules) — `src/app/shared/space-scene/rules/scene-state.rules.ts:20` — origin: docs/architecture/decisions.md:1650 @ b299e1d
- D51: in the scene isAbout became areFiguresShown, named after its input figuresShown — `src/app/shared/space-scene/models/scene.model.ts:42` — origin: docs/architecture/decisions.md:1650 @ b299e1d
- D51: the light of unlit figures when shown is named unlitWhenShown — `src/app/shared/space-scene/models/scene-config.model.ts:51` — origin: docs/architecture/decisions.md:1651 @ b299e1d
- In close-up the camera keeps the 0.55 s half-life while the step stays under 0.8 rad/s of yaw (closeUpTurnRate lives in models and engine, outside the rules zone; not checked) — origin: docs/architecture/decisions.md:2741 @ b299e1d — status: declared

## docs/architecture/decisions.md — 2026-09-23 — Le moteur de l'objet devient des objets (D11)

- The engine is split into single-responsibility classes, one renderer per drawn layer, dependencies passed to the constructor — `src/app/shared/space-scene/engine/renderers/scene.renderer.ts:32` — origin: docs/architecture/decisions.md:291 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/engine/renderers/sky/figure-targets.renderer.ts`

- A target is written as a single cssText string — `src/app/shared/space-scene/engine/renderers/sky/figure-targets.renderer.ts:30` — origin: docs/architecture/raisons/space-scene.md:236 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/engine/motions/camera.motion.ts`

- The camera is arrived when within 0.05 of its aim — `src/app/shared/space-scene/engine/motions/camera.motion.ts:28` — origin: docs/architecture/raisons/space-scene.md:271 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/engine/renderers/hole-mark.renderer.ts`

- The scene writes data-hole-x, data-disc-roll and data-target-x for e2e — `src/app/shared/space-scene/engine/renderers/hole-mark.renderer.ts:6` — origin: docs/architecture/raisons/space-scene.md:281 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/engine/motions/grains.motion.ts`

- Lit grain share converges with a 0.55 s half-life — `src/app/shared/space-scene/engine/motions/grains.motion.ts:11` — origin: docs/architecture/raisons/space-scene.md:334 @ b299e1d
- The matter entry lasts 6.2 s — `src/app/shared/space-scene/models/scene-config.model.ts:60` — origin: docs/architecture/raisons/space-scene.md:339 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/engine/motions/clock.motion.ts`

- A hastened crossing speeds its clock by a pace fixed when the scene settles — `src/app/shared/space-scene/engine/motions/clock.motion.ts:64` — origin: docs/architecture/raisons/space-scene.md:346 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/engine/space-scene.engine.ts`

- A resize draws immediately unless the motion is not drawable yet — `src/app/shared/space-scene/engine/space-scene.engine.ts:157` — origin: docs/architecture/raisons/space-scene.md:355 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/engine/motions/turntable.motion.ts`

- The unheld platter is dragged with a lag DRAG_LAG — `src/app/shared/space-scene/engine/motions/turntable.motion.ts:170` — origin: docs/architecture/raisons/space-scene.md:363 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/engine/motions/star-flow.motion.ts`

- Trails keep only part of the sideways slide TRAIL_SIDEWAYS — `src/app/shared/space-scene/engine/motions/star-flow.motion.ts:245` — origin: docs/architecture/raisons/space-scene.md:372 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/engine/renderers/sky/star-sky.renderer.ts`

- Trail length is measured in seconds — `src/app/shared/space-scene/engine/renderers/sky/star-sky.renderer.ts:21` — origin: docs/architecture/raisons/space-scene.md:383 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/engine/motions/zoom.motion.ts`

- Double tap and reset ease with a 0.55 s half-life and snap within 0.002 — `src/app/shared/space-scene/engine/motions/zoom.motion.ts:110` — origin: docs/architecture/raisons/space-scene.md:454 @ b299e1d
- The hole object is owned and reused — `src/app/shared/space-scene/engine/motions/zoom.motion.ts:31` — origin: docs/architecture/raisons/space-scene.md:462 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/engine/frame-loop.engine.ts`

- The frame loop left the engine and EngineHost stays exported by the engine — `src/app/shared/space-scene/engine/space-scene.engine.ts:36` — origin: docs/architecture/raisons/space-scene.md:504 @ b299e1d
- A frame within 10.5 ms is skipped and requested again and dt starts from the last drawn frame — `src/app/shared/space-scene/engine/frame-loop.engine.ts:60` — origin: docs/architecture/raisons/space-scene.md:507 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/engine/motions/planet-hover/planet-hover.motion.ts`

- Hover slows a planet to a stop in 0.3 s slowSpan — `src/app/shared/space-scene/models/scene-config.model.ts:103` — origin: docs/architecture/raisons/space-scene.md:637 @ b299e1d
- Planet hover slows it to a stop in 0.3 s (SCENE_CONFIG.planets.slowSpan) — `src/app/shared/space-scene/models/scene-config.model.ts:103` — origin: docs/architecture/raisons/space-scene.md:636 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/models/scene-node.model.ts`

- SceneNodeStyle includes zIndex replayed by RemoteSceneEngine — `src/app/shared/space-scene/engine/node-recorder.engine.ts:41` — origin: docs/architecture/raisons/space-scene.md:670 @ b299e1d
- SceneNodeStyle gains zIndex next to transform, opacity and pointerEvents, the small surface the engine writes in the worker and RemoteSceneEngine replays (NodeKey scene-worker.model.ts:10) — `src/app/shared/space-scene/models/scene-node.model.ts:5` — origin: docs/architecture/raisons/space-scene.md:670 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — `shared/` tient des librairies : ui, windows, space-scene (D20)

- D20: the space-scene API speaks of framings, bodies and emphasis, never of site views, projects or chapters (no such word in engine/ or trackers/) — `src/app/shared/space-scene/engine/space-scene.engine.ts:15` — origin: docs/architecture/decisions.md:535 @ b299e1d
- The space-scene API speaks of framings, bodies and highlight, never of site views, projects or chapters (no project/chapter/sheet/featured word in space-scene models, ports, services) — `src/app/shared/space-scene/models/scene-layout.model.ts:30` — origin: docs/architecture/decisions.md:536 @ b299e1d
- The home without preview uses labels none so the scene no longer writes the designated planet name on the sky (LabelStyle none exists in shared/space-scene/models, outside zone) — origin: docs/architecture/decisions.md:1132 @ b299e1d — status: declared

## docs/architecture/raisons/space-scene.md — `src/app/shared/space-scene/ports/scene-window-drag.port.ts`

- space-scene knows nothing of windows — `eslint.config.ts:146` — origin: docs/architecture/raisons/space-scene.md:616 @ b299e1d
- The rank is also the distance of the planet to the centre of the object (scene code outside this zone, not read). — origin: docs/contenu.md:11 @ b299e1d — status: declared

## docs/architecture/decisions.md — 2026-09-29 — Au téléphone, la vitre garde son flou quand la caméra voyage (D67, amende D46)

- D67: the worker message announcing the camera travel is removed (absent ; FromSceneWorker is only SceneWorkerFrame) — `src/app/shared/space-scene/models/scene-worker.model.ts:108` — origin: docs/architecture/decisions.md:2101 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au bureau, la planète visée s'arrête sous la souris (D75)

- D75: zIndex is a key of the engine small DOM surface (NodeKey ; SceneNodeStyle.zIndex at scene-node.model.ts:5) — `src/app/shared/space-scene/models/scene-worker.model.ts:10` — origin: docs/architecture/decisions.md:2332 @ b299e1d

## Decided at the onboarding interview (2026-10-05)

- Grains fade at the left, right and top edges but not at the bottom (`src/app/shared/space-scene/engine/renderers/grains.renderer.ts:65`), and the camera opening ease (`src/app/shared/space-scene/engine/motions/camera.motion.ts:141`): both are intended
