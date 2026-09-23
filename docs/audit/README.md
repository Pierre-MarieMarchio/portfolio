# Audit du 23 septembre 2026 et plan de reprise

Trace de l'audit mené sur `main` au commit `cf0034b` (après la PR #15), avant
toute modification. Ce dossier dit **ce qui a été constaté, comment, et ce qu'il
est prévu d'en faire**. Il ne se réécrit pas : l'avancement du plan se coche
ici, les décisions prises s'ajoutent à `docs/architecture/decisions.md`.

```
docs/audit/
  README.md                         ce fichier : méthode, synthèse, plan, décisions
  phase-3.md                        second audit (après la PR #26) et son plan
  rapports/
    00-premiere-passe.md            projets, FEATURED_COUNT, textes, bilingue (essais compris)
    01-moteur-bugs.md               moteur canvas : bugs, fuites, cohérence des entrées
    02-composants.md                composants : taille, SRP, entrées/sorties
    03-services-etat.md             services, states ngx-statewise, nommage
    04-shared-design-system.md      découpage de shared/, jetons, primitives
    05-moteur-structure.md          moteur canvas : god class, clean code, découpage
    06-nommage-tests-outillage.md   nommage, clean code, tests, lint, CI
    07-moteur-contraintes.md        moteur : ce qui contraint son découpage (phase 3)
```

## Méthode

- Lecture des documents de référence (`docs/architecture/*`, `docs/maquette/*`)
  puis de tout le code applicatif.
- Essais sur une branche jetable (supprimée depuis) :
  - un projet ajouté dans `projects.data.ts` seulement, puis build et lecture
    du HTML prérendu ;
  - `FEATURED_COUNT` passé à 3 puis à 5, et les tests relancés.
- Six audits confiés à des agents, en lecture seule, chacun sur un périmètre
  distinct (rapports 01 à 06). Les constats principaux ont été revérifiés dans
  le code : ✔ = vérifié, ~ = lu dans le code sans être observé.
