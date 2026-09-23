# 06 — Nommage, clean code, tests, outillage

Rapport d'agent, en lecture seule. Périmètre : tout le dépôt, sauf
l'intérieur du moteur canvas.

Points revérifiés dans le code :

- l'entrée `title` de `WindowComponent` se retrouve dans le HTML prérendu
  (`<app-window title="À propos" …>`), donc en infobulle native ;
- `fake-managers.ts:100` écrit `slice(0, 4)` en dur ;
- `chapterTitle` y ignore les titres par défaut (l. 122) ;
- `about-window.component.spec.ts:164-166` asserte du lorem ipsum.

## 1. Nommage

**[I] `SegmentedItem` n'a pas d'identifiant.** Les appelants retrouvent
l'élément cliqué par son libellé (`about-window.component.ts:128`,
`project-index.component.ts:135`) ou par identité d'objet
(`project-sheet.component.ts:128`, `project-preview.component.ts:60`). Le
`track item.label` (`segmented.component.html:2`) a le même défaut.
Correction : une clé portée par l'élément, émise au clic et utilisée pour le
suivi.

**[I] L'entrée `title` de `WindowComponent` (`window.component.ts:67`)**
porte le nom d'un attribut HTML natif. `title="À propos"` est posé en
statique (`about-window.component.html:2`), si bien que l'attribut finit dans
le DOM et affiche une infobulle sur toute la fenêtre (✔ vérifié). Correction :
renommer l'entrée `heading`.

**[I] `Arrival` est déclaré dans `shared/ui/page-bar/arrival.model.ts`.** Il
faut le déplacer vers un modèle neutre.

**[I] Les deux clés de lecture n'ont pas le même type.** `part` est une
chaîne `'00'` (`station.state.ts:37`, reconvertie dans
`station.component.ts:174`), et `chapter` est un nombre. Correction : un
index numérique partout, affiché avec `twoDigits`.

| Actuel                                                                         | Proposé                                           | Vaut le coût ?                                |
| ------------------------------------------------------------------------------ | ------------------------------------------------- | --------------------------------------------- |
| `data-actif` (`page-bar.component.html:20`, `.scss:101`)                       | `data-active`, comme segmented                    | oui                                           |
| `#titre-accueil`, `#accueil`, `#contenu`, `#panneau-apercu`                    | `#home-title`, `#home`, `#main`, `#preview-panel` | oui, et les regrouper en constantes partagées |
| `data-selection` (index)                                                       | `data-selected`                                   | oui                                           |
| trois conventions d'état CSS : `.is-pinned`, `[data-active]`, `[data-lit]`     | une seule (data-attributes)                       | confort                                       |
| sorties `hovered` / `hoveredChange` ; `chosen` / `selected` / `selectedChange` | `hoveredChange` et `selectedChange` partout       | oui                                           |
| `state` (`project-index.component.ts:91`), qui est un texte de résumé          | `familySummary`                                   | oui (collision avec la couche state)          |
| `bodies` pour des `SegmentedItem` et pour des `ProjectWithFacts`               | `choices` / `projects`                            | oui                                           |
| « chapter » et « approach » pour un même concept                               | un seul terme                                     | confort                                       |
| `SeoService.name()`                                                            | `setOgTitle()`                                    | oui                                           |
| suffixes de classes incohérents                                                | aligner                                           | confort                                       |
| booléens `showPause`, `showsAbout`, `isNotFound`, `voidCloses`                 | choisir `shows…` ou `is…`                         | confort                                       |
| `data-panel`, `data-slot`                                                      | garder                                            | non                                           |

**[C] `pages/station/` n'est pas une route.** Il contient 6 composants à
plat qui ne sont pas des `-page`, contrairement à la convention §2. Il faut
le documenter comme exception, ou ranger ces composants dans
`pages/station/components/`.

## 2. Clean code

**[I] Quatre composants-marqueurs quasi identiques.**
`pages/{about,home,not-found,projects}/*-page.component.ts` embarquent 10
fichiers vides et une docstring copiée par substitution mécanique, qui dit
faux :

- « The address of an unknown address » (`not-found-page.component.ts:5`) ;
- « the window it opens » (`home-page.component.ts:5`), alors que l'accueil
  n'ouvre aucune fenêtre.

Correction : un seul `ViewMarkerComponent`, piloté par `data: { view }`.

**[I] `StationComponent` : 448 lignes, dont un constructeur d'environ 90
lignes (`station.component.ts:193-285`).** `holdArrival` contient trois
closures qui se réassignent mutuellement. Correction : extraire la mesure,
l'arrivée, le rideau et `claimFocus`.

**[I] Nombres magiques.**

- `String(5 + index)` (l. 402) duplique `--z-window`.
- `[margin]="76"` et `"88"` sont répétés dans 6 gabarits (26 par défaut) :
  les nommer, par exemple `RAIL_RESERVE`.
- `INTENT` est dupliqué entre `station.component.ts:49` et
  `intro-card.component.ts:15`.
- `2 + (index / last) * 56` (`orbit-rule.component.ts:48`) : les nommer
  `BELT_START` et `BELT_SPAN`.
