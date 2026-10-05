# Desktop and pages

knowledge-date: 2026-10-05
knowledge-commit: b299e1d

## docs/architecture/organisation.md — La fenêtre : `shared/windows/` (D20)

- appWindowSheet in features/observatory/directives provides WINDOW_FOLD on the bottom sheet — `src/app/features/observatory/directives/window-sheet.directive.ts:7` — origin: docs/architecture/organisation.md:434 @ b299e1d
- Minimize and Pin only on desktop and tablet — `src/app/shared/windows/components/window/window.component.html:23` — origin: docs/architecture/organisation.md:410 @ b299e1d
- WindowFrameDirective writes transform width height data-frame data-frame-animating — `src/app/shared/windows/directives/window-frame.directive.ts:55` — origin: docs/architecture/organisation.md:413 @ b299e1d
- Height is bounded by --window-reserve or fixed when stable — `src/app/shared/windows/trackers/window-height.tracker.ts:4` — origin: docs/architecture/organisation.md:415 @ b299e1d
- frameControlsOf gives only Maximize or Restore — `src/app/shared/windows/rules/window-controls.rules.ts:12` — origin: docs/architecture/organisation.md:417 @ b299e1d

## docs/architecture/organisation.md — La navigation du téléphone : `shared/mobile-nav/` (D57)

- MobileNavPlatformService builds on core browser and history services and the router NavigationStart for onLeave — `src/app/features/observatory/services/mobile-nav-platform.service.ts:101` — origin: docs/architecture/organisation.md:473 @ b299e1d

## docs/architecture/organisation.md — L'état : découpé selon ses actions

- minimized is written by the updater, held empty on phone, and a minimized window is not shown — `src/app/features/observatory/states/observatory/observatory.manager.ts:56` — origin: docs/architecture/organisation.md:666 @ b299e1d
- view.rules holds parentOf stepBack windowOf and dockedOf in OBSERVATORY_WINDOWS order — `src/app/features/observatory/rules/view.rules.ts:104` — origin: docs/architecture/organisation.md:672 @ b299e1d
- tabs.rules gives tabOf tabOfWindow windowsOfTab — `src/app/features/observatory/rules/tabs.rules.ts:7` — origin: docs/architecture/organisation.md:676 @ b299e1d

## docs/architecture/organisation.md — Les composants

- The intro card relies on UserPresenceService — `src/app/features/observatory/components/intro-card/intro-card.component.ts:26` — origin: docs/architecture/organisation.md:713 @ b299e1d
- Skip button shows while arrival is held and calls arrive() directly — `src/app/features/observatory/components/intro-skip/intro-skip.component.html:1` — origin: docs/architecture/organisation.md:715 @ b299e1d
- Dock links each docked window to its view, last sheet for the sheet and home for the preview — `src/app/features/observatory/components/observatory-dock/observatory-dock.component.ts:27` — origin: docs/architecture/organisation.md:723 @ b299e1d
- The dock is in the DOM at every format and only shown on phone — `src/app/features/observatory/components/observatory-dock/observatory-dock.component.scss:5` — origin: docs/architecture/organisation.md:725 @ b299e1d

## docs/architecture/organisation.md — Les services de l'écran

- HomeRevealService contract is arrival isOpening start arrive on UserPresenceService — `src/app/features/observatory/services/home-reveal.service.ts:23` — origin: docs/architecture/organisation.md:731 @ b299e1d
- FeaturedTourService contract is play(slugs) and takeOver() — `src/app/features/observatory/services/featured-tour.service.ts:21` — origin: docs/architecture/organisation.md:736 @ b299e1d
- ViewWindowsService brings the view window to the front and focuses it except on first load — `src/app/features/observatory/services/view-windows.service.ts:121` — origin: docs/architecture/organisation.md:739 @ b299e1d
- prepareWhenIdle mounts index and about hidden when the browser is idle — `src/app/features/observatory/services/view-windows.service.ts:32` — origin: docs/architecture/organisation.md:745 @ b299e1d
- MobileNavPlatformService is provided by the page, never at root — `src/app/features/observatory/services/mobile-nav-platform.service.ts:14` — origin: docs/architecture/organisation.md:751 @ b299e1d

## docs/architecture/organisation.md — 4.6 `features/profile/`

- The about window shows one section per pager page — `src/app/features/profile/components/about-window/about-window.component.html:28` — origin: docs/architecture/organisation.md:819 @ b299e1d
- Contact links feed SocialLinks with contact.data, add the copy action and announce in their own status region — `src/app/features/profile/components/contact-links/contact-links.component.html:13` — origin: docs/architecture/organisation.md:821 @ b299e1d
- The phone Contact menu is an action sheet: write, copy address, LinkedIn, GitHub, CV — `src/app/features/profile/components/contact-menu/contact-menu.component.html:10` — origin: docs/architecture/organisation.md:826 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `features/observatory/models/observatory-ids.model.ts`

- Ids the markup refers to are written once — `src/app/features/observatory/models/observatory-ids.model.ts:1` — origin: docs/architecture/raisons/bureau-et-pages.md:8 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `features/observatory/models/observatory.model.ts`

- ObservatoryView is raw: whether a sheet slug names a project is decided in the page — `src/app/features/observatory/rules/view.rules.ts:143` — origin: docs/architecture/raisons/bureau-et-pages.md:14 @ b299e1d
- OBSERVATORY_WINDOWS follows the order in which the page lays out the windows (page outside the zone) — origin: docs/architecture/raisons/bureau-et-pages.md:17 @ b299e1d — status: declared

## docs/architecture/raisons/bureau-et-pages.md — `features/observatory/ports/observatory-texts.port.ts`

- object.select names an index planet and object.preview a home planet — `src/app/features/observatory/components/planet-buttons/planet-buttons.component.ts:32` — origin: docs/architecture/raisons/bureau-et-pages.md:21 @ b299e1d
- object.parts gives the figure name of each about part — `src/app/features/observatory/components/observatory-scene/observatory-scene.component.html:4` — origin: docs/architecture/raisons/bureau-et-pages.md:23 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `features/observatory/components/observatory-dock/`

