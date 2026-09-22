# Passation — reprendre l'architecture du showcase ngx-statewise pour le portfolio

> Document destiné à une **nouvelle session** qui doit poser les bases d'un site
> portfolio **Angular SSR** propre, modulaire et extensible.
>
> **La référence, c'est le SHOWCASE** : son architecture, son arborescence et sa
> philosophie de construction sont à reproduire.
> Chemin : `~/code/Perso/Projects/workspace-ngx-statewise/projects/ngx-statewise-showcase/`
>
> Le site de docs du même workspace (`projects/ngx-statewise-docs`) n'est **pas**
> un modèle d'architecture. Il ne sert qu'à un endroit : **§7, la plomberie SSR**
> (config serveur, hydratation, accès navigateur isolé). On n'en reprend ni
> l'arborescence ni les regroupements.

> **Note du dépôt (22 septembre 2026).** Ce document a servi à poser la base ;
> il est conservé tel quel. Les écarts retenus en l'appliquant sont listés dans
> le `README.md` à la racine (prérendu statique, pas de `theme-toggle`, dossier
> `features/<x>/data/`, `FEATURES` vérifié contre le disque dans
> `eslint.config.js`).

---

## 1. La philosophie du showcase

1. **Quatre couches, et une loi de dépendance qui ne va que vers le bas.**
   `pages → features → shared/ui → core`. Jamais sur le côté, jamais vers le haut.
2. **Une feature n'importe jamais une autre feature.** C'est la règle absolue
   qui fait tenir tout le reste. Quand deux features ont besoin l'une de l'autre,
   le besoin **descend** dans un **port** (interface + `InjectionToken`). La
   **racine de composition** (`app.config.ts`, ou un `pages/xxx.provider.ts`)
   y répond avec `useExisting`/`useFactory`. Exemple : `features/auth` recharge
   les tâches via `TASK_RELOAD` sans jamais nommer `features/project`.
3. **La loi est vérifiée par le lint, pas laissée à la bonne volonté.**
   `@typescript-eslint/no-restricted-imports` est généré depuis une table de
   zones (§4). Si on casse la loi, `npm run lint` échoue.
