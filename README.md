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

| Script                 | Rôle                                                    |
| ---------------------- | ------------------------------------------------------- |
| `npm run build`        | build de production + prérendu de toutes les routes     |
| `npm run serve:static` | sert `dist/portfolio/browser` comme un hébergeur static |
| `npm test`             | Vitest + jsdom, une passe                               |
| `npm run lint`         | ESLint, dont la loi de dépendance, puis Stylelint       |
| `npm run check`        | format:check → typecheck:tools → lint → test → build    |

Les messages de commit suivent les Conventional Commits (Husky + commitlint).

## Les couches

```
src/app/
  app.config.ts          racine de composition : statewise, ports, initializer
  app.routes.ts          lazy partout, un title par route (+ data.description)
  app.routes.server.ts   prérendu, une page par projet via getPrerenderParams
  app.navigation.ts      les entrées du menu
  app.contact.ts         les adresses du rail de contact
  app.component.*        compose le shell et le <router-outlet>

  core/                  infrastructure, aucun concept métier
    error-handling/      AppErrorHandler
    services/            BrowserEnvironment, PageHead (et SITE_NAME),
                         PageTitleStrategy
    utils/               fonctions pures (pas de barrel)
  shared/ui/             composants présentationnels (inputs/outputs seulement)
    arrival/             le modèle de l'arrivée du reste de l'accueil
    contact-rail/        le rail de contact (ses liens en entrée)
    object-marks/        panneaux et lignes que l'objet lit (directives + registre)
    landing-focus/       le titre où le focus arrive après une navigation
    page-bar/ segmented/ window/
  features/
    common/              noyau partagé : des ports, rien d'autre (vide pour l'instant)
    projects/
      components/        relevé, aperçu, fiche, règle d'orbite
      data/              le contenu : un fichier par projet (data/projects/),
                         leur ordre (projects.data.ts), les libellés
      models/ services/ states/projects/
    station/
      components/object/ l'objet canvas et son moteur
      models/ states/station/
  pages/                 composition : une page par route, peut tout importer
    view-marker/         le marqueur de route de chaque vue (data.view)
    project-detail/      le marqueur d'une fiche et le resolver de son titre
    station/             la station, composition seule ; ses vues (un dossier
                         par composant), l'arrivée et le rideau (arrival/), la
                         pile des fenêtres (window-stack/), la mesure de la
                         barre (head-bottom/), la jonction avec les projets
src/testing/             doubles partagés (fake-managers.ts)
src/integration/         suites qui testent un mécanisme, pas un composant
```

Une feature ne crée un sous-dossier (`guards/`, `ports/`, `interceptors/`…)
que lorsqu'elle a de quoi le remplir. `data/` contient le contenu livré avec le
site ; seul le repository le lit. **Ajouter ou changer un projet** : voir
[`docs/contenu.md`](docs/contenu.md).

## La loi de dépendance

`pages → features → shared/ui → core`, jamais sur le côté, jamais vers le haut.

| Zone              | Peut importer                         | Ne doit jamais importer                 |
| ----------------- | ------------------------------------- | --------------------------------------- |
| `pages/`          | tout                                  | —                                       |
| `features/<x>/`   | `core/`, `shared/`, `features/common` | `pages/`, **une autre feature**         |
| `features/common` | rien du dépôt                         | `core`, `shared`, les features, `pages` |
| `shared/ui/`      | `core/`                               | `features/`, `pages/`                   |
| `core/`           | rien d'autre sous `app/`              | `features/`, `shared/`, `pages/`        |

Quand deux features ont besoin l'une de l'autre, le besoin **descend** dans un
port (interface + `InjectionToken`, sans factory par défaut) :

- dans `features/common` si les trois conditions sont réunies (deux
  consommateurs au moins, besoin né hors d'une composition, port réduit à ce
  qui est appelé) ;
- sinon dans `features/<consommateur>/ports/`, avec la jonction dans
  `pages/<x>.provider.ts`.

La loi est dans `eslint.config.js` (`zoneLaws()`). **Ajouter une feature**,
c'est ajouter son nom à `FEATURES` : le lint refuse de tourner tant que la liste
et `src/app/features/` ne concordent pas. Les imports qui traversent une zone
passent par un alias (`@app/*`, `@shared/*`, `@assets/*`, `@testing/*`) ; les
imports relatifs restent à l'intérieur d'une feature.

## L'état

Flux ngx-statewise : action → updater (synchrone, seul à écrire l'état) →
effect (asynchrone) → éventuellement d'autres actions. Les composants et les
pages ne parlent qu'aux **managers**. Un concept d'état = cinq fichiers dans
`states/<concept>/` : `.action`, `.state`, `.updater`, `.effect`, `.manager`.

On dérive plutôt que de stocker : une page garde un **slug** et en dérive le
projet (`manager.find(slug)`), jamais une copie. L'état d'écran (filtre, onglet)
reste en signals locaux dans la page.

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
- Aucun code ne touche `window`, `localStorage` ou `matchMedia` en direct :
  tout passe par `BrowserEnvironment`, inerte au prérendu, qui garde le
  `document` pour lui. `src/integration/prerender-safety.spec.ts` le vérifie.

## Conventions

**`any` est proscrit du dépôt**, qu'il soit écrit ou hérité d'une bibliothèque :
le lint est typé (`no-explicit-any`, et les règles `no-unsafe-*` qui suivent un
`any` à travers une affectation, un appel ou un retour), `$any()` est interdit
dans les templates, et les fichiers JS de configuration sont type-checkés en
strict (`tsconfig.tools.json`). Ce qui n'est pas encore connu est `unknown`,
et se restreint avant d'être utilisé.

Composants standalone, `OnPush`, `templateUrl` + `styleUrl`, `inject()`,
`input()`/`output()`, control flow `@if`/`@for`, accessibilité des membres
toujours écrite (vérifiée par le lint), sélecteurs préfixés `app-`. Une classe
injectable porte le nom de ce qu'elle est (`PageHead`, `ProjectsRepository`,
`BrowserEnvironment`), sans suffixe `Service` : le suffixe est dans le nom du
fichier (`.service.ts`), avec `.strategy.ts` et `.resolver.ts` pour ce que le
routeur appelle.

Chaque composant a son dossier, à son nom (`orbit-rule/orbit-rule.component.*`).
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
`src/assets/styles/mixins/` (`type`, `controls`, `facts`, `arrival`, `motion`),
importé par `@use 'mixins/…'` grâce au chemin d'inclusion d'`angular.json`,
plutôt qu'une classe globale qui gagnerait ou perdrait par sa spécificité.