- A dock entry is a link to its window's view, not a button — `src/app/features/observatory/components/observatory-dock/observatory-dock.component.html:5` — origin: docs/architecture/raisons/bureau-et-pages.md:28 @ b299e1d
- The dock is in the DOM at every format and shown only on phone — `src/app/features/observatory/components/observatory-dock/observatory-dock.component.scss:5` — origin: docs/architecture/raisons/bureau-et-pages.md:32 @ b299e1d
- A dock entry carries the window kind name, not its title — `src/app/features/observatory/components/observatory-dock/observatory-dock.component.ts:22` — origin: docs/architecture/raisons/bureau-et-pages.md:36 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `features/observatory/rules/view.rules.ts`

- Parent view addresses come from the composition (LINKS), not the rule — `src/app/features/observatory/states/observatory/observatory.effect.ts:59` — origin: docs/architecture/raisons/bureau-et-pages.md:56 @ b299e1d
- dockedOf docks pinned windows other than the open one and only if a touch can reopen them — `src/app/features/observatory/rules/view.rules.ts:97` — origin: docs/architecture/raisons/bureau-et-pages.md:57 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `features/observatory/services/featured-tour.service.ts`

- The curtain yields for good on take-over, leaving home or an open preview — `src/app/features/observatory/services/featured-tour.service.ts:33` — origin: docs/architecture/raisons/bureau-et-pages.md:69 @ b299e1d
- The curtain waits 4200 ms then lights each marker for 900 ms — `src/app/features/observatory/services/featured-tour.service.ts:5` — origin: docs/architecture/raisons/bureau-et-pages.md:71 @ b299e1d
- FeaturedTourService is provided by the observatory page, one per page — `src/app/features/observatory/services/featured-tour.service.ts:8` — origin: docs/architecture/raisons/bureau-et-pages.md:73 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `features/observatory/services/home-reveal.service.ts`

- Home reveal waits for --arrival-at read from CSS — `src/app/features/observatory/services/home-reveal.service.ts:49` — origin: docs/architecture/raisons/bureau-et-pages.md:79 @ b299e1d
- The arrival callback runs only when a held rest is released — `src/app/features/observatory/services/home-reveal.service.ts:54` — origin: docs/architecture/raisons/bureau-et-pages.md:83 @ b299e1d
- Off home the arrival is shown as soon as the view is read — `src/app/features/observatory/services/home-reveal.service.ts:23` — origin: docs/architecture/raisons/bureau-et-pages.md:85 @ b299e1d
- Arrival is timed at the home prerender — `src/app/features/observatory/services/home-reveal.service.ts:19` — origin: docs/architecture/raisons/bureau-et-pages.md:88 @ b299e1d
- isOpening lasts until home releases its rest and never comes back — `src/app/features/observatory/services/home-reveal.service.ts:27` — origin: docs/architecture/raisons/bureau-et-pages.md:89 @ b299e1d
- Leaving home releases the held rest — `src/app/features/observatory/services/home-reveal.service.ts:33` — origin: docs/architecture/raisons/bureau-et-pages.md:92 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `features/observatory/components/home-title/`

- Home title shows the name with the trade as page heading — `src/app/features/observatory/components/home-title/home-title.component.html:9` — origin: docs/architecture/raisons/bureau-et-pages.md:97 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `features/observatory/components/intro-card/`

- The intro card reads its duration from --intro-duration — `src/app/features/observatory/components/intro-card/intro-card.component.ts:26` — origin: docs/architecture/raisons/bureau-et-pages.md:117 @ b299e1d
- The intro card duration is --intro-duration, 5.6 s (5600ms). — `src/assets/styles/_tokens.scss:66` — origin: docs/architecture/raisons/bureau-et-pages.md:115 @ b299e1d
- --intro-duration, from which the card reads its duration, is set in _tokens.scss (the spec sets it by hand). — `src/assets/styles/_tokens.scss:66` — origin: docs/architecture/raisons/bureau-et-pages.md:120 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `features/observatory/components/not-found-window/`

- The not-found window says so and leads back to the index — `src/app/features/observatory/components/not-found-window/not-found-window.component.html:19` — origin: docs/architecture/raisons/bureau-et-pages.md:128 @ b299e1d
- The project count in the not-found sentence is computed — `src/app/features/observatory/components/not-found-window/not-found-window.component.ts:22` — origin: docs/architecture/raisons/bureau-et-pages.md:130 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `features/observatory/states/observatory/`

- A language switch lands on the same view and resets nothing — `src/app/features/observatory/states/observatory/observatory.updater.ts:126` — origin: docs/architecture/raisons/bureau-et-pages.md:148 @ b299e1d
- Closing the preview forgets what is open, not what was read — `src/app/features/observatory/states/observatory/observatory.updater.ts:236` — origin: docs/architecture/raisons/bureau-et-pages.md:150 @ b299e1d
- lastSheet keeps the last opened sheet — `src/app/features/observatory/states/observatory/observatory.updater.ts:35` — origin: docs/architecture/raisons/bureau-et-pages.md:151 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `features/profile/components/about-window/`

- The shown part counts from 0 and out of bounds reads as the first — `src/app/features/profile/components/about-window/about-window.component.ts:67` — origin: docs/architecture/raisons/bureau-et-pages.md:166 @ b299e1d
- A heading is mounted whatever the part — `src/app/features/profile/components/about-window/about-window.component.html:23` — origin: docs/architecture/raisons/bureau-et-pages.md:168 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `app.component.*`

- App mounts the observatory once above the router, the outlet first — `src/app/app.component.html:5` — origin: docs/architecture/raisons/bureau-et-pages.md:289 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `app.config.ts`

