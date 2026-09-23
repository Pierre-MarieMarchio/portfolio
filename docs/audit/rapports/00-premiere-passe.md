# 00 — Première passe : architecture, logique, projets, textes, bilingue

Audit mené directement, sans agent, avec essais sur une branche jetable.
L'état de départ est `main` à `cf0034b`, avec `npm run check` qui passe.

## 1. Architecture et composants

La loi de dépendance est respectée au sens du lint : aucun import interdit, et
`zoneLaws()` couvre `projects` et `station`. Les écarts sont d'ordre
conceptuel.

- **[I] `shared/ui/object` connaît la station sans l'importer.**
  - Il interroge tout le document : `object.component.ts:353,389-392`
    cherchent `[data-panel]` et `[data-object-line]`, et les lignes `373-385`
    connaissent les rôles `head`, `rule`, `sheet` et `preview`.
  - `ObjectView` (`engine/object-engine.ts:42`) reprend les noms des pages.
  - `PART_LABELS` (`engine/constellations.ts:134-139`) contient les parties de
    « À propos ».
  - Les noms accessibles (`object.component.ts:129-130`) parlent de « relevé ».
- **[I] Doublons.**
  - `@keyframes rise`, identique, est écrit 5 fois :
    `contact-rail.component.scss:98`, `intro-card.component.scss:97`,
    `orbit-rule.component.scss:201`, `station.component.scss:109`,
    `page-bar.component.scss:132`.
  - `Slot` et `SLOTS` (`station.component.ts:32,431`) répètent
    `StationWindow` (`station.model.ts:9`).
  - `rankOf` : `station.component.ts:333` et `projects.manager.ts:94`.
  - `INTENT` : `station.component.ts:49` et `intro-card.component.ts:15`.
  - `orbitRank` : son export est mort (`shared/ui/object/index.ts:1`) et son
    commentaire est faux (`engine/math.ts:34-35`, « the home rule reads this
    same function »).
- **[C] Commentaires devenus faux.**
  - `README.md:8-9` dit que les pages sont « volontairement nues », et
    `README.md:47-48` liste `nav-shell/`.
  - `docs/maquette/README.md:3-5` dit « pas encore implémenté », et `:50-54`
    dit « n'en reprend que les slugs ».
  - `features/common/index.ts:19` dit « one feature ».
  - `home-page.component.ts:4-8` et `not-found-page.component.ts` sont un
    copier-coller.
  - « four » ou « seven » en dur : `projects.data.ts:6`,
    `projects.manager.ts:15-18`, `project-preview.component.ts:18`,
    `project-index.component.ts:40`, `window.model.ts:4`.
- **[C] Sélection par libellé.** `project-index.component.ts:135`,
  `about-window.component.ts:133` et `segmented.component.html:2` identifient
  un élément du segmenté par son libellé, ce qui casse à la traduction.
- **[C] Données de figure mal rangées.** `LAYERS` est au niveau du catalogue
  (`labels.data.ts:21`, `project-catalog.model.ts:19`) au lieu d'être sur son
  chapitre. La figure « flux » est en dur dans
  `project-sheet.component.html:69-79`.

## 2. Logique

- **[I] L'aperçu agit sur toutes les vues.** `previewRank`
  (`station.component.ts:162`) ne dépend pas de la vue, et le moteur freine
  la rotation dès que `preview >= 0` (`object-engine.ts:596`). De plus,
  `onBodyClicked` (`station.component.ts:295-305`) ouvre l'aperçu de
  n'importe quel corps : avec l'aperçu épinglé, le badge peut afficher
  « 00 / 04 » (`project-preview.component.ts:44-47`).
- **[I] Orbites trop larges sur téléphone.** Dans `engine/scene.ts:312`, le
  plancher `Math.max(4.6, …)` peut dépasser `maxH` ; vers 375 px, l'orbite
  externe sort du cadre. Constat ~ (lu, non observé).
- **[I] Traversée rejouée.** Passer du mouvement réduit au mouvement normal
  rejoue la traversée d'ouverture (`object-engine.ts:583,650,682`).
- **[I] Rideau et focus sans spec.** Ni le rideau (`station.component.ts:343-384`)
  ni `claimFocus` (`:405`) ne sont testés. Le focus est aussi pris au premier
  chargement (`:269-284`).
- **[C] Cas limites.**
  - `stationChapterChosen` n'a pas de borne haute (`station.updater.ts:64`).
  - Le moteur borne `part` à 3 en dur (`object-engine.ts:1143`).
  - `focus = -1` cadre la planète 0 (`object-engine.ts:820`).
  - La région `aria-live` de la règle (`orbit-rule.component.html:39`) parle
    à chaque survol.
- **Fuites : aucune trouvée.** Les écouteurs, observateurs, minuteurs et la
  boucle rAF sont retirés à la destruction.

## 3. Ajouter un projet, faire varier `FEATURED_COUNT` (essayé)

**Ce qu'il faut toucher aujourd'hui pour ajouter un projet (6 endroits)** :

- `projects.data.ts`, `facts.data.ts`, `sheets.data.ts` ;
- `ORBIT_ORDER` dans `projects.data.spec.ts:12` ;
- le 7 de `projects.manager.spec.ts:116` ;
- la phrase « sept fiches » de `not-found-window.component.html:11` (**[I]**).

