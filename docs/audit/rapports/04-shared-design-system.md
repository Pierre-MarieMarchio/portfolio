# 04 — Découpage de `shared/` et design system

Rapport d'agent, en lecture seule. Périmètre : `shared/ui/*`,
`src/styles.scss`, `src/assets/styles/*` et tous les `.scss` du dépôt.

Points revérifiés dans le code :

- la gouttière `clamp(20px, 4vw, 44px)` écrite 9 fois ;
- les jetons morts `--g`, `--z-window-top` et `--z-skip` ;
- le lien d'évitement sans style propre ;
- `8700` et `5600` écrits dans le TS et dans le CSS.

Note : ce rapport propose `$localize` pour les libellés de `shared/ui` (§A3).
Le plan retient à la place le catalogue à l'exécution (rapport 00, §5) : les
libellés arrivent par entrée, ou par un jeton de textes.

## A — Découpage de `src/app/shared/`

**A1. [I] L'objet n'est pas de l'UI partagée.** Il ne dépend d'aucune
feature, mais il connaît la station de bout en bout :

- `ObjectView = 'home'|'index'|'sheet'|'about'|'not-found'`
  (`object-engine.ts:42`), avec environ 36 branches sur ces vues ;
- les rôles de panneau `head`, `rule`, `sheet` et `preview` ;
- des libellés métier (« … dans le relevé », `object.component.ts:129-130`) ;
- un `document.querySelectorAll('[data-panel]')` global
  (`object.component.ts:353,390`), c'est-à-dire un couplage par le DOM qui
  ne passe ni par une entrée ni par une sortie.

Il n'a qu'un seul consommateur (`station.component.ts:23`). Correction : le
déplacer dans `features/station/components/object/`. C'est la « seule vraie
interface » de `decoupage-angular.md` §3.

**A2. [I] `Arrival` est rangé dans `page-bar`.** Le type est défini dans
`page-bar/arrival.model.ts:12`, mais il est importé par
`contact-rail.component.ts:8`, `orbit-rule.component.ts:11` et
`station.component.ts:24`. C'est un concept de chorégraphie de l'accueil.
Correction : `shared/ui/arrival/`, avec son mixin (voir B5).
`NavigationItem`, lui, est légitime dans `page-bar`.

**A3. [I] Libellés français en dur dans des composants partagés.**

- `window.component.ts:95-99` et `window.component.html:50-51` ;
- `segmented.component.ts:23` (`'Sélection'`) ;
- `page-bar.component.html:2,9,13` ;
- `object.component.ts:129-130`.

**A4. [C] `window` porte du contexte.** `margin = input(26)`
(`window.component.ts:75`) encode la hauteur du rail de contact, et
`<p class="meta">` est rendu même vide (`window.component.html:24`). Le
reste est exemplaire.

**A5. `segmented` est sain.** Rien à signaler.

**A6. [C] Le châssis est rangé de façon incohérente.** `page-bar` est dans
`shared/ui`, mais `contact-rail` (même cadre vitré, coordonnées écrites dans
`contact-rail.component.html:5-36`) est dans `pages/station`. Correction :
les liens deviennent une donnée (`app.contact.ts`), et `contact-rail`
rejoint `shared/ui`. `intro-card` et `orbit-rule` restent dans la page.

**A7. [C] `about-window` est une vue de contenu posée à côté du châssis.**
Ses homologues, la fiche et le relevé, sont dans
`features/projects/components`.

## B — Y a-t-il un design system ?

Il y a des **jetons**, bons et documentés, mais **aucune primitive**.
Chaque composant recompose les mêmes motifs, et ils dérivent déjà.

**B1. [I] Les jetons sont contournés.**

- **Gouttière.** `clamp(20px, 4vw, 44px)` est écrit 9 fois
  (`contact-rail.scss:3`, `orbit-rule.scss:3-4`, `station.scss:30,82`,
  `workbench.scss:9,22`, `page-bar.scss:3,8`). Correction : un jeton
  `--gutter`.
- **Durées.** `180ms` est écrit sans l'easing de `--t`
  (`segmented.scss:40-41`, `window.scss:97-98`). D'autres durées sont brutes :
  `320ms` (`object.scss:73`), `560ms` (`window.scss:30`), et des levées de
  1100 à 1500 ms dans 5 fichiers.
- **Double source de vérité.** `8700` est dans `station.component.ts:40` et
  dans `--arrival-at` (`_tokens.scss:61`) ; `5600` est dans
  `intro-card.component.ts:12` et dans `intro-card.scss:15`.
- **Rayon.** `border-radius: 2px` est écrit 5 fois, alors que `--radius`
  (3px) ne sert que 2 fois.
- **Interlettrage.** 9 valeurs brutes, dont 6 négatives différentes.
  Correction : un jeton `--ls-display`.
- **Cibles tactiles.** 34, 38, 40 et 44px en littéraux. Correction :
  `--target: 44px` et `--target-compact: 34px`.
- **Espacements.** `7px` est écrit 9 fois, et `12px` 18 fois alors que `--s2`
  vaut 12px.
- **Flou.** `blur(10px) saturate(1.1)` (page-bar, contact-rail) contre
  `blur(11px) saturate(1.08)` (window).