- Zoneless change detection is written explicitly — `src/app/app.config.ts:29` — origin: docs/architecture/raisons/bureau-et-pages.md:299 @ b299e1d
- ErrorHandler is the single channel for errors — `src/app/app.config.ts:31` — origin: docs/architecture/raisons/bureau-et-pages.md:305 @ b299e1d
- Route params arrive as component inputs — `src/app/app.config.ts:34` — origin: docs/architecture/raisons/bureau-et-pages.md:307 @ b299e1d
- Hydration reuses the prerendered DOM and event replay is on — `src/app/app.config.ts:25` — origin: docs/architecture/raisons/bureau-et-pages.md:311 @ b299e1d
- Project loading is awaited so prerendered HTML holds it — `src/app/app.config.ts:48` — origin: docs/architecture/raisons/bureau-et-pages.md:314 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `app.routes.server.ts`

- Everything is prerendered — `src/app/app.routes.server.ts:11` — origin: docs/architecture/raisons/bureau-et-pages.md:328 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Les fenêtres vivent à la station, le routeur ne dit que l'adresse

- AppComponent renders the router-outlet before the observatory — `src/app/app.component.html:4` — origin: docs/architecture/decisions.md:76 @ b299e1d
- Routes load an empty marker component from pages/ that declares its view — `src/app/pages/observatory/observatory-route.component.ts:20` — origin: docs/architecture/decisions.md:70 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Le focus va au titre de la vue après une navigation, pas au premier chargement

- D6 focus goes to the view heading after a navigation, not at first load — `src/app/features/observatory/services/view-windows.service.ts:156` — origin: docs/architecture/decisions.md:112 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Les navigations ne figent plus la page pour rien (D46)

- D46 the router has no View Transition — `src/app/app.config.ts:32` — origin: docs/architecture/decisions.md:1488 @ b299e1d
- D46 measures from events wait for the next frame and merge — `src/app/shared/space-scene/components/space-scene/space-scene.component.ts:282` — origin: docs/architecture/decisions.md:1491 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Au téléphone, « Contact » ouvre une feuille d'actions, et le retour la ferme d'abord (D60, amende D27)

- D60 the phone Contact sheet offers write, copy address, LinkedIn, GitHub, CV — `src/app/features/profile/components/contact-menu/contact-menu.component.html:10` — origin: docs/architecture/decisions.md:1880 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Le fond et Échap remontent d'un cran dans la scène, et le retour se voit (D70, amende D41 et D63)

- D70 background and Escape do the same, only deselect or close the preview — `src/app/features/observatory/states/observatory/observatory.effect.ts:31` — origin: docs/architecture/decisions.md:2189 @ b299e1d
- The sheet carries the back-to-projects link at the start of its title bar through the window before projection — `src/app/features/projects/components/project-detail/project-detail.component.html:17` — origin: docs/architecture/decisions.md:2195 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au bureau, le contact se lit en mots, et l'adresse se copie (D79, amende D60)

- D79 Copy the address on the desktop rail through CopyFeedbackService, shared with the phone sheet — `src/app/features/profile/components/contact-links/contact-links.component.ts:51` — origin: docs/architecture/decisions.md:2432 @ b299e1d

## docs/architecture/decisions.md — 2026-10-02 — Au téléphone, chaque onglet garde sa place, et le retour mène à l'accueil avant de quitter le site (D91, amende D57 et D62)

- D91 TabNavigationService provided by the page carries the phone tab choices — `src/app/features/observatory/services/tab-navigation.service.ts:67` — origin: docs/architecture/decisions.md:2772 @ b299e1d

## docs/architecture/decisions.md — 2026-10-03 — Au bureau, chaque fiche épinglée garde son projet (D105, étend D101)

- D105 a pinned sheet keeps its project and reopens without a double — `src/app/features/observatory/rules/sheet-windows.rules.ts:55` — origin: docs/architecture/decisions.md:3131 @ b299e1d
- D105 closing a kept sheet that is not the address removes it without changing page — `src/app/features/observatory/states/observatory/observatory.manager.ts:149` — origin: docs/architecture/decisions.md:3136 @ b299e1d
- D105 Projects restores every minimized sheet — `src/app/features/observatory/states/observatory/observatory.updater.ts:154` — origin: docs/architecture/decisions.md:3137 @ b299e1d
- D105 the scene frames the address sheet or else the last shown pinned sheet — `src/app/features/observatory/rules/sheet-windows.rules.ts:114` — origin: docs/architecture/decisions.md:3139 @ b299e1d
- D105 the phone keeps a single sheet — `src/app/features/observatory/states/observatory/observatory.manager.ts:60` — origin: docs/architecture/decisions.md:3143 @ b299e1d
- The back-to-projects link closes the current sheet or asks for the list otherwise — `src/app/features/projects/components/project-detail/project-detail.component.ts:170` — origin: docs/architecture/decisions.md:3141 @ b299e1d
- The page keeps a single h1, on the sheet of the current address — `src/app/features/projects/components/project-detail/project-detail.component.html:33` — origin: docs/architecture/decisions.md:3138 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/services/device/display-format.service.ts`

- The desk that asks for publishOnRoot is always mounted: app-observatory-page sits outside the router-outlet (the call itself is at pages/observatory/observatory-page.component.ts:268, outside the zone) — `src/app/app.component.html:5` — origin: docs/architecture/raisons/core-et-interface.md:90 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/models/entrance.model.ts`

- Entrance starts timed (no script yet); home-title defaults its arrival input to timed (home-title.component.ts:30) — `src/app/features/observatory/services/home-reveal.service.ts:19` — origin: docs/architecture/raisons/core-et-interface.md:202 @ b299e1d
- held: the script holds the rest of home until the reader is present or --arrival-at elapses (whenPresent at :48) — `src/app/features/observatory/services/home-reveal.service.ts:47` — origin: docs/architecture/raisons/core-et-interface.md:204 @ b299e1d
- shown: set when arrival is released, rising from that moment — `src/app/features/observatory/services/home-reveal.service.ts:65` — origin: docs/architecture/raisons/core-et-interface.md:206 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/services/view-focus.service.ts`

- The desk claims the heading inside the view container (claimWithin), headings register by appViewHeading (home-title.component.html:10, not-found-window.component.html:11) — `src/app/features/observatory/services/view-windows.service.ts:157` — origin: docs/architecture/raisons/core-et-interface.md:220 @ b299e1d
- The container is asked again every time: the desk passes a getter over its slots, not an element — `src/app/features/observatory/services/view-windows.service.ts:157` — origin: docs/architecture/raisons/core-et-interface.md:225 @ b299e1d
- A new claim replaces the previous one: the desk withdraws the former claim before claiming again — `src/app/features/observatory/services/view-windows.service.ts:154` — origin: docs/architecture/raisons/core-et-interface.md:227 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/directives/hover-focus.directive.ts`

