# Portfolio — Pierre-Marie Marchio

Site portfolio en **Angular 22**, prérendu (SSR au build), zoneless, avec l'état
géré par **ngx-statewise**. L'architecture reprend celle du showcase
ngx-statewise : quatre couches, une loi de dépendance vérifiée par le lint, un
flux d'état unidirectionnel.

> État actuel : **la base**. Les pages sont volontairement nues. La maquette
> (« la station ») viendra se poser sur cette base, sans en changer la structure.

La documentation de référence est dans [`docs/`](docs/README.md) :
l'architecture dans `docs/architecture/`, le design dans `docs/maquette/`.

## Démarrer

```bash
nvm use            # Node 24, voir .nvmrc
npm ci
npm start          # http://localhost:4200
```

| Script                    | Rôle                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `npm run build`           | build de production + prérendu de toutes les routes                                                                   |
| `npm run serve:static`    | sert `dist/portfolio/browser` comme un hébergeur static                                                               |
| `npm test`                | Vitest + jsdom, une passe                                                                                             |
| `npm run lint`            | ESLint, dont la loi de dépendance, puis Stylelint, zéro avertissement                                                 |
| `npm run check:structure` | la nomenclature d'`organisation.md` §3 ; échoue sur un écart                                                          |
| `npm run check:comments`  | aucun commentaire dans le code (D10) ; échoue en listant ceux qui restent                                             |
| `npm run check:e2e`       | Playwright sur le site prérendu, Chromium et WebKit, à chaque taille cible (`dist/` doit être construit)              |
| `npm run check`           | format:check → typecheck:tools → lint → test → build → check:prerender → check:structure → check:comments → check:e2e |

Les messages de commit suivent les Conventional Commits (Husky + commitlint).

## Les couches

```
src/app/
  app.config.ts          racine de composition : statewise, i18n, initializer
  app.routes.ts          chaque vue dans les deux langues, sa vue en data, sa
                         tête par le resolver page-head
  app.routes.server.ts   prérendu, une page par projet via getPrerenderParams
  i18n/                  les catalogues (data/fr.data.ts, en.data.ts, un
                         Catalog chacun), la table des adresses
                         (data/paths.data.ts), provideI18n, la garde
  app.component.*        compose le shell et le <router-outlet>

  core/                  infrastructure, aucun concept métier
    services/            le navigateur (un service par sujet), la présence
                         du lecteur, le <head>, la langue, les erreurs
    strategies/          la tête de chaque route (RouteHeadStrategy)
    models/ rules/       la langue et la localisation
    helpers/             petites fonctions pures, sans domaine
  shared/                trois librairies, qui n'importent que core (D20)
    ui/                  les composants d'interface sans métier
    windows/             la fenêtre, son glissement, sa pile
    space-scene/         la scène canvas : moteur, règles, composant
  features/
    common/              les contrats de deux features : LINKS, SceneAnchorKind
    projects/
      components/        barre vedettes, liste, aperçu, fiche
      data/              contenu : un fichier par projet, leur ordre, libellés
      models/ services/ ports/ rules/ states/
    observatory/
      components/        la scène de l'observatoire, la carte d'ouverture, le titre,
                         la fenêtre « adresse inconnue », la pause, le dock
      services/          la révélation de l'accueil, le tour des vedettes
      models/ ports/ rules/ states/observatory/ states/animation/
    profile/
      components/        la fenêtre « à propos »
      data/ models/ ports/
  pages/                 composition : un dossier par écran
    observatory/         l'écran de l'observatoire et sa feuille de route
    workbench/           l'atelier des composants, en développement
    resolvers/           les têtes de page, dans la langue visée
src/testing/             fixtures/ et doubles/ des specs
src/integration/         suites qui testent un mécanisme, pas un composant
```

Une feature ne crée un sous-dossier (`guards/`, `ports/`, `interceptors/`…)
que lorsqu'elle a de quoi le remplir. `data/` contient le contenu livré avec le
site ; seul le repository le lit. **Ajouter ou changer un projet** : voir
[`docs/contenu.md`](docs/contenu.md).

## La loi de dépendance

`racine → pages → i18n → features → features/common → shared/<lib> → core`,
jamais sur le côté, jamais vers le haut.

| Zone              | Peut importer                         | Ne doit jamais importer                              |
| ----------------- | ------------------------------------- | ---------------------------------------------------- |
| racine `app.*.ts` | tout                                  | —                                                    |
| `pages/`          | tout, sauf la racine                  | la racine                                            |
| `i18n/`           | les features, `shared/`, `core/`      | `pages/`, la racine                                  |
| `features/<x>/`   | `core/`, `shared/`, `features/common` | une autre feature, `i18n/`, `pages/`, la racine      |
| `features/common` | rien du dépôt                         | `core`, `shared`, les features, `pages`              |
| `shared/<lib>/`   | `core/`                               | une autre librairie, les features, `i18n/`, `pages/` |
| `core/`           | rien d'autre sous `app/`              | tout le reste                                        |

Quand deux features ont besoin d'un même contrat, il **descend** dans un port
(interface + `InjectionToken`, sans factory par défaut) :

- dans `features/common` si les trois conditions sont réunies (deux
  consommateurs au moins, besoin né hors d'une composition, port réduit à ce
  qui est appelé) ;