- Deux viewports de repli différents dans `object.component.ts` (l. 239 et
  396).
- L'atelier est désynchronisé : `'tout'`, `'pro'` et les compteurs `'07'` et
  `'04'` sont en dur (`workbench-page.component.ts:48-51`).

**[I] Famille non typée.** `'all'` est une chaîne opaque
(`station.state.ts:33`) revalidée dans `station.component.ts:118`. Au
minimum, une constante `NO_FAMILY_FILTER`.

**Commentaires.**

- `station.component.ts:233` : « Browser only, and never with reduced
  motion » introduit un bloc dont la moitié s'exécute aussi en mouvement
  réduit.
- Incohérence entre `intro-card.component.ts:43-45`, qui teste `isBrowser`
  dans `afterNextRender`, et la station, qui ne le fait pas.
- `orbit-rule.component.spec.ts:100` : « the truths describe » est un jargon
  obscur.
- `station.component.spec.ts:64-67` : le commentaire est confus.

**Textes provisoires.** Le lorem ipsum est asserté dans
`about-window.component.spec.ts:164-166` : il faut tester la structure, pas
le texte provisoire.

**[C] Divers.**

- `LocalStorageService` est abstrait mais décoré `providedIn: 'root'`, sans
  aucune sous-classe.
- `getItem` fait `JSON.parse(raw) as T`, un cast non vérifié, contraire à la
  règle « `unknown`, puis restreindre ».
- Le format du titre est dupliqué entre `page-title.strategy.ts:22` et
  `project-detail-page.component.ts:67`.
- Deux `<dt>` dans un même groupe, dans « À propos » (partie 01).

## 3. Tests

**[I] Comportements de `StationComponent` revendiqués sans spec.**

- Le rideau : 4200 ms, puis 900 ms par repère, et l'arrêt via
  `curtainTakenOver`.
- `claimFocus` : le focus du `h1` et l'échéance de 2500 ms.
- `onSpun` et `swallowVoid`.
- `onBodyClicked` : sélection dans l'index, bascule de l'aperçu ailleurs.
- `bringToFront` déclenché par une navigation (seul le `pointerdown` est
  testé).
- La mesure de `--head-bottom`.
- `ContactRailComponent` et `NotFoundWindowComponent` n'ont pas de spec : on
  asserte leurs textes indirectement dans `station.component.spec.ts`.

**[I] `fake-managers.ts` réimplémente la logique métier.** `featured`,
`withFacts`, `familyCounts` et `rankOf` sont recopiés. `Pick<ProjectsManager,
…>` protège la signature, pas le comportement, et la copie a déjà dérivé :

- `featured` utilise `slice(0, 4)` au lieu de `FEATURED_COUNT` (l. 100) ;
- `chapterTitle` ignore les titres par défaut (l. 122).

Correction : bâtir le double sur le vrai `ProjectsManager`, alimenté par un
état en mémoire.

**[I] Tests couplés à l'implémentation.**

- `window.component.spec.ts:526-527` recalcule les bornes avec la formule du
  composant.
- `CAPS` (l. 13) duplique `CEILINGS`.
- Des phrases françaises entières sont assertées : à centraliser.

**[C] Préparation de test dupliquée.** `at()`, `stubRect`, `stubViewport`,
`pointerEvent` et les faux `matchMedia` et `getContext` sont répétés : les
déplacer dans `src/testing/`. De plus :

- la requête de l'objet est écrite deux fois dans le spec de la station ;
- `about-window.component.spec.ts:32` refait `mount` ;
- `standalone: true` est redondant ;
- `page-title.strategy.spec.ts:37` écrit le nom du site en dur.

Les specs du flux projets (manager, updater, effect) testent bien du
comportement.

## 4. Configuration et outillage

- **tsconfig.** Très strict. Il manque `exactOptionalPropertyTypes`
  (confort).
- **ESLint [I].** Aucune règle de complexité :
  - `max-lines`, `max-lines-per-function`, `complexity`, `max-depth` ;
  - `prefer-readonly`, `switch-exhaustiveness-check`, `naming-convention` ;
  - côté Angular : `prefer-on-push-component-change-detection`,
    `prefer-signals`, `prefer-output-readonly`, `template/prefer-control-flow`,
    `template/conditional-complexity`, `template/cyclomatic-complexity`,
    `template/prefer-self-closing-tags` ;
  - envisager `strictTypeChecked` et `stylisticTypeChecked`.

  Il n'y a pas non plus de stylelint.

- **[C] Divers.**
  - Pas de seuil de couverture.
  - `serve:static` passe par `npx --yes serve@14`, hors devDependencies.
  - Husky n'a qu'un hook `commit-msg`.
  - commitlint n'a pas de `scope-enum`.
- **CI.**
  - **[I]** Le job `deploy` reconstruit le site avec `--base-href` :
    l'artefact publié n'est pas celui que `check` a testé.
  - **[C]** Les actions sont épinglées par tag et non par SHA, et il n'y a
    pas de `timeout-minutes`.