- An exit would pass for a reader gesture and stop the curtain: exited emits bodyHovered(null), and the page takes over the featured tour on every bodyHovered (pages/observatory/observatory-page.component.ts:310) — `src/app/features/observatory/components/planet-buttons/planet-buttons.component.ts:52` — origin: docs/architecture/raisons/core-et-interface.md:244 @ b299e1d
- The planets double touch does not go through hover-focus: when cannotHover, the first click reveals (bodyHovered) and the next opens (onClick at :40) — `src/app/features/observatory/components/planet-buttons/planet-buttons.component.ts:58` — origin: docs/architecture/raisons/core-et-interface.md:246 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/windows/components/window/`

- The pin glyph follows the pinned input; the caller feeds pinned and relays pinToggled (:10) for its parent to decide — `src/app/features/profile/components/about-window/about-window.component.html:8` — origin: docs/architecture/raisons/core-et-interface.md:273 @ b299e1d
- Moving a window has no keyboard equivalent — `src/app/shared/windows/rules/window-controls.rules.ts:12` — origin: docs/architecture/raisons/core-et-interface.md:252 @ b299e1d
- The title bar keeps touch-action none — `src/app/shared/windows/components/window/window.component.scss:50` — origin: docs/architecture/raisons/core-et-interface.md:254 @ b299e1d
- On phone the bar switches to touch-action manipulation — `src/app/shared/windows/components/window/window.component.scss:130` — origin: docs/architecture/raisons/core-et-interface.md:256 @ b299e1d
- The opening animates translate, not transform — `src/app/shared/windows/components/window/window.component.scss:13` — origin: docs/architecture/raisons/core-et-interface.md:261 @ b299e1d
- Bar buttons are 34 x 32 through --target-compact — `src/app/shared/windows/components/window-controls/window-controls.component.scss:13` — origin: docs/architecture/raisons/core-et-interface.md:264 @ b299e1d
- The caller sets the body padding through --window-body-padding — `src/app/shared/windows/components/window/window.component.scss:104` — origin: docs/architecture/raisons/core-et-interface.md:269 @ b299e1d
- The input is named heading, not title — `src/app/shared/windows/components/window/window.component.ts:53` — origin: docs/architecture/raisons/core-et-interface.md:271 @ b299e1d
- The pin glyph follows only the pinned input — `src/app/shared/windows/components/window-controls/window-controls.component.ts:43` — origin: docs/architecture/raisons/core-et-interface.md:273 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/assets/styles/mixins/_arrival.scss`

- Without script the title rises on its own at --arrival-at (on-its-own); with script held (:30) then shown (:34) with its own delay — `src/app/features/observatory/components/home-title/home-title.component.scss:11` — origin: docs/architecture/raisons/core-et-interface.md:392 @ b299e1d
- held($hide) keeps the title in place for the arrival focus: home-title includes held with $hide false — `src/app/features/observatory/components/home-title/home-title.component.scss:30` — origin: docs/architecture/raisons/core-et-interface.md:396 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — Le bilingue : un catalogue à l'exécution, l'adresse fixe la langue

- The head service writes canonical, hreflang and og:locale — `src/app/core/services/head/document-head.service.ts:76` — origin: docs/architecture/decisions.md:159 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — La page de l'observatoire n'assemble plus que ce qui se croise (D50, amende D11 pour la page)

- The observatory page keeps only cross-feature joins: Project to Planet, not-found sheet, typed filter, designated project, body click, start state from the address — `src/app/pages/observatory/observatory-page.component.ts:230` — origin: docs/architecture/decisions.md:1622 @ b299e1d
- Escape is a one-line host binding — `src/app/pages/observatory/observatory-page.component.ts:209` — origin: docs/architecture/decisions.md:1641 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — `pages/` ne garde que ses écrans, et l'atelier est défait (D83, amende D57 et défait « Atelier de composants en route de développement »)

- The page provides MobileNavPlatformService and BackLayersService — `src/app/pages/observatory/observatory-page.component.ts:206` — origin: docs/architecture/decisions.md:2551 @ b299e1d

## docs/architecture/raisons/space-scene.md — `src/app/pages/observatory/observatory-page.component.ts`, le lien aux fenêtres

- The page provides SCENE_WINDOW_DRAG to itself with useExisting — `src/app/pages/observatory/observatory-page.component.ts:205` — origin: docs/architecture/raisons/space-scene.md:625 @ b299e1d
- onDragging subscribes to each window onLive rect and forwards it — `src/app/pages/observatory/observatory-page.component.ts:285` — origin: docs/architecture/raisons/space-scene.md:628 @ b299e1d
- The observatory page provides SCENE_WINDOW_DRAG to itself with useExisting — `src/app/pages/observatory/observatory-page.component.ts:142` — origin: docs/architecture/raisons/space-scene.md:625 @ b299e1d

## docs/architecture/decisions.md — 2026-09-23 — L'arborescence est en place, avec quatre unités de passage (D19)

- D19 carry-over: DesktopProjectsBinding becomes computeds of the page (the provider no longer exists; the page computes planets) — `src/app/pages/observatory/observatory-page.component.ts:167` — origin: docs/architecture/decisions.md:502 @ b299e1d
- D19 carry-over: the two route leaves merge into one (a single empty ObservatoryRouteComponent) — `src/app/pages/observatory/observatory-route.component.ts:20` — origin: docs/architecture/decisions.md:505 @ b299e1d

## docs/architecture/decisions.md — 2026-09-24 — Une capture tolère 200 pixels, pas une position fractionnaire (D24)

- D24: --window-top is not rounded — `src/app/pages/observatory/observatory-page.component.scss:80` — origin: docs/architecture/decisions.md:615 @ b299e1d

