# 02 — Composants : taille, SRP, entrées et sorties

Rapport d'agent, en lecture seule. Périmètre : tous les composants hors
`shared/ui/object` (`pages/**`, `features/projects/components/**`,
`app.component.*`).

Points revérifiés dans le code :

- l'ordre z en double (`String(5 + index)` contre les `calc()` de
  `station.component.scss:99,106`) ;
- la règle du vide recopiée ;
- les fichiers vides des pages-marqueurs.

## StationComponent (`pages/station/station.component.ts`, 448 l.) — bloquant (SRP)

Onze responsabilités :

1. composition des fenêtres et de l'objet ;
2. correspondance vue → URL, `currentRoute` (:92), qui double `app.navigation` ;
3. traduction slug ↔ rang pour l'objet : `bodies`, les quatre `*Rank`,
   `slugAt` et `rankOf` (:151-170, :329-337) ;
4. jointure station × projets : `sheetSlug`, `isNotFound`, `family`,
   `featuredRows` (:104-127) ;
5. règle métier « le vide referme » : `voidCloses` (:135) ;
6. calendrier d'arrivée et rideau : `holdArrival` (:343-384), avec `arrive`
   réassigné trois fois ;
7. ordre z des fenêtres, écrit dans le DOM : `bringToFront` (:386-398) ;
8. focus par sélecteur et boucle rAF : `claimFocus` (:405-428) ;
9. mesure de la barre : `querySelector('app-page-bar')`, puis
   `setProperty('--head-bottom')` (:236-253) ;
10. absorption du clic après un spin : `swallowVoid` (:183, :317-327) ;
11. écouteurs globaux Escape et `pointerdown` en capture (:198-220).

Constats :

- **[I] :386-398 — l'ordre z a deux sources de vérité.**
  `element.style.zIndex = String(5 + index)` écrit en dur la valeur de
  `--z-window` (5) et écrase les z-index du SCSS
  (`station.component.scss:99,106`). Correction : un signal
  `order = signal<Slot[]>` et `[style.z-index]` dans le gabarit.
- **[I] :135-142 — `voidCloses` recopie `voidEffect`.** La copie est dans
  `station.effect.ts:54-63`, et les deux divergent : l'effect ferme l'aperçu
  quelle que soit la vue, le computed seulement à l'accueil. Correction : un
  `canStepBack` dans `StationManager`, lu par l'effect et par la page.
- **[I] :409 — focus par contrat DOM implicite.** Il repose sur
  `[data-slot="x"] h1` et `#titre-accueil`, avec une boucle rAF de 2,5 s.
  Correction : une directive `appLandingHeading` qui s'inscrit auprès d'un
  service `LandingFocus`.
- **[I] :364-383 — état caché dans une fermeture réassignée.** Correction :
  un `ArrivalController` injectable (états `timed`, `held`, `shown`) et un
  `Curtain` séparé.
- **[C] Détails.**
  - `:287` : `onFamily` est un relais vide.
  - `:147` : le commentaire « ranks/slugs » est posé au-dessus de `bodies`.
  - Le titre d'accueil est écrit dans la station (html `:53-60`) :
    `HomeTitleComponent`.

## IntroCard

- **[I] :15, :48 — schéma d'intention dupliqué.** `INTENT` et tout le
  schéma « premier geste ou délai » sont dupliqués avec la station. L'intro
  vérifie `browser.isBrowser` dans `afterNextRender`, la station ne le fait
  pas : l'une des deux a tort. Correction : `BrowserEnvironment.firstGesture(ms, cb)`.

## AboutWindow

- **[I] :79, html :18-19 — `part` est une chaîne.** Il vaut `'00'`, la
  station le reconvertit en nombre (`station.component.ts:173`), alors que
  `chapter` est un nombre. Correction : un nombre ou une union nommée.
- **[I] :133 — sélection par libellé.** Même défaut dans
  `project-index.component.ts:139` et `workbench-page.component.ts:77`.
  L'aperçu et la fiche passent par l'identité d'objet (`indexOf(item)`). La
  cause est dans `SegmentedItem`, qui ne porte pas de valeur. Correction :
  `SegmentedItem<T> { value: T }`, et émettre `value`.
- **[I] :27-59, html :20-118 — contenu métier dans le composant.** Cela
  concerne `PARTS`, `DOMAINS`, `MILESTONES` et la prose. Correction : des
  données (`about.data.ts`) et un gabarit par type de bloc.
- **[C] :122-129 — remise à zéro du défilement copiée.** Le schéma « sauter
  le premier passage » est copié dans `project-sheet.component.ts:119-127`.
  Correction : une entrée `resetScrollOn` sur la fenêtre, ou un utilitaire.
  Le `current()?.` est aussi superflu.

## ContactRail

- **[C] html :5,15,29 — données en dur.** L'e-mail et les URL sont dans le
  gabarit : ce sont des données de profil. Les SVG pourraient devenir un
  `IconComponent`.

## OrbitRule

