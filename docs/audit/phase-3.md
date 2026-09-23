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

## Organisation cible

L'arborescence, la nomenclature et la fiche de chaque unité sont dans
`docs/architecture/organisation.md`, qui fait foi. Il part des
responsabilités de chaque unité, relevées par un inventaire complet, et a été
relu par un architecte avant d'être retenu.

## Plan

Une branche et une PR par étape, empilées ; `npm run check` passe à chaque
commit. Ordre suivi (D16) : 0, 2, 7, 1, puis 3 à 6 et 8.

- [x] **0. `docs(audit)`** : ce fichier, `organisation.md` et les décisions
      D7 à D15.
- [x] **1. `chore(lint)`** : zones `i18n` et racine ; `--max-warnings 0` ;
      aucun `eslint-disable` ; revue des réglages par fichier ; règles Sonar
      choisies ; `angular.json` (`type` des schematics, `changeDetection`
      retiré) ; `scripts/check-structure.mjs` en mode rapport ; corriger ce
      que ces règles trouvent hors moteur.
- [x] **2. `test(object)`** : scènes golden supplémentaires (comètes,
      `dpr` 2, téléphone, libellés mesurés, mouvement réduit), empreintes
      prises avant tout ce qui touche la scène.
- [ ] **3. `refactor(tree)`** : dossiers, fichiers, sélecteurs et classes
      selon `organisation.md`, sans changer de comportement ;
      `check-structure.mjs` passe en erreur.
- [ ] **4. `refactor(units)`** : les découpages d'`organisation.md` §4.
- [ ] **5. `refactor(angular)`** : langue dérivée du routeur, composant de
      route unique qui déclare la vue, têtes de page dans la langue visée, OnPush implicite,
      `@Service()` si ngx-statewise l'accepte, `afterRenderEffect`,
      `RouterTestingHarness`.
- [ ] **6. `refactor(clean)`** : commentaires retirés (leurs raisons au
      journal), code mort, doublons, valeurs en dur.
- [x] **7. `refactor(object)`**, en plusieurs PR (D11).
- [ ] **8. `docs(architecture)`** : `passation-showcase.md` rejoint
      `organisation.md`.