## docs/architecture/decisions.md — 2026-09-24 — Au téléphone, la fenêtre est une vitre (D25)

- D25: on phone the page slots cover the screen (inset 0, amended by D27 which sets their top) — `src/app/pages/observatory/observatory-page.component.scss:149` — origin: docs/architecture/decisions.md:627 @ b299e1d
- D25/D27: the phone glass arrives with its top at 60 percent of the screen (page uses --glass-lowered at scss:177; its value is defined outside the zone) — origin: docs/architecture/decisions.md:621 @ b299e1d — status: declared
- At phone format the window bar drag disappears (the frame directive is inactive on phone) — `src/app/shared/windows/directives/window-frame.directive.ts:87` — origin: docs/architecture/decisions.md:627 @ b299e1d
- On phone the glass arrives low with its top at 60 percent and scrolling its body first raises it to 12 px from the top (amended by D27 and D64, behaviour now outside shared/windows) — origin: docs/architecture/decisions.md:621 @ b299e1d — status: declared

## docs/architecture/decisions.md — 2026-09-25 — Au téléphone, une vitre à la fois, un dock, un chrome replié (D27, amende D25)

- D27: a dock (ObservatoryDockComponent) is placed in the page — `src/app/pages/observatory/observatory-page.component.html:269` — origin: docs/architecture/decisions.md:681 @ b299e1d
- D27: the manager derives the docked list and the page reads it (observatory.docked()) — `src/app/pages/observatory/observatory-page.component.html:48` — origin: docs/architecture/decisions.md:683 @ b299e1d
- D27: landscape, the page slots take the right half (width max(50vw, 324px), scss:202) — `src/app/pages/observatory/observatory-page.component.scss:211` — origin: docs/architecture/decisions.md:693 @ b299e1d

## docs/architecture/decisions.md — 2026-09-25 — Au téléphone, le châssis tient dans le haut de l'écran (D27)

- D27: on phone the page bar spans the top flat, no border, on a --paper fade — `src/app/pages/observatory/observatory-page.component.scss:129` — origin: docs/architecture/decisions.md:714 @ b299e1d
- D27: the glass reserves a bottom band only when the dock has an entry, via --dock-reserve set by :has() — `src/app/pages/observatory/observatory-page.component.scss:125` — origin: docs/architecture/decisions.md:721 @ b299e1d
- D27: on phone the scene loses its 380 px floor (min-height 380px elsewhere at scss:17) — `src/app/pages/observatory/observatory-page.component.scss:145` — origin: docs/architecture/decisions.md:724 @ b299e1d
- D27/D30: landscape, the bar stays left of the glass (right: var(--glass-width)) — `src/app/pages/observatory/observatory-page.component.scss:206` — origin: docs/architecture/decisions.md:720 @ b299e1d

## docs/architecture/decisions.md — 2026-09-25 — L'accueil se pose dans le ciel que le chrome laisse (D30, étend D29)

- D30: landscape the glass takes at least 324 px and the bar sits left of it (--glass-width) — `src/app/pages/observatory/observatory-page.component.scss:198` — origin: docs/architecture/decisions.md:802 @ b299e1d

## docs/architecture/decisions.md — 2026-09-25 — Au doigt, on regarde l'objet de près (D32)

- D32: .void takes touch-action none at handheld formats — `src/app/pages/observatory/observatory-page.component.scss:113` — origin: docs/architecture/decisions.md:884 @ b299e1d

## docs/architecture/decisions.md — 2026-09-27 — Au téléphone debout, l'accueil dit un nom à la fois, et les pages passent en onglets en bas (D38, amende D27 et D35)

- app-main-nav registers with the scene as the chrome anchor — `src/app/pages/observatory/observatory-page.component.html:21` — origin: docs/architecture/decisions.md:1120 @ b299e1d
- The designated planet comes from restingPickOf and is passed to the scene by the page — `src/app/pages/observatory/observatory-page.component.ts:207` — origin: docs/architecture/decisions.md:1130 @ b299e1d
- The designated featured project is the hovered one, else the last read, else the first — `src/app/features/projects/components/featured-bar/featured-bar.component.ts:93` — origin: docs/architecture/decisions.md:1124 @ b299e1d
- restingPickOf rests on the last featured project read if it is featured, else on the first — `src/app/features/projects/rules/featured-pick.rules.ts:5` — origin: docs/architecture/decisions.md:1130 @ b299e1d
- In phone portrait only, app-main-nav becomes a fixed bottom tab bar, equal tabs of at least --target, safe-area padding, --paper, a --line top rule, a 2px accent mark on the active tab (:99-117) — `src/app/shared/ui/components/main-nav/main-nav.component.scss:91` — origin: docs/architecture/decisions.md:1111 @ b299e1d
- The element does not move in the DOM; app-main-nav registers as a chrome anchor, with display contents off portrait (main-nav.component.scss:6) — `src/app/pages/observatory/observatory-page.component.html:21` — origin: docs/architecture/decisions.md:1119 @ b299e1d

## docs/architecture/decisions.md — 2026-09-27 — La traversée et la carte sont l'arrivée par l'accueil (D41)

- A single signal decides for the scene, the arrival of the interface (revealed) — `src/app/pages/observatory/observatory-page.component.html:255` — origin: docs/architecture/decisions.md:1243 @ b299e1d
- The desktop reads the view from the loaded address before its first render so the revealed signal is right from the first client frame — `src/app/pages/observatory/observatory-page.component.ts:266` — origin: docs/architecture/decisions.md:1245 @ b299e1d

## docs/architecture/decisions.md — 2026-09-27 — À l'à-propos, les quatre figures se voient, se rangent au téléphone et se touchent (D42, étend D33)

- Touching or clicking a figure chooses the section through chooseSection like the segmented control — `src/app/pages/observatory/observatory-page.component.html:258` — origin: docs/architecture/decisions.md:1284 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Une fenêtre montée ne se détruit plus : elle se cache (D62, amende « Les fenêtres vivent à la station »)