- **[I] Mauvais emplacement.** Ce composant présente des projets
  (`ProjectWithFacts`) mais vit dans `pages/station`. Correction : le déplacer
  dans `features/projects/components/orbit-rule`.
- **[I] :45,49 — numérotation par index.** Les numéros suivent l'index dans
  `featuredRows` (voir le bug de numérotation plus bas).

## Features projects : composants smart ou présentationnels

- **[I] Hybride non documenté.** L'index, l'aperçu et la fiche injectent
  `ProjectsManager` mais reçoivent l'état de station en entrées ; OrbitRule
  est purement présentationnel. C'est acceptable, puisque imposé par la loi,
  mais la règle doit être écrite : « les données de la feature viennent du
  manager, l'état d'écran arrive par entrées ».
- **[I] Bug latent de numérotation.** `project-index.component.ts:117-121`
  numérote par index dans `withFacts()`, qui retire les projets sans faits ;
  `project-sheet.component.ts:58` numérote par `rankOf`. Même écart entre
  OrbitRule et l'aperçu (`:44`). Correction : `rank` et `number` calculés une
  fois dans `withFacts`.
- **[I] Doublons.**
  - Le libellé `number — title · proof` est construit deux fois :
    `project-index.component.ts:129` et `orbit-rule.component.ts:49`.
  - Le `Set` des projets mis en avant est construit deux fois :
    `project-index:114` et `station:122`.
  - Le badge « NN / NN » est construit trois fois : index `:90`, aperçu
    `:44`, fiche `:58`.
  - Correction : `featuredWithFacts`, `isFeatured(slug)` et une fonction
    `rowLabel()`.
- **[C] `project-sheet.component.ts:109` — calcul du suivant peu lisible.**
  `projects[rank % length]` repose sur un rang compté à partir de 1.
  Correction : `nextOf(slug)` dans le manager.
- **[C] `project-sheet.component.html:67-97` — légendes en dur.** Les
  légendes des figures sont en dur. Correction : les mettre dans les données.

## Nommage des entrées et sorties

- **[I] Conventions divergentes.**
  - Le survol s'appelle `hovered` en sortie dans l'index
    (`project-index.component.ts:77`), soit le même nom qu'une entrée
    d'OrbitRule, et `hoveredChange` dans OrbitRule.
  - La sélection s'appelle `chosen` (aperçu, règle), `selectedChange`
    (index) ou `selected` (Segmented).
  - Règle proposée : `xxxChange` pour chaque paire entrée/sortie, et un
    participe passé pour les événements sans état (`closed`, `pinToggled`,
    `spun`).

## Pages-marqueurs

- **[C] Fichiers vides.** Les pages home, projects, about et not-found ont
  des `.html` et `.scss` de 0 octet. Il faut trancher : `template: ''`, ou la
  convention §6.
- **[C] `project-detail-page.component.ts:44,51` — `navigated` dispatché deux
  fois.** Une fois depuis le snapshot, une fois depuis un effect, avec une
  garde. Un effect qui dispatch reste fragile.
- **[C] `workbench-page.component.ts:77` — table libellé → clé.** Elle
  disparaît avec `SegmentedItem<T>`.

AppComponent : rien à signaler.

## Décomposition cible

```
src/app/
├─ core/services/browser-environment.ts        + firstGesture(ms, cb), INTENT unique
├─ shared/ui/
│  ├─ segmented/  SegmentedItem<T>{value}, output selectedChange<T>
│  ├─ window/     input resetScrollOn, directive appLandingHeading
│  └─ icon/       icon.component.ts (mail, linkedin, github)
├─ features/
│  ├─ projects/
│  │  ├─ states/projects.manager.ts  + featuredWithFacts, isFeatured, nextOf ; withFacts porte rank/number
│  │  ├─ services/project-view.ts    rowLabel(), rankMeta()
│  │  └─ components/ index, preview, sheet, orbit-rule/ (déplacé)
│  ├─ profile/
│  │  ├─ data/about.data.ts, contact.data.ts
│  │  ├─ models/about.model.ts       AboutPart typé
│  │  └─ components/about-window/    (déplacé, piloté par les données)
│  └─ station/states/station.manager.ts  + canStepBack, part:number, routeOf(view)
└─ pages/station/
   ├─ station.component.ts           composition seule (~120 l.)
   ├─ station-projects.binding.ts    sheetSlug, isNotFound, family, ranks, slugAt, objectView, bodies
   ├─ arrival/arrival.controller.ts  timed/held/shown
   ├─ arrival/curtain.ts             pas du rideau, arrêt au survol
   ├─ window-stack.directive.ts      ordre en signal, [style.z-index], pointerdown en capture
   ├─ landing-focus.service.ts       focus du h1 inscrit, sans querySelector
   ├─ head-bottom.directive.ts       ResizeObserver, écrit --head-bottom
   ├─ station-keys.ts                Escape → station.escape()
   ├─ home-title.component.ts
   └─ chrome/ intro-card, contact-rail, not-found-window
```

`swallowVoid` gagnerait à descendre dans `ObjectComponent`, qui émettrait un
`voidClicked` déjà filtré.
