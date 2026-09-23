# Phase 3 : second audit et plan (23 septembre 2026)

Audit mené sur `main` au commit `60718da` (après la PR #26), une fois la
phase 2 livrée. Quatre audits en lecture seule, sur des périmètres disjoints :
arborescence et architecture, pratiques Angular 22, clean code hors moteur,
moteur canvas. Même règle que le `README.md` de ce dossier : ce fichier ne se
réécrit pas, l'avancement se coche ici, les décisions vont dans
`docs/architecture/decisions.md`.

Gravités : **[B]** bloquant, **[I]** important, **[C]** confort.

## Synthèse

Le socle tient : la phase 2 a tenu ses promesses, et les correctifs du
premier audit sont en place. Le code suit déjà Angular 22 sur l'essentiel
(`inject()`, `host: {}`, control flow, zoneless, Vitest, resolvers et guards
fonctionnels). Ce qui reste :

- **[B] `pages/` ne contient pas que des pages.** 17 fichiers de `pages/station`
  et `pages/` sont des contrôleurs, directives, sous-composants, un binding et
  des resolvers. Aucune règle ne le vérifie.
- **[B] Des zones échappent au lint.** `src/app/i18n/` et les `app.*.ts` de la
  racine n'appartiennent à aucune zone : `@app/i18n` importé depuis `core`,
  `shared/ui` ou une feature passe (vérifié), alors qu'`i18n/` importe les
  features.
- **[I] La CI ignore les avertissements.** `eslint .` tourne sans
  `--max-warnings 0` : toute règle en `warn` n'est tenue par rien.
- **[I] Le moteur reste hors des limites** (34 avertissements) et les règles
  Sonar que l'IDE montre ne sont pas dans le lint.
- **[I] Trop de commentaires.** Beaucoup paraphrasent le code ; plusieurs sont
  faux (`CLAUDE.md` cite `LocalStorageService`, supprimé).
- **[I] SRP.** `BrowserEnvironment` (20 membres, 12 utilisés par l'objet
  seul), `WindowComponent` et `StationComponent` (au plafond des 300 lignes).
- **[I] Code mort et doublons.** La chaîne `reset` de `ProjectsManager` n'a
  aucun appelant ; la table vue → fenêtre est écrite deux fois.
- **[I] Angular 22.** OnPush explicite redondant, `@Service()`, deux effects
  qui propagent un état, un abonnement RxJS hors frontière.

## Décisions

| #   | Question                       | Décision                                                                                              |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| D7  | Nommage des fichiers           | on garde les suffixes (`.component.ts`, `WindowComponent`) ; `angular.json` fixe `type`               |
| D8  | Ce qui sort de `pages/station` | une feature `profile` ; le reste dans `features/desktop` et `shared/ui` (tableau ci-dessous)          |
| D9  | Avertissements                 | zéro, `--max-warnings 0` ; aucune exception, ni `eslint-disable` ni règle levée pour un fichier       |
| D10 | Commentaires                   | aucun dans le code, ni pourquoi ni trace du chantier ; les raisons vont dans le journal des décisions |
| D11 | Moteur (remplace D2)           | découpage objet, SOLID avec SRP et KISS d'abord, sous le golden étendu                                |
| D12 | Noms venus de la maquette      | un nom se comprend sans la maquette : `station` → `desktop`, `object` → `space-scene`                 |

## Destinations de `pages/`

Avec D12 appliqué : `features/station` devient `features/desktop`,
`pages/station` devient `pages/desktop`, `components/object` devient
`components/space-scene`, `shared/ui/object-marks` devient
`shared/ui/scene-anchors`.

| Actuel                                         | Destination                                           |
| ---------------------------------------------- | ----------------------------------------------------- |
| `pages/station/station.component.*`            | `pages/desktop/desktop-page.component.*`              |
| `pages/station/station-projects.binding.ts`    | `pages/desktop/desktop-projects.provider.ts`          |
| `pages/station/about-window/`                  | `features/profile/components/about-window/`           |
| `app.contact.ts`                               | `features/profile/data/`                              |
| `pages/station/intro-card/`                    | `features/desktop/components/intro-card/`             |
| `pages/station/home-title/`                    | `features/desktop/components/home-title/`             |
| `pages/station/not-found-window/`              | `features/desktop/components/not-found-window/`       |
| `pages/station/arrival/curtain.ts`             | `features/desktop/services/curtain.service.ts`        |
| `pages/station/arrival/arrival.controller.ts`  | `shared/ui/arrival/`                                  |
| `pages/station/head-bottom/`                   | `shared/ui/head-bottom/`                              |
| `pages/station/window-stack/`                  | `shared/ui/window-stack/`                             |
| `pages/station/station.ids.ts`                 | `features/desktop/models/`                            |
| `pages/view-marker/`, `pages/project-detail/`  | restent : composants routés                           |
| `pages/view-head.ts`, `project-title.resolver` | `pages/*.resolver.ts`, admis par le garde de `pages/` |

Les sous-composants qui lisent `PAGES_TEXTS` prennent d'abord une tranche de
textes à leur feature : `i18n/` importe les features, l'inverse ferait un
cycle.

## Plan

Une branche et une PR par étape, empilées ; `npm run check` passe à chaque
commit.

- [ ] **0. `docs(audit)`** : ce fichier et les décisions D7 à D12.
- [ ] **1. `chore(lint)`** :
  - zones `i18n` et racine dans `eslint.config.js` ; alias `@app/…` à la
    racine au lieu des chemins relatifs ;
  - un garde « `pages/` ne contient que `*-page.component.*`,
    `*.component.*` routés, `*.provider.ts`, `*.resolver.ts` » ;
  - `--max-warnings 0` ; `eslint-comments/no-use` (aucun `eslint-disable`) ;
    revue de chaque réglage par fichier de `eslint.config.js` : une
    exception disparaît, un réglage de catégorie reste avec sa raison ;
  - règles choisies de `eslint-plugin-sonarjs` et `eslint-plugin-unicorn`
    (cognitive-complexity 15, prefer-includes, dom-node-dataset,
    no-negated-condition, prefer-modern-math-apis, no-for-each…), le moteur
    exempté jusqu'à l'étape 6 ;
  - `angular.json` : `type` fixé pour les schematics (D7), `changeDetection`
    retiré ; `prefer-on-push-component-change-detection` avec
    `allowExplicitOnPush: false` et OnPush explicite retiré partout ;
  - corriger ce que ces règles trouvent hors moteur, y compris les
    complexités de gabarit de `project-sheet.component.html`.
- [ ] **2. `refactor(tree)`** : les renommages de D12 et les déplacements du
      tableau ci-dessus, en un seul passage par fichier ; `desktop` et
      `profile` dans `FEATURES` ; les tranches de textes ; le README. Puis une
      passe de nommage sur tout le dépôt avec le même critère : un nom qui
      suppose d'avoir lu la maquette (`curtain`, `arrival`, `view-marker`,
      `head-bottom`, `part`, `ciel`…) est renommé pour dire ce qu'il fait.