- KeptWindowDirective hides a window with inert, content-visibility hidden and data-shown — `src/app/shared/windows/directives/kept-window.directive.ts:17` — origin: docs/architecture/decisions.md:1925 @ b299e1d
- A requested window shows one frame later (code nests two nextFrame calls) — origin: docs/architecture/decisions.md:1928 @ b299e1d — status: declared
- Only the window of the current view carries the h1, the others an h2 — `src/app/features/projects/components/project-list/project-list.component.html:22` — origin: docs/architecture/decisions.md:1929 @ b299e1d
- A returning window replays its rise — `src/app/shared/windows/components/window/window.component.ts:90` — origin: docs/architecture/decisions.md:1931 @ b299e1d
- Another sheet starts back at the top — `src/app/features/projects/components/project-detail/project-detail.component.ts:138` — origin: docs/architecture/decisions.md:1932 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Les boutons de la fenêtre disent ce qu'ils font, au bureau comme au téléphone (D63)

- Title bar buttons live in WindowControlsComponent — `src/app/shared/windows/components/window-controls/window-controls.component.ts:13` — origin: docs/architecture/decisions.md:1958 @ b299e1d
- Each button shows its name in a CSS bubble hidden from screen readers and keeps it on aria-label — `src/app/shared/windows/components/window-controls/window-controls.component.html:14` — origin: docs/architecture/decisions.md:1960 @ b299e1d
- The close label is given by the caller — `src/app/shared/windows/components/window-controls/window-controls.component.ts:52` — origin: docs/architecture/decisions.md:1963 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Au bureau, une fenêtre se déplace, s'aimante, se redimensionne et s'agrandit, à la souris comme au clavier (D65, amende D12)

- WindowFrameDirective writes transform, size and data-frame — `src/app/shared/windows/directives/window-frame.directive.ts:55` — origin: docs/architecture/decisions.md:2036 @ b299e1d
- Left and right edges snap to half screen and the top edge maximizes — `src/app/shared/windows/rules/window-frame.rules.ts:92` — origin: docs/architecture/decisions.md:2038 @ b299e1d
- Resize goes from 320 x 200 — `src/app/shared/windows/rules/window-frame.rules.ts:14` — origin: docs/architecture/decisions.md:2041 @ b299e1d
- Double click on the bar maximizes then restores — `src/app/shared/windows/components/window/window.component.ts:136` — origin: docs/architecture/decisions.md:2041 @ b299e1d
- Frame code loads apart through FormatCodeService for desktop and tablet — `src/app/shared/windows/directives/window-frame.directive.ts:74` — origin: docs/architecture/decisions.md:2044 @ b299e1d
- DraggableDirective and FitHeightDirective are gone (no match in src) — `src/app/shared/windows/directives/index.ts:1` — origin: docs/architecture/decisions.md:2047 @ b299e1d
- Folding the window into its bar remains only at phone (double press folds only when the fold port is active) — `src/app/shared/windows/components/window/window.component.ts:137` — origin: docs/architecture/decisions.md:2047 @ b299e1d
- window-frame-tracker and window-controls-rules are two lazily loaded chunks — `src/app/shared/windows/directives/window-frame.directive.ts:38` — origin: docs/architecture/decisions.md:2056 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au bureau, une fenêtre gardée reste là, sa barre reste à portée, et sa hauteur ne saute plus (D68, amende D62 et D65)

- Margins read --head-bottom, --window-reserve and the bar height through clearanceOf — `src/app/shared/windows/trackers/window-frame.tracker.ts:136` — origin: docs/architecture/decisions.md:2129 @ b299e1d
- The sheet has a fixed height through stableHeight — `src/app/features/projects/components/project-detail/project-detail.component.html:6` — origin: docs/architecture/decisions.md:2131 @ b299e1d
- WindowHeightTracker holds the bounded height for WindowFrameTracker — `src/app/shared/windows/trackers/window-frame.tracker.ts:65` — origin: docs/architecture/decisions.md:2132 @ b299e1d

## docs/architecture/decisions.md — 2026-10-03 — Au bureau, une fenêtre se pose à sa place habituelle, même par-dessus une autre (D99, amende D76, D78 et D81)

- An unmoved window always shows at its default rectangle whatever other windows are open — origin: docs/architecture/decisions.md:2979 @ b299e1d — status: declared
- Cascade, least-overlap placement and its mirror and the rail refit are removed with their code (no match in src) — `src/app/shared/windows/rules/window-frame.rules.ts:126` — origin: docs/architecture/decisions.md:2982 @ b299e1d

## docs/architecture/decisions.md — 2026-10-03 — Au bureau, la barre d'une fenêtre est celle d'un programme : Réduire, Épingler, Agrandir, Fermer (D101, amende D74 et D81)

- Four buttons in order Minimize Pin Maximize Close — `src/app/shared/windows/components/window-controls/window-controls.component.ts:30` — origin: docs/architecture/decisions.md:3019 @ b299e1d
- The home preview has only Pin and Close — `src/app/shared/windows/components/window/window.component.ts:75` — origin: docs/architecture/decisions.md:3021 @ b299e1d
- Snapping while dragging remains — `src/app/shared/windows/rules/window-frame.rules.ts:97` — origin: docs/architecture/decisions.md:3023 @ b299e1d
- The window menu disappears with its code, its texts and left/right halves — `src/app/shared/windows/ports/window-texts.port.ts:8` — origin: docs/architecture/decisions.md:3022 @ b299e1d
- D101: minimizing keeps the entry dot and the focus goes to that page-bar entry (focusRoute, called by features/observatory/services/tab-navigation.service.ts:96) — `src/app/shared/ui/components/main-nav/main-nav.component.ts:30` — origin: docs/architecture/decisions.md:3025 @ b299e1d

## docs/architecture/organisation.md — L'ordre des fenêtres : `shared/windows/`