**Essai A : un projet ajouté seulement dans `projects.data.ts` (✔ [B]).**
`tsc` passe et le build passe (11 routes). Deux tests échouent, et
seulement parce qu'ils écrivent des nombres en dur :
`projects.data.spec.ts:29` et `projects.manager.spec.ts:116`. Le test
« one facts entry and one sheet per project » (`projects.data.spec.ts:33-36`)
**passe**, parce qu'il compare à une liste recopiée.

Dans le HTML prérendu :

- `/projets` titre « le relevé des 08 réalisations » et « 08 fiches », mais
  n'affiche que 7 lignes ;
- le filtre indique « Personnels 04 » et le pied « 04 personnels », pour 3
  lignes affichées ;
- `withFacts` écarte le projet sans rien dire (`projects.manager.ts:46-52`),
  alors que les compteurs lisent `projects()`
  (`project-index.component.ts:79-91`) ;
- `/projet/demo` est prérendue avec une fenêtre vide et sans `h1` : le
  gabarit de `project-sheet.component.html:1` ne rend rien, et `isNotFound`
  reste faux (`station.component.ts:109-113`) ;
- les numéros du relevé (`project-index.component.ts:117`) se décalent par
  rapport au rang de l'objet et de la fiche.

**Essai B : `FEATURED_COUNT` à 3 puis à 5.**

- Un seul test échoue : `projects.manager.spec.ts:31`, qui écrit le 4 en dur.
- S'adaptent sans retouche : l'aperçu (badge et segmenté), le rideau, les
  planètes mises en avant (`[featured]`) et les décalages d'entrée du moteur.
- **~ [I] La règle ne suit pas.** `orbit-rule.component.ts:48` étale les
  repères sur une largeur fixe de 56 %. À 924 px, la piste fait environ
  680 px : 5 repères donnent 95 px d'écart pour des libellés d'environ
  130 px, qui se chevauchent. Constat calculé, pas observé.

**Nombre total de projets.**

- **~ [B] À 12, les projets mis en avant s'empilent.** `orbitRank`
  (`engine/math.ts:37-44`) normalise sur tous les corps. Les 4 mis en avant
  tombent à k ≤ 0,043, soit environ 0,09 rayon d'écart. La répulsion ne
  suffit plus non plus (`math.ts:93-126`).
- À 3 projets, tout reste correct.
- Le relevé et les filtres n'ont aucune limite.

## 4. Textes : où ils vivent

Tous en dur. Pour changer une phrase, il faut la retrouver avec `grep`, puis
éditer l'un de ces fichiers.

**Coquille et navigation**

- `app.component.html:1`
- `app.navigation.ts:4-6`
- `app.routes.ts:24-66`
- `environment.ts`
- `index.html:2,5`

**Station**

- `station.component.html:487,503,505`
- `intro-card.component.html:3-6`
- `not-found-window.component.html:2-3,10-11,15`
- `orbit-rule.component.ts:49`, `.html:3,36`
- `contact-rail.component.ts:36-37`, `.html:2,6-7,19-20,32-33`
- `about-window.component.ts:27-59` et tout son gabarit

**Composants projets**

- `project-index.component.ts:25-37,79-91`, `.html:2-3,14,20-21,48,66`
- `project-preview.component.ts:56`, `.html:3,15,23-31,39`
- `project-sheet.component.ts:82,95,111`, `.html:4,15,30-43,69-95`

**Composants partagés**

- `window.component.ts:95-99`, `.html:50-51`
- `segmented.component.ts:23`
- `page-bar.component.html:2-13`

**Moteur**

- `object.component.ts:129-130`
- `constellations.ts:134-139` (avec `toUpperCase()`)

**Données**

- les 4 fichiers de `features/projects/data/`

**SEO [I].** Les fiches n'ont aucune meta description : la route n'en a pas
(`app.routes.ts:37-40`) et `SeoService` retire la précédente. Il n'y a ni
`canonical`, ni `og:url`, ni `hreflang`.

## 5. Bilingue : comparaison

| Critère              | i18n native (`$localize`, un build par langue)                                              | Catalogue à l'exécution (signaux, un fichier par langue)                                     |
| -------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Prérendu et SEO      | natif : `/fr`, `/en`, `lang` automatique ; `hreflang` reste à écrire                        | `/…` et `/en/…` prérendus ; `lang`, `hreflang` et `canonical` posés par un service de `core` |
| GitHub Pages         | deux builds, une page de redirection à la racine, un seul `404.html` pour deux applications | une seule application : le `404.html` actuel gère aussi `/en/inconnu`                        |
| Changement de langue | rechargement d'une autre application : épingles, sélection et caméra perdues                | navigation du routeur : la station reste montée                                              |
| Données projets      | `$localize` dans le TS, la prose passe par un fichier XLF                                   | objets TypeScript typés                                                                      |
| Édition              | le français reste dans les gabarits, et il faut lancer `extract-i18n`                       | un fichier `fr.ts` et un `en.ts` ; une clé oubliée ne compile pas                            |
| Coût                 | nul à l'exécution                                                                           | le texte dans le bundle ; neutre si chaque langue est un chunk chargé par l'initialiseur     |
| Sans JavaScript      | oui                                                                                         | oui : le sélecteur est un lien `<a href="/en/…">`                                            |

**Recommandation : le catalogue à l'exécution.** C'est la seule approche
qui tient à la fois « un fichier par langue, aucun texte dans les gabarits »
et « changer de langue sans perdre l'état ». L'URL fixe la langue, pour que
chaque adresse reste prérendue et indexable.

ngx-translate et Transloco sont écartés : une dépendance de plus, du JSON
non typé et un chargeur à configurer côté serveur, pour ce que 50 lignes
font ici.