- sinon dans `features/<consommateur>/ports/`, et la composition y répond
  (`provideI18n` pour les tranches de textes).

La loi est dans `eslint.config.js` (`zoneLaws()`). **Ajouter une feature** ou
**une librairie**, c'est ajouter son nom à `FEATURES` ou à `SHARED_LIBS` : le
lint refuse de tourner tant que la liste et le disque ne concordent pas. Les
imports qui traversent une zone passent par un alias (`@app/*`, `@shared/*`,
`@assets/*`, `@testing/*`) et le barrel du dossier ; les imports relatifs
restent à l'intérieur d'une zone.

## L'état

Flux ngx-statewise : action → updater (synchrone, seul à écrire l'état) →
effect (asynchrone) → éventuellement d'autres actions. Les composants et les
pages ne parlent qu'aux **managers**. Un concept d'état = cinq fichiers dans
`states/<concept>/` : `.action`, `.state`, `.updater`, `.effect`, `.manager`.

On dérive plutôt que de stocker : l'état garde un **slug** et l'écran en dérive
le projet (`manager.find(slug)`), jamais une copie. Ce que le lecteur regarde
et désigne (vue, fiche, épingles, sélection, filtre) est l'état `observatory` ; la
pause, l'état `animation` (D14).

## SSR et prérendu

- `outputMode: 'static'` : tout est prérendu, aucun serveur Node à héberger.
  Une route qui aurait besoin d'un rendu à la requête passerait en
  `RenderMode.Server` dans `app.routes.server.ts` (et `outputMode: 'server'`).
- `provideAppInitializer` attend le chargement des projets : le HTML prérendu
  contient déjà le contenu, lisible sans JavaScript.
- Chaque route connue a son fichier prérendu. Pour une adresse inconnue,
  l'hébergeur doit servir `index.csr.html` (le rendu se fait alors côté
  client, jusqu'à la page « Adresse inconnue ») : c'est le réglage « SPA
  fallback » de la plupart des hébergeurs statiques.
- Aucun code ne touche `window`, `localStorage`, `matchMedia` ou `canvas` en
  direct : tout passe par les services de `core/services/browser/` et `core/services/device/`, inertes au
  prérendu. `src/integration/prerender-safety.spec.ts` le vérifie.

## Conventions

**`any` est proscrit du dépôt**, qu'il soit écrit ou hérité d'une bibliothèque :
le lint est typé (`no-explicit-any`, et les règles `no-unsafe-*` qui suivent un
`any` à travers une affectation, un appel ou un retour), `$any()` est interdit
dans les templates, et les fichiers JS de configuration sont type-checkés en
strict (`tsconfig.tools.json`). Ce qui n'est pas encore connu est `unknown`,
et se restreint avant d'être utilisé.

Composants standalone, `OnPush` (le défaut d'Angular 22), `templateUrl` + `styleUrl`, `inject()`,
`input()`/`output()`, control flow `@if`/`@for`, accessibilité des membres
toujours écrite (vérifiée par le lint), sélecteurs préfixés `app-`. Une classe
porte le suffixe de son fichier (D7) : `document-head.service.ts` /
`DocumentHeadService`, `route-head.strategy.ts` / `RouteHeadStrategy`. La
liste des suffixes et des dossiers de rôle est dans
`docs/architecture/organisation.md` §3, et `check-structure.mjs` la tient.

Chaque composant a son dossier, à son nom (`featured-bar/featured-bar.component.*`).
Une entrée et la sortie qui la change forment une paire `x` / `xChange`
(`selected` / `selectedChange`, `hovered` / `hoveredChange`) ; un événement sans
état est un participe passé (`closed`, `chosen`, `pinToggled`, `spun`). Les
états se lisent en `data-*` anglais (`data-active`, `data-selected`,
`data-pinned`), et les ids adressés par le code sont des constantes
(`STATION_IDS`). Un choix du segmenté porte sa `value`, et c'est elle que le
clic rend.

Les disent le _pourquoi_ ; chaque affirmation est tenue
par un spec.

Le lint borne aussi la taille et la forme du code : 300 lignes par fichier,
60 par fonction, complexité 10, profondeur 3, 4 paramètres, et, dans les
gabarits, une complexité conditionnelle de 4 et cyclomatique de 12. Les noms
suivent `NAMES` (`eslint.config.js`). Stylelint (`stylelint.config.mjs`) vérifie
les `.scss`, et laisse la mise en forme à Prettier. Une règle que le code
enfreint encore est un avertissement : l'étape du plan d'audit qui la résout la
passe en erreur.

**Les styles.** Les jetons sont dans `src/assets/styles/_tokens.scss` : une
valeur partagée (gouttière, cibles, rayons, flou, durée) s'y écrit une fois, et
Stylelint refuse les littéraux qui la contourneraient. Les partiels globaux
(`_base`, `_motion` pour l'entrée `rise`, `_utilities`) sont chargés par
`styles.scss`. Ce que les composants partagent au-delà est un mixin de
`src/assets/styles/mixins/` (`type`, `controls`, `facts`, `arrival`, `motion`, `formats`),
importé par `@use 'mixins/…'` grâce au chemin d'inclusion d'`angular.json`,
plutôt qu'une classe globale qui gagnerait ou perdrait par sa spécificité.