- WindowStackService is provided by the screen, not by root — `src/app/shared/windows/services/window-stack.service.ts:3` — origin: docs/architecture/organisation.md:513 @ b299e1d
- shownFrontToBack returns elements whose data-shown is true from front to back — `src/app/shared/windows/services/window-stack.service.ts:47` — origin: docs/architecture/organisation.md:516 @ b299e1d
- StackedWindowDirective writes its depth and comes to front on pointerdown and focusin — `src/app/shared/windows/directives/stacked-window.directive.ts:13` — origin: docs/architecture/organisation.md:522 @ b299e1d
- F6 and Shift+F6 cycle windows, Ctrl+F6 acts as F6, nothing while typing — `src/app/shared/windows/directives/window-cycle.directive.ts:21` — origin: docs/architecture/organisation.md:526 @ b299e1d
- Focus goes to the data-window-title set by WindowComponent — `src/app/shared/windows/components/window/window.component.html:14` — origin: docs/architecture/organisation.md:531 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/windows/directives/double-press.directive.ts`

- Double tap folds the window like double click — `src/app/shared/windows/components/window/window.component.ts:136` — origin: docs/architecture/raisons/core-et-interface.md:280 @ b299e1d
- Two taps count within 350 ms and 24 px, more than 10 px is a drag — `src/app/shared/windows/directives/double-press.directive.ts:4` — origin: docs/architecture/raisons/core-et-interface.md:288 @ b299e1d
- A press on a button or link does not count — `src/app/shared/windows/directives/double-press.directive.ts:40` — origin: docs/architecture/raisons/core-et-interface.md:290 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `pages/observatory/`

- The crossing duration read by the arrival is --arrival-at, set in _tokens.scss (8700ms). — `src/assets/styles/_tokens.scss:65` — origin: docs/architecture/raisons/bureau-et-pages.md:214 @ b299e1d
- Slot depth is a rank above --z-window, a global token (5); the per-slot ranks are in pages scss, not checked here. — `src/assets/styles/_tokens.scss:81` — origin: docs/architecture/raisons/bureau-et-pages.md:207 @ b299e1d

## docs/architecture/decisions.md — 2026-09-25 — Sous la vitre, un seul filtre (D28, amende D25)

- On phone, in the title bar, the title truncates and never the counter — `src/app/shared/windows/components/window/window.component.scss:143` — origin: docs/architecture/decisions.md:747 @ b299e1d

## docs/architecture/decisions.md — 2026-09-27 — Au téléphone, le relevé est une liste de cartes (D40, amende D34)

- The card layout lives in the component stylesheet with display contents on the project block, the template unchanged — `src/app/features/projects/components/project-list/project-list.component.scss:137` — origin: docs/architecture/decisions.md:1214 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Cinq reprises sur captures : la vitre basse des petits téléphones, le relevé selon sa place, le titre, les segmentés de la tablette, l'accueil couché (D45, amende D27, D28, D34, D38 et D40)

- On a phone in portrait 640 px high or less (short-phone-portrait) the lowered glass arrives at mid-height (--glass-lowered 0.5 instead of 0.6) — `src/assets/styles/_tokens.scss:109` — origin: docs/architecture/decisions.md:1438 @ b299e1d
- The index switches to cards when its glass is under 500 px wide by a container query whatever the format, wider it stays a table — `src/app/features/projects/components/project-list/project-list.component.scss:124` — origin: docs/architecture/decisions.md:1445 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Au téléphone, la vitre est une feuille à crans de `shared/mobile-nav` (D64, amende D25, D37, D39 et D62)

- GlassGesturesDirective, its tracker, rule, model and ScrollStopsDirective are gone (no match in src) — `src/app/shared/windows/directives/index.ts:1` — origin: docs/architecture/decisions.md:2004 @ b299e1d
- D64: list, about and detail have the three detents, the preview only folded and half (the detent lists are given by the callers, outside the zone) — origin: docs/architecture/decisions.md:1986 @ b299e1d — status: declared

## docs/architecture/decisions.md — 2026-09-29 — Au bureau, le trou noir suit la fenêtre qu'on déplace, et ne se retourne plus d'un bloc (D72, amende D66)

- The window publishes its moving rectangle through FramedWindow.live — `src/app/shared/windows/models/window-frame.model.ts:78` — origin: docs/architecture/decisions.md:2245 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au bureau, la barre des pages marque les fenêtres ouvertes (D73, étend D62)

- A window comes to the front on focusin, not only on pointerdown — `src/app/shared/windows/directives/stacked-window.directive.ts:16` — origin: docs/architecture/decisions.md:2281 @ b299e1d
- D73: each page-bar entry whose window is on screen carries a dot under its label (::after at line 33, shown by data-open set at main-nav.component.html:10) — `src/app/shared/ui/components/main-nav/main-nav.component.scss:45` — origin: docs/architecture/decisions.md:2273 @ b299e1d
- D73: its accessible name says it (label + pageBar.openWindow, fr text at i18n/data/fr.data.ts:11) ; aria-current stays on the current page (line 8) — `src/app/shared/ui/components/main-nav/main-nav.component.html:12` — origin: docs/architecture/decisions.md:2276 @ b299e1d
- D73: the bar receives the list of open entries (openRoutes input) — `src/app/shared/ui/components/main-nav/main-nav.component.ts:22` — origin: docs/architecture/decisions.md:2277 @ b299e1d
- D73: Accueil never carries the dot (depends on what the page passes in openRoutes, outside the zone) — origin: docs/architecture/decisions.md:2275 @ b299e1d — status: declared
- D73: the dot animates only its opacity, and does not exist on the phone (display none inside formats.phone, lines 70-86) — `src/app/shared/ui/components/main-nav/main-nav.component.scss:40` — origin: docs/architecture/decisions.md:2281 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au bureau, la barre d'une fenêtre ne garde qu'Agrandir et Fermer ; le reste passe dans le menu de la fenêtre (D74, amende D63 et D65)

- The home preview has no double click that maximizes — `src/app/shared/windows/components/window/window.component.ts:75` — origin: docs/architecture/decisions.md:2298 @ b299e1d
- Maximize and restore animate in 280 ms, without animation under reduced motion — `src/app/shared/windows/directives/window-frame.directive.ts:34` — origin: docs/architecture/decisions.md:2306 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au bureau, les fenêtres ne sélectionnent rien au glisser, restent au-dessus du rail, et F6 passe de l'une à l'autre (D78, amende D68 et D76)

- During a drag or resize no text is selected (CursorService.blockSelection) and selection returns at the end — `src/app/shared/windows/trackers/window-drag.tracker.ts:46` — origin: docs/architecture/decisions.md:2397 @ b299e1d
- F6 and Shift+F6 move focus to the title of the next or previous shown window in stack order, wrapping, Ctrl+F6 acts as F6 — `src/app/shared/windows/directives/window-cycle.directive.ts:21` — origin: docs/architecture/decisions.md:2406 @ b299e1d
- F6 does nothing inside an input field (isTypingTarget) — `src/app/shared/windows/rules/window-cycle.rules.ts:12` — origin: docs/architecture/decisions.md:2408 @ b299e1d
- F6 is listened to by a directive, not by WindowStackService — `src/app/shared/windows/directives/window-cycle.directive.ts:8` — origin: docs/architecture/decisions.md:2420 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au bureau, une fenêtre gardée se voit, le menu se lit comme un menu, et une fenêtre neuve se pose là où elle couvre le moins (D81, amende D74 et D76)

- A window kept open carries a pin next to its title and its accessible name says kept open — `src/app/shared/windows/components/window/window.component.ts:84` — origin: docs/architecture/decisions.md:2486 @ b299e1d
- Double click maximizes from the whole bar except controls — `src/app/shared/windows/directives/double-press.directive.ts:68` — origin: docs/architecture/decisions.md:2494 @ b299e1d
- WindowStackService.frontShownOf is gone, the stack gives all shown windows — `src/app/shared/windows/services/window-stack.service.ts:47` — origin: docs/architecture/decisions.md:2495 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au téléphone, une feuille se reconnaît, et le retour la baisse avant de quitter la page (D84, amende D57, D60 et D64)

- Touching the grip toggles the sheet under the name Lower the window or Raise the window — `src/app/shared/windows/components/window-grip/window-grip.component.ts:17` — origin: docs/architecture/decisions.md:2580 @ b299e1d
- At phone the pin and the fold chevron leave the bar — `src/app/shared/windows/components/window/window.component.html:24` — origin: docs/architecture/decisions.md:2582 @ b299e1d
- At phone the list counter leaves the bar — `src/app/features/projects/components/project-list/project-list.component.ts:63` — origin: docs/architecture/decisions.md:2583 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Le téléphone a une librairie de navigation, et les chapitres se tournent comme des pages (D57, amende D37)

- The sheet puts each chapter in a pager page at every format — `src/app/features/projects/components/project-detail/project-detail.component.html:44` — origin: docs/architecture/decisions.md:1787 @ b299e1d
- D57: the window swipe output swiped is removed (absent: the window outputs are minimized, pinToggled, closed only), horizontal drag is native — `src/app/shared/windows/components/window/window.component.ts:67` — origin: docs/architecture/decisions.md:1791 @ b299e1d

## docs/architecture/decisions.md — 2026-09-28 — Au téléphone, les projets vedettes sont des cartes qu'on fait glisser (D58, amende D35)

- Each featured card shows number, name, proof and stack — `src/app/features/projects/components/featured-bar/featured-bar.component.html:16` — origin: docs/architecture/decisions.md:1819 @ b299e1d
- Settling a card lights its planet, touching a card opens its preview and the featured tour gives the hand back on first touch (featured-bar only calls designate, the effect lives outside the zone) — origin: docs/architecture/decisions.md:1825 @ b299e1d — status: declared
- _tokens.scss binds the --mnav-* variables to the site tokens — `src/assets/styles/_tokens.scss:68` — origin: docs/architecture/decisions.md:1827 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Les fenêtres de projet disent les choses par leur nom (D71, amende D34, D40, D57 et D59)

- The sheet tabs carry their chapter title at every format and phoneLabel is gone — `src/app/features/projects/components/project-detail/project-detail.component.ts:94` — origin: docs/architecture/decisions.md:2215 @ b299e1d
- The sheet title bar no longer carries a 02 / 08 rank (no meta passed to the window) — `src/app/features/projects/components/project-detail/project-detail.component.html:2` — origin: docs/architecture/decisions.md:2217 @ b299e1d
- In the list every row is a link to its sheet, the accordion and row selection are gone and hover still lights the planet — `src/app/features/projects/components/project-list/project-list.component.html:35` — origin: docs/architecture/decisions.md:2222 @ b299e1d

## docs/architecture/decisions.md — 2026-10-01 — Au téléphone, la barre du haut ne garde que Contact, et la langue passe dans la feuille Contact (D89, amende D60)

- At phone the next-chapter footer of the sheet is gone while the next-project link at the end stays — `src/app/features/projects/components/project-detail/project-detail.component.html:92` — origin: docs/architecture/decisions.md:2724 @ b299e1d
- D89: LanguageSwitchComponent does not render on the phone — `src/app/shared/ui/components/language-switch/language-switch.component.html:1` — origin: docs/architecture/decisions.md:2717 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/components/social-links/`

- The contact rail arrives with the rest of the home page following Entrance (timed, held, shown) — `src/app/shared/ui/components/social-links/social-links.component.ts:21` — origin: docs/architecture/raisons/core-et-interface.md:167 @ b299e1d

## docs/architecture/decisions.md — 2026-09-29 — Au téléphone, la vitre garde son flou quand la caméra voyage (D67, amende D46)

- D67: the data-sky-travel flag and flagRoot are gone (absent from src/ ; removed by 778adba from scene-engine.service.ts and animated-canvas.service.ts) — `src/app/shared/space-scene/services/scene-engine.service.ts:1` — origin: docs/architecture/decisions.md:2100 @ b299e1d

## Decided at the onboarding interview (2026-10-05)

- 150 px of a window's title bar stay on screen (`src/app/shared/windows/rules/window-frame.rules.ts:17`), and a requested window shows after two frames (`src/app/shared/windows/directives/kept-window.directive.ts:52-53`)