4. **L'état suit un flux unidirectionnel (ngx-statewise)** : action →
   (interceptor) → updater (synchrone, seul endroit qui modifie l'état) →
   effect (asynchrone) → éventuellement d'autres actions. **Les composants et
   les pages ne parlent qu'aux managers.**
5. **On dérive plutôt que de stocker.** Tout ce qui peut être un `computed` en
   est un (`isAdmin`, `visibleTasks`, `isSaving`). Une page stocke un **id**
   sélectionné et dérive l'objet, jamais un snapshot qui deviendrait périmé.
6. **Les ports sont taillés au besoin de l'appelant**, pas à ce que le
   fournisseur expose. `ITaskReload` a 3 membres alors que `TaskManager` en a 11.
   `SessionUser` n'a que `userId` et `role`, pas le `User` complet.
7. **`shared/ui` ne connaît aucune feature.** Le `NavShellComponent` ne sait
   pas qui est connecté : il reçoit `isLoggedIn` en input et émet `logout` en
   output. C'est celui qui le compose (`AppComponent`) qui câble l'auth.
8. **Les erreurs deviennent de l'état.** Un `ErrorHandler` custom
   (`ShowcaseErrorHandler`) enregistre tout ce qui est rapporté dans un service
   (`ReportedErrors`) et ne fait `console.error` qu'en `isDevMode()`. Les
   effects rapportent la cause à `ErrorHandler` et retournent une action
   `failure` pour l'état.
9. **Les commentaires expliquent le _pourquoi_** : la décision, l'alternative
   écartée, le bug évité. Jamais le _quoi_. Ils sont en anglais, en prose, sur
   les membres publics et les choix non évidents.
10. **Chaque affirmation est tenue par un spec.** Les suites sous
    `src/integration/` testent un mécanisme plutôt qu'un composant.

---

## 2. Arborescence du showcase (à reproduire)

```
src/
  main.ts
  environments/environment.ts          API_BASE_URL…
  assets/fonts/ …                       polices locales
  testing/                              doubles et helpers de test partagés
    fake-managers.ts                    doubles étroits (ports) + larges (managers), sampleXxx()
    at.ts, keyboard.ts, …
  integration/                          suites qui testent un mécanisme, pas un composant
  app/
    app.config.ts                       RACINE DE COMPOSITION : seul endroit où la lib est configurée,
                                        où les ports sont câblés, où l'initializer tourne
    app.routes.ts                       loadComponent partout, title par route, guards
    app.navigation.ts                   items de navigation (NavigationItem[])
    app.component.ts/.html/.scss        compose le shell (NavShell) + session + <router-outlet>

    core/                               infrastructure, ne connaît AUCUN concept métier
      error-handling/                   ShowcaseErrorHandler, refusalReason(), index.ts
      services/                         LocalStorageService (abstrait, gardé), ReportedErrors, index.ts
      utils/                            fonctions pures (json.utils.ts), PAS de barrel

    shared/ui/                          composants présentationnels, quasi extractibles
      <nom>/                            un dossier par composant
        <nom>.component.ts/.html/.scss
        <nom>.model.ts                  (si le composant a un modèle : navigation-item.model.ts…)
        <nom>.service.ts / <nom>.enum.ts (ex. theme-toggle/theme.service.ts, theme.enum.ts)
        index.ts                        barrel du composant
      ex. : chip, confirm-panel, data-state, kanban, nav-shell,
            panel-form, section-card, side-panel, theme-toggle

    features/
      common/                           SHARED KERNEL : uniquement des ports, n'importe rien du repo
        index.ts                        commentaire avec les 3 conditions d'admission (§3)
        session/
          auth-session.port.ts          interface IAuthSession
          auth-session.token.ts         AUTH_SESSION = new InjectionToken<IAuthSession>(…)
          session-user.model.ts         le strict minimum visible hors auth
          index.ts
        reload/
          task-reload.port.ts / .token.ts
          project-reload.port.ts / .token.ts
          index.ts

      <feature>/                        ex. auth, project, inspection
        components/
          <nom>/<nom>.component.ts/.html/.scss
          index.ts                      barrel de tous les composants de la feature
        guards/                         guards fonctionnels (CanActivateFn) + index.ts
        interceptors/                   HttpInterceptorFn + index.ts
        models/<nom>.model.ts + index.ts
        ports/                          ports que la feature déclare POUR ELLE-MÊME
          <x>.port.ts, <x>.token.ts, index.ts   (1 seul consommateur → pas dans common)
        services/
          <x>-repository.service.ts     appels HTTP, retournent des Observable
          <x>.service.ts                logique métier injectable (règles, présentation)
          index.ts
        states/
          <concept>/                    les 5 fichiers d'un concept, ensemble :
            <concept>.action.ts
            <concept>.state.ts
            <concept>.updater.ts
            <concept>.effect.ts
            <concept>.manager.ts
            (<concept>.redaction.ts / <concept>.guard.ts si besoin)
          index.ts                      exporte Manager, Effect et ce qu'app.config doit voir

    pages/                              composition : un dossier par route, peut tout importer
      <route>/<route>-page.component.ts/.html/.scss
      <x>.provider.ts                   provideXxx() : joint le port d'une feature à une autre
                                        (ex. team-directory.provider.ts)
```

Notes sur l'arborescence :
- Une feature ne crée ses sous-dossiers (`guards/`, `interceptors/`,
  `ports/`…) que lorsqu'elle en a réellement le contenu.
- Plusieurs concepts d'état dans une feature → plusieurs dossiers sous
  `states/` (ex. `project/states/project/` et `project/states/task/`).
- Chaque dossier (sauf `utils/`) a un `index.ts`. On importe via le barrel
  (`@app/features/auth/states`, `@shared/ui/data-state`).
- Les pages importent des composants de features et de `shared/ui`, et
  injectent des managers et des services de features.

Nommage :
- Fichiers en kebab-case, suffixes `.component.ts`, `.service.ts`,
  `.model.ts`, `.utils.ts`, `.port.ts`, `.token.ts`, `.provider.ts`,
  `.guard.ts`, `.interceptor.ts`, `.enum.ts`.
- Ports : interface préfixée `I` (`IAuthSession`, `ITaskReload`), token en
  SCREAMING_CASE (`AUTH_SESSION`).
- Actions : `xxxActions` pour un groupe, `source: 'SCREAMING_CASE'` ; action
  seule via `defineSingleAction('TASK_RESET', emptyPayload)`.
- `xxxUpdater` ; classes `XxxState`, `XxxEffect`, `XxxManager` ; effects
  nommés `<action><Event>Effect` (`loginRequestEffect`, `loginSuccessEffect`).
- Sélecteurs de composants préfixés `app-`.
- Alias TS : `@app/*`, `@shared/*`, `@assets/*`, `@testing/*`. **Les imports
  qui traversent une zone passent par un alias.** Les imports relatifs sont
  réservés à l'intérieur d'une feature.

---

## 3. Loi de dépendance

| Zone              | Peut importer                         | Ne doit jamais importer                   |
| ----------------- | ------------------------------------- | ----------------------------------------- |
| `pages/`          | tout (`core`, `shared`, `features`)   | —                                         |
| `features/<x>/`   | `core/`, `shared/`, `features/common` | `pages/`, **une autre feature**           |
| `features/common` | rien du repo                          | `core`, `shared`, les features, `pages`   |
| `shared/ui/`      | `core/`                               | `features/`, `pages/`                     |
| `core/`           | rien d'autre sous `app/`              | `features/`, `shared/`, `pages/`          |

**Conditions pour admettre un port dans `features/common`** (les trois à la fois) :
1. au moins deux features le consomment ;
2. aucune ne pourrait l'obtenir depuis `pages/` : le besoin naît dans un
   service, un effect ou un composant de feature, pas dans une composition ;
3. il est réduit à ce que les consommateurs appellent réellement.

Sinon, le port va dans `features/<consommateur>/ports/` et la jonction se
fait dans `pages/<x>.provider.ts`.

Câblage type dans `app.config.ts` :

```typescript
provideStatewise({
  effects: [AuthEffect, TaskEffect, ProjectEffect],
  interceptors: [TallyGuard],
  updaters: [noticeUpdater],
  history: { limit: 50, redact: withoutCredentials },
}),
{ provide: ErrorHandler, useClass: ShowcaseErrorHandler },

// Ports du kernel : chacun répond par le manager qui possède l'état derrière.
// useExisting : le lecteur et le propriétaire regardent la même instance.
{ provide: AUTH_SESSION, useExisting: AuthManager },
{ provide: TASK_RELOAD, useExisting: TaskManager },
{ provide: PROJECT_RELOAD, useExisting: ProjectManager },

// Port déclaré par une feature pour elle-même, joint dans pages/
provideTeamDirectory(),

provideAppInitializer(async () => {
  await inject(AuthManager).authenticate();
}),
```

Un token de port **n'a pas de factory par défaut** : si on oublie le provider,
ça doit casser bruyamment au lieu de se dégrader en silence.

Jonction type (`pages/team-directory.provider.ts`) :

```typescript
export function provideTeamDirectory(): Provider {
  return {
    provide: TEAM_DIRECTORY,              // port déclaré par features/project
    useFactory: (): ITeamDirectory => {
      const auth = inject(AuthManager);   // manager de features/auth
      const members = computed(() => auth.members().map((m) => ({ id: m.userId, name: m.userName })));
      const byId = computed(() => new Map(members().map((m) => [m.id, m.name])));
      return { members, nameOf: (id) => byId().get(id) ?? id };
    },
  };
}
```

---

## 4. Faire respecter la loi : `zoneLaws()` dans `eslint.config.js`

On reprend ce mécanisme tel quel, dès le premier commit (flat config,
`typescript-eslint`, `angular-eslint`, `eslint-config-prettier` en dernier) :

```js
const APP = 'src/app';

/** Chaque ligne se lit : « cette zone ne peut pas importer celles-là ». */
const ZONES = [
  { zone: 'core', why: 'infrastructure: it must not know a business concept exists',
    denies: ['features', 'shared', 'pages'] },
  { zone: 'shared/ui', why: 'reusable UI, almost extractable: it may use core and nothing above',
    denies: ['features', 'pages'] },
  { zone: 'features/common', why: 'the shared kernel: it imports nothing from this repository at all',
    denies: ['core', 'shared', 'features', 'pages', 'escapes'] },
  { zone: 'features/projects', why: 'no feature imports another feature; the need descends into features/common',
    denies: ['contact', 'experience', 'pages'] },
  // … une ligne par feature, qui interdit chaque feature sœur par son nom
  { zone: 'pages', why: 'composition: it may reach for any feature and any shared component',
    denies: [] },
];

const GROUPS = {
  core: ['@app/core', '@app/core/**', '**/core/**'],
  shared: ['@shared/**', '@app/shared/**', '**/shared/**'],
  features: ['@app/features/**', '**/features/**'],
  pages: ['@app/pages/**', '**/pages/**'],
  // Une feature sœur est interdite aussi par son nom nu, à toute profondeur :
  // `../../contact/services` sort de la feature sans écrire le mot `features`.
  contact: ['@app/features/contact', '@app/features/contact/**',
            '**/features/contact/**', '**/contact', '**/contact/**'],
  // Réservé à features/common : dans ce dossier, `../<frère>` est légitime et
  // `../../quoi-que-ce-soit` en sort toujours.
  escapes: ['../../*', '../../**', '@testing/**'],
};

function zoneLaws({ app, zones, groups }) {
  return zones.map(({ zone, why, denies }) => ({
    files: [`${app}/${zone}/**/*.ts`],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [{ group: denies.flatMap((n) => groups[n]), message: `${zone}/ — ${why}.` }],
      }],
    },
  }));
}

// export default tseslint.config(
//   { ignores: [...] },
//   { files: ['src/**/*.ts'], extends: [eslint recommended, tseslint recommended, angular tsRecommended],
//     processor: angular.processInlineTemplates },
//   { files: ['src/**/*.html'], extends: [...angular.configs.templateRecommended] },
//   ...zoneLaws({ app: APP, zones: ZONES, groups: GROUPS }),
//   prettier,
// );
```

Pièges connus :
- Le pattern matche la **chaîne d'import**, pas un chemin résolu. Il faut donc
  interdire la forme alias **et** les formes relatives.
- L'extglob `../!(..)/**` n'est pas lu par la règle. Il faut nommer chaque
  feature sœur.
- Prouver chaque zone avec une violation volontaire (le lint doit échouer),
  puis la retirer.

---

## 5. ngx-statewise — mode d'emploi (tel qu'utilisé dans le showcase)

```bash
npm install ngx-statewise@beta   # 1.0.0-beta.0 ; le tag `latest` est encore sur 0.6.4
```

Compatible Angular 20/21/22, rxjs ^7.4. Zoneless et SSR supportés : le moteur
est fourni par environment injector, donc une instance par requête côté
serveur, et la lib ne touche aucune API navigateur.

### 5.1 Les 5 fichiers d'un concept (`features/<f>/states/<concept>/`)

```typescript
// ---- projects.state.ts : un injectable qui porte des signals, rien d'autre
@Injectable({ providedIn: 'root' })
export class ProjectsState {
  public projects = signal<Project[]>([]);
  public isLoading = signal(false);
  public isError = signal(false);
}

// ---- projects.action.ts
export const getProjectsActions = defineActionsGroup({
  source: 'GET_PROJECTS',                 // → GET_PROJECTS_REQUEST / _SUCCESS / _FAILURE
  events: {
    request: emptyPayload,
    success: payload<Project[]>(),
    failure: emptyPayload,
  },
});
export const projectsReset = defineSingleAction('PROJECTS_RESET', emptyPayload);

// ---- projects.updater.ts : synchrone, SEUL endroit qui écrit l'état
export const projectsUpdater = defineUpdater(ProjectsState, (on) => {
  // requestStatus câble loading/error ; `request` efface l'erreur précédente
  requestStatus(on, getProjectsActions, {
    loading: (state) => state.isLoading,
    error: (state) => state.isError,
    onSuccess: (state, projects) => state.projects.set(projects),
  });
  on(projectsReset, (state) => state.projects.set([]));
});

// ---- projects.effect.ts : l'asynchrone, retourne l'action suivante (ou rien)
@Injectable({ providedIn: 'root' })
export class ProjectsEffect {
  private readonly repository = inject(ProjectsRepositoryService);
  private readonly errorHandler = inject(ErrorHandler);

  public readonly getProjectsRequestEffect = createEffect(
    getProjectsActions.request,
    async (_payload, { abortSignal }) => {
      try {
        return getProjectsActions.success(await firstValueFrom(this.repository.getAll()));
      } catch (error) {
        if (!abortSignal.aborted) this.errorHandler.handleError(error);
        return getProjectsActions.failure();
      }
    },
    { concurrency: 'latest', cancelOn: projectsReset, mustAnswer: true },
  );
}

// ---- projects.manager.ts : la seule API vue par les composants et les pages
@Injectable({ providedIn: 'root' })
export class ProjectsManager /* implements IProjectsReload si un port l'exige */ {
  private readonly state = inject(ProjectsState);
  private readonly statewise = injectStatewise(projectsUpdater);

  public readonly projects = this.state.projects.asReadonly();
  public readonly isLoading = this.state.isLoading.asReadonly();
  public readonly isError = this.state.isError.asReadonly();
  public readonly count = computed(() => this.projects().length); // dérivé, pas stocké

  public load(): Promise<void> {           // dispatchAsync attend toute la cascade
    return this.statewise.dispatchAsync(getProjectsActions.request());
  }
  public reset(): Promise<void> {
    return this.statewise.dispatchAsync(projectsReset());
  }
  /** Pour un port : se résout quand le rechargement lancé par ce manager est terminé. */
  public reloaded(): Promise<void> {
    return this.statewise.waitForEffect(getProjectsActions.request);
  }
}
```

Le manager peut injecter un service **de sa propre feature** pour ne pas
dupliquer une règle (ex. `TaskSelectionService.countByStatus`).

### 5.2 `provideStatewise()` : une seule fois, à la racine (`app.config.ts`)

- `effects` : classes contenant des `createEffect`.
- `interceptors` : classes contenant **uniquement** des `createInterceptor`
  (ex. `TallyGuard`, `@Injectable()` sans `providedIn`).
- `updaters` : updaters **globaux**, possédés par aucun manager
  (ex. `noticeUpdater`), atteignables depuis n'importe quel handle.
- `history: { limit, redact }` : la fonction de redaction est écrite **dans la
  feature** qui connaît le payload (`auth.redaction.ts` → `withoutCredentials`).
- Options avancées : `misroutedDispatch`, `maxCascadeDepth`.

### 5.3 Options de `createEffect(action, handler, options)`

- `concurrency` :
  - `'parallel'` (défaut) : tous les runs tournent côte à côte.
  - `'latest'` : le plus récent gagne, l'ancien est abandonné et son
    `abortSignal` est déclenché. Pour une recherche, un rechargement, un
    changement d'utilisateur.
  - `'first'` : le plus ancien gagne, les nouveaux dispatches n'exécutent pas
    le handler (l'updater s'applique quand même). Pour une création, un
    renouvellement de token.
- `key: (payload) => string` : un groupe de concurrence par clé (ex. par id de
  tâche, pour qu'un drag sur une carte n'abandonne pas l'écriture d'une autre).
- `cancelOn: action | action[]` : annule les runs en cours (ex. sur un reset).
- `mustAnswer: true` : l'effect doit retourner une action, sinon c'est rapporté
  à `ErrorHandler`.
- Le handler reçoit `(payload, { abortSignal })`. Pour stopper réellement la
  requête HTTP dans le repository :
  `.pipe(takeUntil(fromEvent(abortSignal, 'abort')))`.

### 5.4 Règles de la lib que le showcase applique

- Un manager, c'est `injectStatewise(sonUpdater)`, c'est-à-dire **un scope**.
  Dispatcher une action possédée par un autre manager **lève une erreur** en dev.
- Un effect ne tourne que pour le manager qui possède l'updater de son action.
- **Cascade entre features** : un effect ne retourne jamais l'action d'une
  autre feature. Il appelle le **port** de l'autre feature
  (`this.taskManager.getAll()` via `TASK_RELOAD`). Il retourne une action
  seulement si elle appartient à sa propre feature
  (`loginSuccess` → `getMembersActions.request`).
- `createInterceptor(action, (payload) => boolean)` sert à refuser **avant**
  l'updater, sans laisser de trace (ni état, ni effect, ni historique).
- `ActionHistory` est injectable et expose `snapshot()` (action, chemin de
  cascade, horodatage).
- État initial au démarrage :
  `provideAppInitializer(async () => await inject(XManager).start())`.
- Guards et intercepteurs HTTP d'une feature injectent le **manager** de leur
  feature (`loggedInGuard` → `AuthManager.isLoggedIn()`).
- Un refus serveur est lu en mots humains (`refusalReason(error)` dans
  `core/error-handling`) et stocké dans un état dédié (`saveError`,
  `createError`), séparé de `isError` (qui concerne la lecture de la liste).

### 5.5 Tests (Vitest + jsdom)

```typescript
import { provideStatewiseTesting } from 'ngx-statewise/testing';
// aussi : drainEffects(), captureStatewiseDeclarations()

// Updater seul : aucun effect enregistré, donc un dispatch n'exécute que l'updater
TestBed.configureTestingModule({ providers: [provideStatewiseTesting()] });
const statewise = TestBed.runInInjectionContext(() => injectStatewise(projectsUpdater));
statewise.dispatch(getProjectsActions.request());

// Effect : on l'enregistre et on double ses dépendances (repository, ports, Router, ErrorHandler)
provideStatewiseTesting({ effects: [ProjectsEffect] });
await statewise.dispatchAsync(getProjectsActions.request());

// Manager : provideStatewise({}) et on vérifie l'exposition readonly et les computed
```

`src/testing/fake-managers.ts` contient deux familles de doubles :
- **étroits** pour un port : fournis contre le token, aussi petits que le port.
  Un spec qui en demande plus a un sujet qui va trop loin ;
- **larges** pour un manager : fournis contre la classe, avec des signals
  writables, qui enregistrent les appels.

On y met aussi les factories `sampleXxx(overrides)` pour les données. Les
specs sont à côté des fichiers (`*.spec.ts`), et les suites de mécanismes
vont dans `src/integration/`.

---

## 6. Conventions de code Angular (celles du showcase)

- Composants **standalone**, `ChangeDetectionStrategy.OnPush`, `templateUrl` +
  `styleUrl` (SCSS), `host: { class: 'page' }` sur les pages.
- `inject()` partout, membres `private readonly` / `public readonly`,
  accessibilité toujours explicite.
- `input()`, `input.required()`, `output()`, `model()`, `computed()`. Pas de
  `@Input`/`@Output`.
- Control flow `@if` / `@for` / `@switch`.
- Routes en `loadComponent` (lazy) avec un `title` explicite par route ;
  guards fonctionnels (`CanActivateFn`) ; intercepteurs HTTP fonctionnels
  (`HttpInterceptorFn`) avec `provideHttpClient(withFetch(), withInterceptors([...]))`.
- Repositories HTTP dans `features/<x>/services/*-repository.service.ts` :
  base `${environment.API_BASE_URL}/Xxx`, retour en `Observable`, converti
  avec `firstValueFrom` dans l'effect.
- Les composants `shared/ui` reçoivent des inputs et émettent des outputs, sans
  connaître ni manager ni modèle métier (ex. `DataStateComponent` : `label`,
  `loading`, `error`, `errorMessage`, `retryable`, output `retried`).
- Une page tient l'état **d'écran** (onglet, panneau ouvert, id sélectionné)
  en signals locaux. L'état **métier** est dans les managers.
- `LocalStorageService` est abstrait, et chaque accès est protégé par un
  `try/catch` qui rapporte à `ErrorHandler`. Les services de feature en
  héritent (ex. `AuthTokenService`).
- Accessibilité : live regions pour les chargements, contraste mesuré.

---

## 7. SSR — seule chose empruntée au site de docs

Le showcase est une application client uniquement. Pour le portfolio SSR, on
garde **l'architecture du showcase** et on ajoute uniquement la plomberie
suivante (reprise de `projects/ngx-statewise-docs`, qui est prérendu) :

- Création : `ng new portfolio --ssr --style=scss` (Angular 22, zoneless par
  défaut : pas de `zone.js` ni de `provideZoneChangeDetection`, contrairement
  au showcase).
- `app.config.ts` : ajouter `provideClientHydration()` et
  `provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withViewTransitions({ skipInitialTransition: true }))`.
- `app.config.server.ts` :
  ```typescript
  const serverConfig: ApplicationConfig = {
    providers: [provideServerRendering(withRoutes(serverRoutes))],
  };
  export const config = mergeApplicationConfig(appConfig, serverConfig);
  ```
- `app.routes.server.ts` : `[{ path: '**', renderMode: RenderMode.Prerender }]`
  pour un portfolio statique (`outputMode: 'static'`), ou `RenderMode.Server`
  pour les routes qui en ont besoin si on héberge un serveur Node.
- `main.server.ts` :
  `export default (context: BootstrapContext) => bootstrapApplication(AppComponent, config, context);`
- **Adaptation obligatoire des patterns du showcase qui touchent le navigateur** :
  - `AppComponent` fait `document.body.className = …` dans un `effect()` : à
    remplacer par `inject(DOCUMENT)` + une garde `isPlatformBrowser`, dans un
    service de `core/` ;
  - `LocalStorageService` : ajouter la garde `isPlatformBrowser(inject(PLATFORM_ID))`
    en plus du `try/catch` (lecture → `null` côté serveur) ;
  - le `ThemeService` de `shared/ui/theme-toggle` : lire la préférence système
    ou stockée via ce service `core/` gardé, jamais `window`/`matchMedia` en direct ;
  - un `provideAppInitializer` qui lit le stockage doit être inerte côté serveur.
- Modèle technique de service navigateur inerte au prérendu :
  `ngx-statewise-docs/src/app/core/ui-state/services/theme-environment.service.ts`
  (seulement la technique ; on le range selon l'arborescence du showcase,
  donc dans `core/services/`).
- Le contenu au-dessus de la ligne de flottaison doit exister dans le HTML
  servi sans JS. Polices locales (comme `assets/fonts` du showcase, ou
  Fontsource), pas de CDN.
- SEO : un `title` par route (déjà la règle du showcase) + `Meta` dans un
  service `core/`.

---

## 8. Outillage (celui du workspace)

- `tsconfig` strict : `strict`, `noUncheckedIndexedAccess`,
  `noPropertyAccessFromIndexSignature`, `noImplicitReturns`,
  `noImplicitOverride`, `noFallthroughCasesInSwitch`, `isolatedModules` ;
  `angularCompilerOptions` : `strictTemplates`, `strictInjectionParameters`,
  `strictInputAccessModifiers`.
- `paths` : `@app/*` → `src/app/*`, `@shared/*` → `src/app/shared/*`,
  `@assets/*`, `@testing/*` → `src/testing/*`.
- Prettier (`singleQuote`), ESLint flat avec `zoneLaws()`, Husky + commitlint
  (Conventional Commits), `.nvmrc`, `.editorconfig`.
- Tests : `ng test` (builder `@angular/build:unit-test`, Vitest + jsdom,
  `types: ["vitest/globals"]` dans `tsconfig.spec.json`).
- `npm run check` : format:check → lint → test → build.

---

## 9. Squelette proposé pour le portfolio (calqué sur le showcase)

```
src/
  environments/environment.ts
  assets/fonts/ assets/images/
  testing/fake-managers.ts
  integration/
  app/
    app.config.ts  app.config.server.ts  app.routes.ts  app.routes.server.ts
    app.navigation.ts                     items du menu
    app.component.ts/.html/.scss          compose NavShell (shared/ui) + <router-outlet>
    core/
      error-handling/                     AppErrorHandler, refusalReason
      services/                           LocalStorageService (gardé SSR), ReportedErrors,
                                          BrowserEnvironment/Platform (DOCUMENT, matchMedia), SeoService
      utils/
    shared/ui/
      nav-shell/ (navigation-item.model.ts)   theme-toggle/ (theme.service.ts, theme.enum.ts)
      section-card/  data-state/  chip/  side-panel/  button/ …
    features/
      common/                             vide au départ, avec le commentaire des 3 conditions
      projects/                           models/ services/ (projects-repository) states/projects/ components/
      experience/                         parcours, CV
      skills/                             compétences
      contact/                            states/contact/ (effect d'envoi, concurrency 'first') components/contact-form/
      blog/                               (optionnel)
    pages/
      home/home-page.component.ts
      projects/projects-page.component.ts
      project-detail/project-detail-page.component.ts
      about/about-page.component.ts
      contact/contact-page.component.ts
      not-found/not-found-page.component.ts
      <x>.provider.ts                     si une feature déclare un port que seule une autre peut remplir
```

Ordre de mise en place conseillé :
1. `ng new portfolio --ssr --style=scss` (Angular 22, strict).
2. tsconfig strict + alias `@app/*`, `@shared/*`, `@assets/*`, `@testing/*`.
3. Prettier, ESLint flat + **`zoneLaws()`** dès le premier commit (avec une
   ligne par feature), Husky, commitlint.
4. `npm i ngx-statewise@beta`, `provideStatewise({ effects: [] })` et
   `ErrorHandler` custom dans `app.config.ts`.
5. `core/` : error-handling, services (storage gardé SSR, environnement
   navigateur), utils.
6. `shared/ui/` : nav-shell (inputs/outputs uniquement), theme-toggle.
7. `app.component` compose le shell ; `app.routes.ts` en lazy + `title` ;
   `app.routes.server.ts` en Prerender.
8. Première feature `projects` : models → repository → `states/projects/`
   (5 fichiers) → composants → page qui compose. Specs pour l'updater,
   l'effect et le manager.
9. Vérifier : `ng build` prérend, le HTML contient bien le contenu,
   `npm run lint` refuse un import entre features, `npm run check` passe.

Fichiers du showcase à relire en cas de doute (tous sous
`projects/ngx-statewise-showcase/`) :
- `README.md` : les couches, la loi, les écrans
- `src/app/app.config.ts` : la composition complète
- `src/app/app.component.*` + `src/app/shared/ui/nav-shell/` : shell sans couplage métier
- `src/app/features/auth/` : feature complète (guards, interceptors, models, services, states)
- `src/app/features/project/states/task/*` : options avancées de `createEffect`
- `src/app/features/common/` : ports du kernel et règles d'admission
- `src/app/features/project/ports/` + `src/app/pages/team-directory.provider.ts` : port local + jonction
- `src/app/core/` : ErrorHandler, stockage gardé
- `src/testing/fake-managers.ts` : doubles
- `../../eslint.config.js` : `zoneLaws`
- Guide en ligne : https://pierre-mariemarchio.github.io/ngx-statewise/