- **Profondeur.** `calc(var(--z-window) + 1)` et `+ 2`
  (`station.scss:99,106`).
- **Jetons morts.** `--g`, `--z-window-top` et `--z-skip` ne servent nulle
  part.

**B2. [I] Le lien d'évitement n'a pas de style (accessibilité).**
`app.component.html:1` : au focus, le lien retombe dans le flux, sans
z-index ni position. Correction : une classe `.skip-link` globale qui
utilise `--z-skip`.

**B3. [I] Couleurs du canvas.** Les replis `'#2b2f3a'` et `'#3b62c4'`
(`object.component.ts:252-253`) viennent de l'ancienne palette claire. Les
rampes hex du moteur sont physiques : à nommer dans un `palette.ts`.

**B4. Motifs dupliqués → primitives.**

| Motif                              | Occurrences                                                                            | Dérive                                  | Outil                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------- |
| Libellé « caps » mono              | ~16 (index, preview, sheet, about, workbench, window, intro, station, orbit, page-bar) | m1/m2, caps/title                       | mixin `type.caps($size, $track)` (un `app-caps` serait un anti-pattern)           |
| `dd` data / quiet / text           | preview :6-16,51, sheet :52-64, about :50-62 (about :56-58 est une règle morte)        | —                                       | utilitaires globaux `.data`, `.quiet`, `.text`                                    |
| Liste de faits `dl`                | preview :18-49, sheet :25-50, about :13-39 (+ domains/milestones)                      | dt 9, 10 ou 11ch ; padding 7, 9 ou 11px | classe `.fact-list` + `--fact-term: 10ch` (pas de composant : les `dd` diffèrent) |
| Lien « … → »                       | sheet :193, about :174, preview :60, index :156, not-found :23, orbit :132             | hauteur 34, 38 ou 40 ; filet            | classe `.next-link`, pour `<a>` et `<button>`                                     |
| Marqueur carré                     | orbit :33,96 (5px), station :60 (6px), window :45 (7px)                                | 3 tailles                               | mixin `marker($size)` ; vérifier la maquette                                      |
| Remise à zéro des boutons          | ~10                                                                                    | —                                       | `:where(button)` dans `_base`                                                     |
| Bouton-icône                       | window :80-104 / contact-rail :72-96                                                   | 34×32 contre 38×34                      | mixin `icon-button`                                                               |
| Onglet fantôme                     | segmented :23-48 / page-bar :76-106                                                    | padding 11 ou 12px                      | mixin `tab`                                                                       |
| Cadre vitré + filet + `ul` gap 2px | page-bar :11-20,64-74 / contact-rail :22-35,65-70                                      | —                                       | mixin `glass` + `.divider`                                                        |
| `.grow`                            | about :140, not-found :19, workbench :56                                               | —                                       | utilitaire global                                                                 |
| Anneau de focus                    | global (`_base.scss:65`)                                                               | —                                       | déjà correct                                                                      |

**B5. [I] Bloc `data-arrival` répété.** On le trouve dans
`contact-rail.scss:1-20,109-114`, `orbit-rule.scss:1-22,212-216` et
`station.scss:35-47,120-125`, avec une variante dans
`page-bar.scss:112-130`. Correction : un mixin `@include arrival($dur,
$delay)`.

**B6. [I] `@keyframes rise` écrit 5 fois.** Il faut le définir une fois,
dans `_motion.scss`.

**B7. [C] `prefers-reduced-motion` répété.** Il y a un bloc par composant, 9
en tout. Une règle globale suffit ; seule l'exception de `intro-card` reste
locale.

**B8. [C] Global et local.**

- `.landing` (`_base.scss:98`) duplique `.visually-hidden`
  (`styles.scss:11`).
- `workbench.scss:7-49` recopie les emplacements de la station et dérive
  déjà.
- Aucun `::ng-deep`.
- Budget de style (sources non minifiées) : `orbit-rule` 3,8 kB,
  `project-sheet` 3,5 kB et `project-index` 3,1 kB approchent du seuil de
  4 kB.

## Structure cible

```
src/app/shared/
  ui/
    window/          (libellés injectés, sans margin=26 implicite)
    segmented/
    page-bar/        (sans arrival.model)
    contact-rail/    (liens en entrée)
    arrival/arrival.model.ts
src/app/features/station/
  components/object/{object.component.*, engine/, palette.ts}
src/app/pages/station/
  station.component.*  intro-card/  orbit-rule/  views/{about-window, not-found-window}/
src/assets/styles/
  _tokens.scss       (+ --gutter, --target(-compact), --radius-control, --ls-display, --glass-blur)
  _fonts.scss
  _base.scss         (+ remise à zéro :where(button), skip-link)
  _utilities.scss    (.visually-hidden, .landing, .grow, .data, .quiet, .text, .fact-list, .next-link)
  _motion.scss       (@keyframes rise, mouvement réduit global)
  mixins/_type.scss  (caps, title, data)
  mixins/_controls.scss (tab, icon-button, glass, marker)
  mixins/_arrival.scss
src/styles.scss      (@use des partiels uniquement)
```

Les composants importent les mixins par `@use 'mixins/...'`, via
`stylePreprocessorOptions.includePaths`.