- [ ] **3. `refactor(angular)`** :
  - `@Service()` si ngx-statewise l'accepte (à vérifier d'abord) ;
  - `WindowStack.order` en `linkedSignal`, l'effect ne garde que le focus ;
  - la synchronisation route → store de `project-detail` et `view-marker`
    dans un resolver ; `RouterTestingHarness` dans leurs specs ;
  - `Locale` dérivé de `router.lastSuccessfulNavigation()` ;
  - les scrolls « remonter en haut » en `afterRenderEffect`, écrits une fois.
- [ ] **4. `refactor(clean)`**, hors moteur :
  - commentaires : tous retirés (D10) ; ce qui en avait besoin est renommé
    ou découpé, et un pourquoi qui vaut d'être gardé part dans le journal
    des décisions ;
  - code mort : chaîne `reset`, `isLoading`/`isError`, `factsOf`,
    `data-object-line`, `?? 'profile'`, relais purs du binding ;
  - doublons : table vue → fenêtre (un type, une fonction), `twoDigits`,
    `sampleRanked` bâti sur le vrai manager, `catalogOf`, bloc `dl` ;
  - SRP : `BrowserEnvironment` resserré, un `CanvasEnvironment` pour l'objet ;
    `WindowComponent` et `StationComponent` découpés ;
  - nommage : sorties `xxxChange`, booléens `is…`, `chapter`/`approach`,
    fichiers dont le nom ne dit pas le contenu ;
  - valeurs en dur : marges des fenêtres, viewport de repli, couleurs de
    repli, `featured = input(4)`.
- [ ] **5. `test(object)`** : scènes golden supplémentaires dans un fichier à
      part, empreintes prises avant toute extraction : comètes, `dpr` 2,
      téléphone, `measureLabels`, mouvement réduit.
- [ ] **6. `refactor(object)`**, en plusieurs PR (D11) : un renderer par
      couche derrière une interface étroite, caméra, entrée et état de scène
      en classes, un contexte d'image réutilisé (aucune allocation par
      grain) ; puis l'exemption du moteur disparaît du lint.
- [ ] **7. `docs(architecture)`** : `passation-showcase.md` à jour (suffixes
      assumés, OnPush par défaut, `@Service`, effects, `withFetch`,
      `npm run check`, `pages/`, `profile`) ; `CLAUDE.md` corrigé.