- **Limite.** Aucune capture : l'extension navigateur n'était pas connectée.
  Les constats visuels (règle d'accueil, orbites) sont calculés depuis le
  code.
- État de départ : `npm run check` passe (335 tests, 10 routes prérendues,
  bundle initial 445,6 kB pour un seuil d'alerte à 500 kB).

Gravités : **[B]** bloquant, **[I]** important, **[C]** confort.

## Synthèse

Le socle est bon : la loi de dépendance est tenue par le lint, le typage est
très strict, l'état est unidirectionnel, les commentaires disent le pourquoi et
aucun écouteur ne fuit. La couche du dessus a grandi vite, et un relecteur
exigeant y trouve cinq défauts récurrents :

- des composants trop gros, surtout `StationComponent` avec onze
  responsabilités ;
- des règles écrites deux fois ;
- des jetons de design contournés, et aucune primitive partagée ;
- une API de `shared/ui` pas toujours neutre (l'objet connaît la station) ;
- des doubles de test qui recopient la logique métier au lieu de l'exercer.

Les trois points qui bloquent les objectifs (projets, textes, bilingue) :

1. **✔ [B] Un projet oublié dans un fichier passe tous les garde-fous.** Le
   test censé attraper l'oubli compare à une liste recopiée, pas à `PROJECTS`.
   Conséquences observées :
   - le relevé annonce « 08 réalisations » mais n'affiche que 7 lignes ;
   - les compteurs de familles sont faux ;
   - `/projet/<slug>` est prérendue avec une fenêtre vide et sans `h1`.
2. **~ [B] À 12 projets, les planètes mises en avant s'empilent.**
   `orbitRank` normalise sur tous les corps, même ceux que l'accueil
   n'affiche pas.
3. **[B] Aucun texte n'est traduisible.** Tous les textes sont en dur dans
   les gabarits, les `.ts`, les données et le canvas.

Les rapports détaillent le reste, avec pour chaque constat le fichier, la
ligne, la preuve et la correction.

## Recommandation pour le bilingue

La recommandation est un **catalogue de textes chargé à l'exécution**, avec
**l'URL qui fixe la langue** :

- le français reste à la racine (`/`, `/projets`, `/projet/:slug`,
  `/a-propos`) ;
- l'anglais va sous `/en` (`/en`, `/en/projects`, `/en/project/:slug`,
  `/en/about`) ;
- les deux langues sont prérendues ;
- `lang`, `hreflang` et `canonical` sont posés par un service de `core` ;
- le sélecteur FR/EN est un vrai lien, et le changement de langue est une
  navigation du routeur : la station reste montée, rien n'est perdu.

L'i18n native d'Angular (`$localize`) est écartée pour trois raisons :

- le français resterait dans les gabarits ;
- changer de langue rechargerait une autre application, et les épingles, la
  sélection et la caméra seraient perdues ;
- GitHub Pages ne sert qu'un `404.html` pour les deux builds.

La comparaison complète est au rapport 00, §5.

## Plan de la phase 2

Une branche et une PR par étape, en conventional commits anglais. `npm run
check` passe à chaque commit. Le nettoyage (étapes 2 à 5) passe avant les
fonctionnalités (6 à 8), pour ne pas traduire du code qu'on va refaire.

- [x] **0. `docs(audit)`** : versionner ce dossier.
- [x] **1. `chore(lint)`** : règles de taille et de complexité (`max-lines`,
      `complexity`, `max-depth`), `@typescript-eslint/naming-convention`,
      `prefer-on-push`, complexité des gabarits, et stylelint pour le SCSS.
      Ces règles sont d'abord en avertissement, puis passent en erreur au fil
      des étapes (rapport 06 §4).
- [x] **2. `refactor(core)`** (rapport 03) :
  - supprimer le code mort : `LocalStorageService`, `json.utils`,
    `refusalReason`, la branche HTTP de `ReportedErrors` ;
  - `ReportedErrors` : lui donner un lecteur, ou le réduire ;
  - écrire le spec d'`AppErrorHandler` ;
  - `PageHead` devient le seul propriétaire du `<head>`, avec un resolver pour
    le titre des fiches ;
  - resserrer `BrowserEnvironment`, dont `document` ne doit plus être
    public ;
  - déplacer `ScrollMemory` dans `shared/ui/window` ;
  - faire de `SITE_NAME` une constante et supprimer `environments/` ;
  - harmoniser les suffixes de classes.
- [x] **3. `refactor(styles)`** (rapport 04 §B) :
  - compléter les jetons (`--gutter`, `--target`, `--radius-control`,
    `--ls-display`, flou) et retirer les jetons morts ;
  - créer les partiels `_utilities`, `_motion` et `mixins/{type,controls,arrival}` ;
  - donner son style au lien d'évitement ;
  - migrer tous les `.scss`.

  Aucun changement visuel n'est attendu : on le vérifie sur le HTML et le CSS
  prérendus.

- [x] **4. `refactor(shared)`** (rapports 02, 04 §A et 06 §1) :
  - `SegmentedItem<T>` porte une `value` ;
  - l'entrée `title` de `WindowComponent` devient `heading` (✔ elle fuit
    aujourd'hui en infobulle native) ;
  - `Arrival` sort de `page-bar` ;
  - `contact-rail` passe dans `shared/ui`, avec ses liens en données ;
  - l'objet passe dans `features/station/components/object`, avec des
    directives `appObjectPanel` et `appObjectLine` et un registre à la place
    des `querySelectorAll` ;
  - harmoniser les noms : sorties `xxxChange`, `data-*` en anglais, ids en
    constantes.
- [x] **5. `refactor(station)`** (rapports 02 et 03) :
  - découper `StationComponent` en `ArrivalController`, `Curtain`, directive
    `windowStack` (ordre dans un signal), directive `landingHeading`,
    directive `headBottom`, `StationProjectsBinding` et `HomeTitleComponent` ;
  - une fonction pure `stepBack()` et un `canStepBack` dans le manager ;
  - un seul `ViewMarkerComponent` à la place des quatre marqueurs ;
  - `part` devient un nombre ;
  - renommer `syncRoute`, `stepBack` et `openPreview` ;
  - écrire les specs du rideau, du focus et de `windowStack`.
- [x] **6. `feat(projects)`** (rapports 00 §3 et 02) :
  - une entrée typée par projet (identité, faits, fiche, figure), et
    `PROJECTS` réduit à une liste ordonnée d'imports ;
  - un projet sans faits ou sans fiche ne compile pas ;
  - le rang et le numéro sont calculés une seule fois ;
  - `isFeatured` et `nextOf` dans le manager ;
  - `orbit-rule` rejoint la feature ;
  - les doubles de test sont bâtis sur le vrai manager ;
  - la phrase « sept fiches » est dérivée du nombre ;
  - écrire `docs/contenu.md`.
- [x] **7. `feat(home)`** (rapports 00 §3 et 01) :
  - `FEATURED_COUNT` reste la seule valeur ;
  - la règle répartit ses repères selon leur nombre et la largeur
    disponible ;
  - `orbitRank` est calculé sur les corps affichés ;
  - l'aperçu est réservé à l'accueil et aux projets mis en avant ;
  - tests à 3 et 5 projets mis en avant, et à 3 et 12 projets en tout.
- [x] **8. `feat(i18n)`** :
  - un service `Locale` dans `core` ;
  - des catalogues `fr` et `en` typés (une clé manquante ne compile pas),
    chargés comme chunks par l'initialiseur ;
  - les routes `/en/…` générées depuis une seule table ;
  - le sélecteur devient un lien ;
  - tous les textes passent au catalogue, y compris `aria-label`, `title`,
    SEO et canvas ;
  - les fiches reçoivent une meta description ;
  - l'anglais rédigé est marqué `draft('…')`, et un spec compte les textes
    restant à relire ;
  - consigner les écarts dans `docs/maquette/README.md`.
- [x] **9. `refactor(object)`**, en version limitée (rapports 01 et 05) :
  - d'abord un test « golden » : un contexte canvas enregistreur, une graine
    fixe, des instants fixes ;
  - puis `constants.ts` et `projection.ts` (dont une seule portée du curseur) ;
  - puis l'extraction de `Turntable` et de `labels.ts` ;
  - puis les corrections du rapport 01 : plancher des orbites sur téléphone,
    bascule du mouvement réduit, `fitOrbits` avant la caméra, `part` borné par
    `CONSTELLATIONS`.

  La boucle des grains ne change pas.

## Décisions en attente

Elles sont à trancher avant l'étape concernée. Les valeurs proposées sont les
recommandations de l'audit.

| #   | Question                                | Proposé                                                       | Étape |
| --- | --------------------------------------- | ------------------------------------------------------------- | ----- |
| D1  | Ordre du plan                           | nettoyage (1-5) puis fonctionnalités (6-8), moteur en dernier | tout  |
| D2  | Portée du refactor du moteur            | limitée (étape 9 ci-dessus)                                   | 9     |
| D3  | Approche bilingue                       | catalogue à l'exécution, l'URL fixe la langue                 | 8     |
| D4  | Adresses                                | FR à la racine, EN sous `/en/…` (`/en/projects`, `/en/about`) | 8     |
| D5  | Textes des projets                      | dans le fichier de chaque projet, FR et EN côte à côte        | 6, 8  |
| D6  | Focus sur le `h1` au premier chargement | réservé aux navigations (à confirmer)                         | 5     |

## Règles de travail (rappel)

- Une branche et une PR par sujet ; conventional commits en anglais,
  vérifiés par commitlint.
- **Aucune mention de Claude** dans les commits et les PR.
- Node n'est pas dans le PATH de bash : `export PATH="/c/Program
Files/nodejs:$PATH"`. Ne jamais contourner le hook.
- Pousser et ouvrir les PR avec le compte `Pierre-MarieMarchio` (`gh auth
switch -u Pierre-MarieMarchio`), puis remettre `PierreMarieMarchio`.
- Ne jamais modifier les `.dc.html` de `docs/maquette/`. Tout écart assumé se
  consigne dans `docs/maquette/README.md`, section « Écarts déjà décidés ».
- Écrire comme le code existant : les commentaires, en anglais, disent le
  pourquoi ; chaque affirmation est tenue par un spec.
