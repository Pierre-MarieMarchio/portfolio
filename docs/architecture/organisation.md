# Organisation du code

Ce document dit **où va chaque chose et pourquoi**. Il décrit l'architecture
du portfolio : ses quatre couches et la loi de dépendance, l'organisation des
responsabilités, la nomenclature qui le tient, et la fiche technique de chaque
unité. Il fait foi pour `src/app`.

Il est tiré de l'inventaire du 23 septembre 2026 (phase 3,
`docs/audit/phase-3.md`), qui a relevé pour chaque unité ce qu'elle fait,
son contrat, ses consommateurs et les responsabilités qu'elle mélange.

## 1. La méthode

Une unité se conçoit dans cet ordre, et rien ne se code avant la dernière
réponse :

1. **Son but dans l'application**, en une phrase, avec les mots du domaine.
   Une unité qui ne tient pas en une phrase en contient deux.
2. **Sa responsabilité unique** : la seule raison qui la ferait changer.
3. **Son contrat** : les méthodes, entrées et sorties qui le composent,
   chacune avec un verbe qui dit ce qu'elle fait. Rien d'autre n'est public.
4. **Son rôle dans l'architecture** : sa couche (§2), ses consommateurs, ses
   dépendances.
5. **Sa forme**, déduite de ce qui précède (§3), puis **son nom** et **son
   dossier**.

Deux unités qui portent la même intention fusionnent. Un membre qui ne fait
que relayer un autre disparaît. Une abstraction sans deux utilisateurs
n'existe pas (KISS). À l'inverse, deux morceaux qui partagent un état caché
ne sont pas deux unités : on ne découpe que là où chaque morceau a sa propre
raison de changer.

## 2. Les couches et la loi de dépendance

Chaque fichier appartient à une couche, et une couche n'importe que celles
qui sont en dessous d'elle.

### 2.1 Où ranger un concept

| Question                                                                      | Couche                |
| ----------------------------------------------------------------------------- | --------------------- |
| Technique, sans un mot du portfolio (navigateur, `<head>`, langue, erreurs) ? | `core/`               |
| Morceau qu'une autre application pourrait reprendre tel quel, une librairie ? | `shared/<lib>/`       |
| Concept du portfolio ?                                                        | `features/<concept>/` |
| Contrat que deux features partagent sans pouvoir se connaître ?               | `features/common/`    |
| Textes de toutes les features, adresses de chaque vue par langue ?            | `i18n/`               |
| Compose un écran, déclare une étape de route ?                                | `pages/`              |
| Démarre l'application : config, table des routes, réponses aux ports ?        | racine `app.*.ts`     |

**Sens des dépendances :** `racine → pages → i18n → features → features/common → shared/<lib> → core`.
Les librairies de `shared/` (`ui`, `windows`, `space-scene`) ne s'importent
pas entre elles. Un import ne remonte jamais.

**Trois règles qui ne se discutent pas :**

1. **Une feature n'importe que `core`, les librairies de `shared/` et
   `features/common`, jamais une autre feature.** Quand deux features ont
   besoin d'un même contrat, il descend dans `features/common/` (un port :
   une interface et son jeton), et la composition y répond : `provideI18n`
   répond à `LINKS`.
2. **Le lint tient la loi**, zone par zone (`FEATURES` et `SHARED_LIBS` dans
   `eslint.config.js`, comparés au disque). Une violation fait échouer
   `npm run lint`.
3. **Un contrat n'entre dans `features/common/` que si deux features le
   consomment**, que le besoin naît dans leurs composants ou leurs services,
   et qu'il est réduit à ce qu'elles appellent. Sinon, le port reste dans
   `features/<consommateur>/ports/` : c'est le cas des tranches de textes,
   que `provideI18n` fournit.

### 2.2 L'état (ngx-statewise)

Un état vit dans `states/<état>/`, en cinq fichiers :

- **`.action.ts`** : ses événements ;
- **`.state.ts`** : des signaux, rien d'autre ;
- **`.updater.ts`** : le seul qui écrit l'état, de façon synchrone ;
- **`.effect.ts`** : l'asynchrone (lire le catalogue, par exemple), qui
  répond par une action ;
- **`.manager.ts`** : la seule porte des composants et des pages. Il expose
  l'état en lecture seule, les `computed` qui s'en dérivent et les commandes.

Le lint refuse qu'un fichier hors de `states/` importe un `.state` ou un
`.updater`. Ce qui se dérive est un `computed`, jamais stocké, et l'état garde
des identifiants (un slug), pas des copies qui vieilliraient. Un état est un
ensemble de signaux qu'aucune action ne traverse (D14).

Le portfolio a **trois concepts** :

- **`projects`** : les réalisations. Leurs données, leur rang, leur liste,
  leur fiche, leur aperçu, la barre des projets vedettes.
- **`observatory`** : l'écran-bureau. Ce que le lecteur regarde (la vue, la
  fiche, le chapitre), les fenêtres ouvertes et épinglées, ce qu'il survole
  ou sélectionne, la scène spatiale en fond, l'ouverture de l'accueil.
- **`profile`** : l'auteur. La fenêtre « à propos », les liens de contact.

## 3. La nomenclature

La nomenclature est précise et modulaire : un fichier dit son rôle par son
suffixe, un dossier dit son concept par son nom, et un script la vérifie
(`scripts/check-structure.mjs`, dans `npm run check`). Un fichier qui
s'égare fait échouer la CI.

### 3.1 Les règles

1. **Chaque fichier porte un suffixe de la liste (§3.2).** Seules
   exceptions : `index.ts` (le barrel) et les `app.*.ts` de la racine.
2. **La classe porte le suffixe de son fichier** : `clock.service.ts` /
   `ClockService`, `window.component.ts` / `WindowComponent`,
   `planets.renderer.ts` / `PlanetsRenderer` (D7).
3. **Une seule structure partout** : zone → dossier de rôle → sous-dossier de
   concept → fichiers. Le dossier de rôle porte le nom pluriel du suffixe
   (`helpers/` pour `.helper.ts`, `directives/` pour `.directive.ts`) et
   n'accepte que ce suffixe.
4. **Chaque fichier va dans le dossier de son rôle dès sa création**, jamais
   à côté de son utilisateur. Prévenir plutôt que guérir : ce qui pourra
   resservir est déjà à sa place le jour où un second utilisateur arrive, et
   rien n'est à déplacer. Le dossier d'un composant ne contient que le
   composant : `.ts`, `.html`, `.scss`, `.spec.ts`.
5. **Un dossier de rôle reste lisible** : un fichier par sujet, nommé par ce
   sujet (`format.helper.ts`, `angle.helper.ts`), et au plus 8 fichiers
   source. Au-delà, un sous-dossier par concept (`services/browser/`),
   jamais par autre chose.
6. **Un dossier de rôle n'existe que s'il a un fichier** : pas de dossier vide
   créé par avance.
7. **La zone dit le domaine, le rôle dit l'usage** : un helper sans domaine va
   dans `core/helpers/`, une règle du domaine des projets dans
   `features/projects/rules/`.

### 3.2 Les suffixes : comment on se sert du fichier

Le rôle d'un fichier est la façon dont on s'en sert. Le suffixe le dit : en
le lisant, on sait ce que fait le fichier, qui l'utilise et dans quel
contexte. Il y a six façons de se servir d'un fichier.

**1. On le place dans un gabarit.**

| Suffixe      | Ce que c'est                                        | Comment on s'en sert | Ne fait jamais                            |
| ------------ | --------------------------------------------------- | -------------------- | ----------------------------------------- |
| `.component` | un élément d'interface : affiche, reçoit des gestes | `<app-window>`       | parler à un `*State`, toucher une globale |
| `.directive` | un comportement ajouté à un élément existant        | `<div appDraggable>` | afficher son propre contenu               |

Deux formes de nom de composant, sans suffixe de plus : `xxx-page.component`
(l'écran qui compose les features) et `xxx-route.component` (la feuille de
route, vide, qui dit au bureau quelle vue son adresse montre).

**2. On l'injecte.**

| Suffixe                                 | Ce que c'est                                                                                                     | Comment on s'en sert                                     | Ne fait jamais                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------- |
| `.service`                              | une classe qui vit dans le temps : état, minuterie, registre, navigateur                                         | `inject(ClockService)`                                   | décider une règle métier (`.rules`) |
| `.manager`                              | la seule porte vers l'état d'un concept                                                                          | `inject(ObservatoryManager)` depuis un composant         | écrire l'état lui-même              |
| `.state` `.action` `.updater` `.effect` | l'état, ses événements, son seul écrivain, ses effets (ngx-statewise)                                            | jamais par un composant : `provideStatewise`, le manager | sortir de leur feature              |
| `.port`                                 | un contrat que le consommateur déclare et que la composition fournit : l'interface et son jeton, dans un fichier | `inject(LINKS)`, `inject(PROJECTS_TEXTS)`                | avoir une valeur par défaut         |

Une tranche de textes est un port : la feature l'injecte, la racine la
fournit (`projects-texts.port.ts`).

**3. On le déclare dans une configuration.**

| Suffixe     | Ce que c'est                                                              | Comment on s'en sert                        | Ne fait jamais                            |
| ----------- | ------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------- |
| `.provider` | une fonction `provideXxx()` qui branche des implémentations sur des ports | `providers: [...]`                          | contenir de la logique                    |
| `.guard`    | décide si une navigation a lieu, et prépare ce qu'il lui faut             | `canActivate: [...]`                        | rendre une donnée                         |
| `.resolver` | calcule une donnée que la route déclare (titre, description)              | `resolve: {...}`, `title:`                  | écrire un état                            |
| `.strategy` | remplace un comportement du framework                                     | `{ provide: TitleStrategy, useClass: ... }` | sortir de ce que le framework lui délègue |

**4. On l'appelle.**

| Suffixe   | Ce que c'est                                                  | Comment on s'en sert                 | Ne fait jamais                               |
| --------- | ------------------------------------------------------------- | ------------------------------------ | -------------------------------------------- |
| `.rules`  | les décisions et calculs du domaine, purs                     | `rank(projects, 4)`, `stepBack(...)` | injecter, toucher au DOM                     |
| `.helper` | une petite fonction sans domaine, pure                        | `twoDigits(7)`                       | contenir un mot du portfolio, garder un état |
| `.signal` | une fonction qui fabrique un signal branché sur le navigateur | `elementSize(el)`                    | être appelée hors contexte d'injection       |

Un `.helper` vit toujours dans le dossier `helpers/` de sa zone, en général
`core/helpers/`.

**5. On l'importe comme valeur ou type.**

| Suffixe  | Ce que c'est                                                                | Ne fait jamais                     |
| -------- | --------------------------------------------------------------------------- | ---------------------------------- |
| `.model` | la forme d'un concept : types, unions, et leurs listes de constantes        | porter du contenu ou de la logique |
| `.data`  | du contenu écrit à la main : projets, liens, catalogues, table des adresses | porter de la logique               |

**6. On l'instancie avec `new`**, dans la scène canvas seulement, sans
injection Angular : les dépendances arrivent par le constructeur.

| Suffixe     | Ce que c'est                                            | Comment on s'en sert              |
| ----------- | ------------------------------------------------------- | --------------------------------- |
| `.engine`   | la boucle : faire avancer, puis dessiner                | créée par `SpaceSceneComponent`   |
| `.motion`   | ce qui évolue à chaque image : caméra, rotation, grains | créée par l'engine, `update(dt)`  |
| `.renderer` | dessine une couche                                      | créée par l'engine, `draw(frame)` |

**Les tests**, dans `src/testing/` pour ce qui est partagé : `.spec` (un
test ; `.golden.spec` pour l'empreinte de la scène), `.fixture` (des données
d'exemple bâties avec les vraies règles), `.double` (une fausse
implémentation d'un port ou d'un service).

**`index.ts`** : la surface publique d'un dossier de concept. Un import qui
vient d'une autre zone passe par lui.

**Les concepts d'Angular font partie de la liste** : on construit avec le
framework, pas contre lui. `.pipe` (transforme une valeur dans un gabarit,
`{{ date | since }}`), `.interceptor` (s'intercale dans les requêtes HTTP,
`withInterceptors([...])`), `.validator` (valide un champ de formulaire) ont
leur suffixe et leur dossier, créés le jour où le besoin arrive. Seul un rôle
qu'Angular ne connaît pas demande une entrée au journal.

### 3.3 Les dossiers de rôle

| Dossier         | Suffixe                                                          | Organisation                                            |
| --------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| `components/`   | `.component` (+ `.html`, `.scss`)                                | un dossier par composant, qui ne contient que lui       |
| `directives/`   | `.directive`                                                     | un fichier par directive                                |
| `pipes/`        | `.pipe`                                                          | un fichier par pipe                                     |
| `services/`     | `.service`                                                       | un fichier par service                                  |
| `states/`       | `.state .action .updater .effect .manager`                       | un dossier par état                                     |
| `ports/`        | `.port`                                                          | un fichier par contrat                                  |
| `providers/`    | `.provider`                                                      | un fichier par fonction `provideXxx()`                  |
| `guards/`       | `.guard`                                                         | un fichier par garde                                    |
| `resolvers/`    | `.resolver`                                                      | un fichier par sujet                                    |
| `interceptors/` | `.interceptor`                                                   | un fichier par intercepteur                             |
| `validators/`   | `.validator`                                                     | un fichier par sujet                                    |
| `strategies/`   | `.strategy`                                                      | un fichier par stratégie                                |
| `rules/`        | `.rules`                                                         | un fichier par sujet                                    |
| `helpers/`      | `.helper`                                                        | un fichier par sujet                                    |
| `signals/`      | `.signal`                                                        | un fichier par fabrique                                 |
| `models/`       | `.model`                                                         | un fichier par sujet                                    |
| `data/`         | `.data`                                                          | un fichier par ensemble ; au-delà de 8, un sous-dossier |
| `engine/`       | `.engine`, et `motions/` (`.motion`), `renderers/` (`.renderer`) | la scène canvas seulement                               |

Les specs restent à côté du fichier qu'elles testent (convention
d'Angular). `src/testing/` a `fixtures/` (`.fixture`) et `doubles/`
(`.double`).

### 3.4 Les rôles permis dans chaque zone

| Zone                  | Dossiers de rôle permis                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/`               | `services/` `ports/` `strategies/` `interceptors/` `models/` `rules/` `helpers/` `signals/`                                                   |
| `shared/ui/`          | `components/` `directives/` `pipes/` `services/` `validators/` `signals/` `ports/` `models/` `data/`                                          |
| `shared/windows/`     | `components/` `directives/` `services/` `models/` `ports/`                                                                                    |
| `shared/space-scene/` | `components/` `directives/` `services/` `engine/` `rules/` `models/` `ports/`                                                                 |
| `features/<concept>/` | `components/` `directives/` `pipes/` `services/` `states/` `ports/` `validators/` `rules/` `models/` `data/`, et `engine/` pour `observatory` |
| `features/common/`    | `ports/` `models/` (types seuls)                                                                                                              |
| `i18n/`               | `services/` `providers/` `guards/` `models/` `rules/` `data/`                                                                                 |
| `pages/`              | un dossier par écran (`-page.component`, `-route.component`) ; `resolvers/` `guards/` `providers/`                                            |
| racine `src/app/`     | les `app.*.ts`                                                                                                                                |

`pages/` est la seule zone rangée par écran : un écran est une page.

### 3.5 Les tests

- Un spec est à côté du fichier qu'il teste, et porte son nom
  (`x.service.spec.ts`). Les suites qui traversent plusieurs unités (la
  langue et les têtes de page, le prérendu, le zoneless) sont dans
  `src/integration/`.
- `src/testing/fixtures/` : des données d'exemple bâties avec les vraies
  règles (`project.fixture.ts` classe par la vraie `rank()`), et les
  fournisseurs d'un spec (`provideTexts`, `provideProjects`).
- `src/testing/doubles/` : de fausses implémentations d'une frontière (le
  canvas qui enregistre, le générateur à graine, l'hôte à horloge pilotée).
- Un manager n'est jamais doublé : un spec reçoit le vrai, nourri par un
  double du repository, la couture par laquelle arriverait une source
  distante.
- Le golden de la scène (`space-scene.engine.golden.spec.ts`) fige son
  dessin, appel par appel : un changement qui déplace une empreinte change
  le rendu.

## 4. Les fiches

Chaque fiche donne : **but** · **contrat** · **rôle** · **d'où elle vient**.

### 4.1 `core/` : la technique

#### `core/services/browser/` : le navigateur, inerte au prérendu

`BrowserEnvironment` mêlait neuf sujets ; chacun devient une unité, avec son
spec « inerte côté serveur ». Rien d'autre dans le dépôt ne touche une
globale.

| Unité                                                    | But                                                 | Contrat                                                                           |
| -------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| `browser-window.service.ts` `BrowserWindowService`       | la fenêtre : sa taille, ses événements              | `size()`, `on(type, handler)`                                                     |
| `media-preferences.service.ts` `MediaPreferencesService` | ce que le lecteur a demandé au système              | `reducedMotion()`, `cannotHover()`, `hasCoarsePointer()`, `watch(query, handler)` |
| `clock.service.ts` `ClockService`                        | le temps : maintenant, la prochaine image, un délai | `now()`, `nextFrame(fn)`, `after(ms, fn)`                                         |
| `page-visibility.service.ts` `PageVisibilityService`     | l'onglet est-il visible                             | `isHidden()`, `watch(handler)`                                                    |
| `element-observer.service.ts` `ElementObserverService`   | la taille et la visibilité d'un élément             | `onResize(el, fn)`, `onVisible(el, threshold, fn)`                                |
| `document-styles.service.ts` `DocumentStylesService`     | lire les jetons CSS, attendre les polices           | `token(name, el?)`, `duration(name)`, `fontsReady(fn)`                            |
| `cursor.service.ts` `CursorService`                      | le curseur de la page                               | `set(cursor)`                                                                     |
| `canvas-contexts.service.ts` `CanvasContextsService`     | un contexte 2D et la densité de pixels              | `context2d(canvas)`, `pixelRatio()`                                               |

Les accès directs relevés passent par elles : `Date.now` de la mise au point
du focus, `setTimeout` du rideau ; l'`addEventListener('scroll')` de la
fenêtre devient un `(scroll)` de gabarit.

**Signal de réveil** : un composant qui injecte plus de quatre de ces
services pour un seul besoin appelle une façade propre à ce besoin.

#### `core/services/device/` : le format d'affichage

- **`DisplayFormatService`** (`display-format.service.ts`). But : dire sous
  quel format le site s'affiche, `phone`, `tablet` ou `desktop`. Contrat :
  `format` (signal), `publishOnRoot()`. Il vaut `desktop` au serveur, suit le
  redimensionnement, la rotation et le pointeur, et `publishOnRoot()` écrit
  `data-format` sur `<html>` au client après le premier rendu ; le bureau
  l'appelle. Il s'appuie sur `BrowserWindowService` et
  `MediaPreferencesService`, et décide par `displayFormatOf`
  (`core/rules/display-format.rules.ts`, types dans
  `core/models/display-format.model.ts`). Son dossier à lui :
  `core/services/browser/` est à huit sources, et le format est une règle
  posée sur le navigateur, pas un accès de plus.
- La disposition ne lit pas ce signal : elle suit les mixins de
  `src/assets/styles/mixins/_formats.scss`, qui disent la même règle en
  media queries. Aucun bloc structurel ne dépend du format au premier rendu.

#### `core/services/presence/`

- **`UserPresenceService`**. But : savoir quand le lecteur est là, au premier
  geste ou au plus tard après un délai ; tout de suite s'il a demandé moins
  de mouvement. Contrat : `whenPresent(maxMs, fn)`. C'est une règle, pas un
  accès au navigateur : elle a son propre dossier. Deux utilisateurs, la
  carte d'ouverture et la révélation de l'accueil, qui écrivaient chacune la
  même séquence.

#### `core/services/head/`, `core/strategies/` : le `<head>` du document

- **`DocumentHeadService`** (ex-`PageHead`). But : écrire le titre, la
  description et les liens de langue d'une page. Contrat : `write(content)`.
  Le nom et l'adresse du site sont ses constantes (`SITE_NAME`, `SITE_URL`).
- **`RouteHeadStrategy`** (`route-head.strategy.ts`, ex-`PageTitleStrategy`).
  But : à chaque navigation, donner à `DocumentHeadService` ce que la route
  déclare. Son ancien nom ne disait que le titre.

#### La langue : `core/services/i18n/`, `core/models/`, `core/rules/`

- **`lang.model.ts`** : `Lang`, `LANGS`, `DEFAULT_LANG`, `langOfUrl`. La seule
  règle URL → langue.
- **`LocaleService`**. But : la langue de la page affichée. Contrat : `lang`
  (signal). Elle se dérive de `Router.lastSuccessfulNavigation`, avec repli
  sur `Location.path()` avant la première navigation ; un effet écrit
  `<html lang>`. Plus d'abonnement RxJS, plus de second écrivain : la garde
  de route ne fait que charger le catalogue.
- **`localize.rules.ts`** : `Localized<T>`, `localize(value, lang)`
  (ex-`resolve`, un nom qui ne disait pas quoi).
- **`draft.rules.ts`** : `draft(text)`, `draftsLeft()`. Marque un texte
  anglais à relire.

#### `core/services/errors/`, `core/helpers/`

- **`ConsoleErrorHandlerService`** (ex-`AppErrorHandler`) : le nom dit ce
  qu'il fait.
- **`format.helper.ts`** : `twoDigits`, seule numérotation à deux chiffres du
  dépôt (quatre versions aujourd'hui).

### 4.2 Les librairies de `shared/`

Aucun mot du portfolio, et aucune n'importe une autre (D20). Ce qui en
contenait remonte dans une feature ou devient générique.

#### La fenêtre : `shared/windows/` (D20)

`WindowComponent` portait cinq responsabilités.

| Unité                                                    | But                                                                                                  | Contrat                                                                                                                   |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `window.component.ts` `WindowComponent`                  | le cadre : barre de titre, épingler, replier, fermer, zones                                          | `heading`, `meta`, `size`, `anchor`, `pinned`, `closable`, `label`, `scrollKey`, `scrollResetOn` ; `pinToggled`, `closed` |
| `draggable.directive.ts` `DraggableDirective`            | déplacer un élément par une poignée, dans les bornes de l'écran, et l'y ramener quand l'écran change | `appDraggable` (la poignée)                                                                                               |
| `double-press.directive.ts` `DoublePressDirective`       | dire qu'un élément a été pressé deux fois de suite : double-clic ou double toucher                   | `appDoublePress` ; `doublePressed`                                                                                        |
| `fit-height.directive.ts` `FitHeightDirective`           | borner la hauteur à l'écran, moins une réserve                                                       | `appFitHeight` (le plafond), `anchor` ; réserve lue en CSS (`--window-reserve`, 0 par défaut)                             |
| `remember-scroll.directive.ts` `RememberScrollDirective` | garder la position de défilement d'une zone, revenir en haut quand sa clé change                     | `appRememberScroll` (clé), `resetOn`                                                                                      |
| `scroll-memory.service.ts` `ScrollMemoryService`         | la mémoire des positions pendant la visite                                                           | `save(key, top)`, `read(key)`                                                                                             |

- `FitHeightDirective` calcule depuis la **position de mise en page**
  (`offsetTop`), que le glissement ne change pas, puisqu'il passe par un
  `transform`. Elle ne lit donc rien de `DraggableDirective`. Si un spec
  montre que les deux mesures divergent, elles se réunissent : deux
  directives qui partagent un état caché n'en font qu'une.
- `resetOn` remplace les deux effets « remonter en haut » écrits dans la
  fiche et dans « à propos ».
- Les marges passées en dur (76, 88) deviennent `--window-reserve`, posée par
  le bureau. La fenêtre relaie `anchor`, `scrollKey` et `scrollResetOn` à ses
  directives, qu'un appelant ne peut pas poser sur le corps qui défile.

#### L'ordre des fenêtres : `shared/windows/`

- **`WindowStackService`** (fourni par l'écran). But : quelle fenêtre est
  devant. Contrat : `register(id)`, `bringToFront(id)`, `depthOf(id)`.
  Générique (des `id`) ; le bureau garde sa liste de fenêtres et
  `windowOf(view)`.
- **`StackedWindowDirective`** (ex-`WindowSlotDirective`). But : inscrire un
  élément dans la pile, écrire sa profondeur, le mettre devant quand on le
  touche. Écoute sur son propre élément : l'écouteur global en capture et
  le contrat par `data-slot` disparaissent.

#### Mesurer un élément : `shared/ui/`

- **`elementSize(el)`** (`element-size.signal.ts`) : un signal de la taille
  d'un élément. Remplace la mesure écrite à la main dans la barre des
  vedettes.
- **`HoverFocusDirective`** (`hover-focus.directive.ts`). But : dire quand
  un élément est survolé à la souris ou désigné au clavier, jamais sur un
  toucher. Contrat : `appHoverFocus`, `entered`, `exited`. La barre des
  vedettes, la liste des projets et les boutons des planètes l'emploient à la
  place de `mouseenter`/`mouseleave`/`focus`/`blur`.
- **`BottomEdgeVariableDirective`** (ex-`HeadBottomDirective`). But : écrire
  en variable CSS jusqu'où descend l'élément qui la porte. Le nom de la
  variable est son entrée.

#### Une animation d'entrée : `shared/ui/models/entrance`

- **`entrance.model.ts`** : `Entrance = 'timed' | 'held' | 'shown'`, l'état
  d'un élément qui entre en scène (ex-`Arrival`). Le vocabulaire d'une
  entrée, sans rien du portfolio : la barre de navigation, les liens de
  contact et la barre des vedettes peuvent le lire sans connaître le bureau,
  qui le produit.

#### Les autres composants de `shared/ui/`

- **`segmented/`** `SegmentedComponent` : inchangé ; sa sortie `chosen`
  devient `valueChange`.
- **`language-switch/`, `main-nav/`** (ex-`page-bar`, deux responsabilités) :
  `LanguageSwitchComponent` (les liens de langue) et `MainNavComponent`
  (la navigation), composés par l'écran.
- **`social-links/`** (ex-`contact-rail`) : `SocialLinksComponent`, une liste
  de liens à icône. Le bouton pause, qui commande l'animation du bureau,
  part dans `features/observatory`.
- **`ViewFocusService`** (ex-`landing-focus`) :
  `claim(container)`, avec `ViewHeadingDirective`. But : mettre le focus sur
  le titre de la vue qui vient d'apparaître.
- **`LayoutAnchorsService`** (ex-`object-marks`) :
  `register(el, kind)`, `list(kind)`, avec `LayoutAnchorDirective`. But :
  dire à qui les lit où sont posés les éléments de l'écran. Un seul registre
  au lieu de deux, générique sur `kind`. `data-object-line`, sans lecteur,
  disparaît.
- **`ports/shared-texts.port.ts`** `SHARED_TEXTS` : les mots de ces
  composants ; ceux de la fenêtre sont dans `WINDOW_TEXTS`, ceux de la pause
  dans les textes du bureau.

### 4.3 `features/common/`

- **`ports/links.port.ts`** : `LINKS`, où est chaque vue dans la langue du
  lecteur. `provideI18n` y répond.
- **`models/scene-anchors.model.ts`** : `SceneAnchorKind = 'panel' | 'head'
| 'rule' | 'detail' | 'preview' | 'line'`, en type seul. La barre des vedettes (`projects`)
  déclare ses ancres, la scène (`observatory`) les lit : ce vocabulaire est un
  contrat entre deux features, que le compilateur vérifie. Il remplit les
  trois conditions d'admission : deux features le consomment, le besoin naît
  dans leurs composants, il est minimal.

### 4.4 `features/projects/`

| Unité                                         | But                                                                                   | D'où                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `data/projects/*.data.ts`, `projects.data.ts` | le contenu, un fichier par projet ; l'ordre est le rang                               | inchangé                                                            |
| `models/project.model.ts`                     | les formes d'un projet                                                                | sans `ProjectWithFacts`                                             |
| `models/project-family.model.ts`              | `ProjectFamily`, `FAMILIES`, `FamilyFilter`                                           | sorti d'un composant, typé partout                                  |
| `models/project-detail.model.ts`              | la fiche et ses chapitres                                                             | ex-`project-sheet.model` ; « approach » devient « chapter » partout |
| `rules/ranking.rules.ts`                      | `rank(projects, featuredCount)` : rang, numéro, vedette                               | sorti du manager ; les tests l'utilisent au lieu de le recopier     |
| `rules/project-labels.rules.ts`               | les libellés tirés d'un projet : ligne, position, niveau de preuve, titre de chapitre | reçoit `proofLevelLabel` et `chapterTitle` du manager               |
| `services/projects-repository.service.ts`     | lire le catalogue                                                                     | inchangé                                                            |
| `states/projects/*`                           | le catalogue dans la langue courante                                                  | sans la chaîne `reset`                                              |
| `components/featured-bar/`                    | la barre des projets vedettes sous l'accueil                                          | ex-`orbit-rule`                                                     |
| `components/project-list/`                    | la liste de tous les projets, filtrable par famille                                   | ex-`project-index`                                                  |
| `components/project-preview/`                 | l'aperçu d'un projet vedette                                                          | inchangé                                                            |
| `components/project-detail/`                  | la fiche d'un projet, chapitre par chapitre                                           | ex-`project-sheet`                                                  |
| `components/project-chapter/`                 | un chapitre de la fiche : paragraphes, puces, figure                                  | sorti de la fiche, pour sa complexité                               |

**`ProjectsManager`**. But : donner aux écrans le catalogue dans la langue
courante. Contrat : `projects`, `ranked`, `featured`, `familyCounts`,
`find(slug)`, `findIn(slug, lang)`, `detailOf(slug)`, `nextOf(slug)`,
`isFeatured(slug)`, `load()`. `findIn` sert les têtes de page, qui parlent la
langue de l'adresse visée avant que la langue courante n'ait changé.
Il perd le classement (une règle pure), les libellés (de la présentation),
`factsOf`, `isLoading`, `isError`, `reset`. Le nombre de vedettes n'a plus
qu'une source, `FEATURED`.

### 4.5 `features/observatory/` (ex-`station`)

#### L'état : découpé selon ses actions

Un état est un ensemble de signaux **qu'aucune action ne traverse**. Arriver
sur une vue change à la fois la vue, la fiche, le chapitre, les fiches lues,
l'aperçu (selon les épingles) et le survol : ces signaux forment un seul
état, sinon une règle métier se disperse en chaînes d'effets.

| État          | Signaux                                                                                                            | But                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `observatory` | `view`, `slug`, `chapter`, `section`, `visited`, `pins`, `preview`, `lastPreview`, `selected`, `hovered`, `family` | ce que le lecteur regarde, ouvre et désigne |
| `animation`   | `paused`                                                                                                           | la scène en mouvement ou en pause           |

`ObservatoryManager` expose l'état et ses commandes ; ses dérivés sont ceux dont
un écran a besoin (`showsList`, `showsAbout`, `showsPreview`, `canStepBack`),
et plus aucun relais inutile.

- `rules/view.rules.ts` : `parentOf`, `stepBack`, et **`windowOf(view)`**,
  la table vue → fenêtre écrite une seule fois (deux copies aujourd'hui).
- `models/observatory.model.ts` : `ObservatoryView`, `ObservatoryWindow`, `Planet`,
  les ids DOM (ex-`station.ids`). Une seule union de vues : celle du moteur
  (`ObjectView`) et celle de la pile (`WindowSlot`) disparaissent.

#### Les composants

- **`observatory-scene/`** `ObservatorySceneComponent` : la chorégraphie du bureau
  sur la scène de `shared/space-scene`. Il reçoit des `Planet { slug, title,
short }` et des slugs (la fiche, l'aperçu, le survol, la sélection), la vue
  et le chapitre, et les traduit en direction de scène
  (`rules/scene-direction.rules.ts`) :

  | Vue         | Cadrage                              | Corps               | Étiquettes | Tourne |
  | ----------- | ------------------------------------ | ------------------- | ---------- | ------ |
  | `home`      | `rest`, `close-up` sur l'aperçu      | `held` puis `shown` | `names`    | oui    |
  | `index`     | `overview`, la sélection `ringed`    | `shown`             | `tags`     | oui    |
  | `sheet`     | `approach` du projet, pas = chapitre | `shown`             | `names`    | non    |
  | `about`     | `aside`, la section = figure allumée | `hidden`            | `none`     | oui    |
  | `not-found` | `overview`                           | `hidden`            | `none`     | non    |

  Le survol devient `emphasised` partout ; l'aperçu ne compte que sur
  l'accueil ; les projets au-delà des vedettes sont `faint`. Sur l'index, une
  étiquette est le numéro de la colonne REF. Il projette dans la scène les
  `PlanetButtonsComponent` (les noms accessibles portent les textes du
  bureau) sur l'accueil et l'index, et fournit `SCENE_SURROUNDINGS` avec
  `SceneSurroundingsService`, qui lit `LayoutAnchorsService` et traduit les
  rôles d'ancre (`SceneAnchorKind`) en rôles de scène.

  La page fait la correspondance `Project` → `Planet` par un `computed` ; la
  traduction slug ↔ rang est interne à la scène. Le clic qui termine un
  glissement est absorbé par `TurnGestureDirective` : `swallowVoid` a quitté
  l'écran.

- `intro-card/` : la carte d'ouverture, une fois par visite, sur
  `UserPresenceService`.
- `home-title/` : le titre de l'accueil.
- `not-found-window/` : la fenêtre « adresse inconnue ».
- `animation-toggle/` : le bouton pause de la scène (sorti du rail de
  contact).

#### Les services de l'écran

- **`HomeRevealService`** (ex-`ArrivalController`). But : retenir le contenu
  de l'accueil pendant la traversée d'ouverture, puis le révéler quand le
  lecteur est là. Contrat : `entrance` (signal d'`Entrance`),
  `start(onHome, onRevealed)`, `revealNow()`. Il s'appuie sur
  `UserPresenceService`.
- **`FeaturedTourService`** (ex-`Curtain`). But : une fois l'accueil révélé,
  survoler tour à tour chaque projet vedette, jusqu'à ce que le lecteur prenne
  la main. Contrat : `play(slugs)`, `stop()`.

#### La scène qu'il anime : `shared/space-scene/`

La scène canvas, sans un mot du portfolio. Son API parle de cadrages, de
corps en orbite identifiés par un id, de mise en avant et de figures du ciel.

| Unité                                                         | But                                                                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `components/space-scene/` `SpaceSceneComponent`               | démarrer et arrêter la scène, lui passer les corps, la direction et les noms des figures                           |
| `directives/turn-gesture.directive.ts` `TurnGestureDirective` | tourner la scène en la faisant glisser ; absorber le clic qui termine un glissement                                |
| `directives/scene-target.directive.ts` `SceneTargetDirective` | inscrire un élément comme cible d'un corps, dans l'ordre du document (le rang)                                     |
| `services/scene-targets.service.ts` `SceneTargetsService`     | le registre des cibles, fourni par `SpaceSceneComponent`                                                           |
| `ports/scene-surroundings.port.ts` `SCENE_SURROUNDINGS`       | les panneaux autour de la scène et leur rôle, les lignes qui montent avec leur corps                               |
| `models/scene.model.ts`                                       | `SceneBody`, `SceneDirection`, `CameraFraming`, `BodiesPresence`, `LabelStyle`                                     |
| `models/scene-layout.model.ts`                                | `SceneLayout`, `PanelRect`, `ScenePanelRole`                                                                       |
| `rules/`                                                      | état de scène, cadre, voile, corps et orbites, mise en page, résolution ; `camera/`, `matter/`, `planets/`, `sky/` |
| `engine/`                                                     | la boucle et ses couches (D11)                                                                                     |

- **`SceneDirection`** : `framing` (`rest`, `overview`, `aside`,
  `close-up` sur un corps, `approach` d'un corps à un pas donné),
  `presence` des corps (`shown`, `held` jusqu'à leur entrée, que le
  mouvement réduit n'attend pas, `hidden`), `labels` (`names`, `tags`,
  `none`), `emphasised` et `ringed` (un id ou `null`), `turnable`,
  `figuresShown` et `litFigure`.
- Ce qui se déduit du cadrage reste interne : au `close-up`, la rotation
  freine, la scène recule d'un cran, les autres corps s'éteignent et lui seul
  garde son nom ; à l'`approach`, le corps approché porte l'anneau, les
  autres s'éteignent ; à l'`overview`, tous les corps sont là et aucun ne
  s'efface sous un panneau ; hors `overview` et `approach`, les corps `faint`
  quittent la scène ; les corps montent l'un après l'autre au `rest` et au
  `close-up` seulement.
- Un id inconnu ne désigne aucun corps ; un `close-up` sur un id inconnu
  revient au `rest`.

### 4.6 `features/profile/`

- `components/about-window/` : la fenêtre « à propos », section par section
  (« part » devient « section »).
- `data/contact.data.ts` : les liens de contact (ex-`app.contact.ts`).
- `models/contact.model.ts` : la forme d'une adresse de contact.
- `ports/profile-texts.port.ts` : sa tranche de textes (`about`, `contact`).

### 4.7 `i18n/`

- `catalog.model.ts` : `Catalog`, composé des tranches des librairies et des
  features, et de `PagesTexts` : les têtes de page, le lien d'évitement, la
  navigation et les noms des langues.
- `catalog-loader.service.ts` `CatalogLoaderService` (ex-`Catalogs`) :
  `ensure(lang)`, `current`, `of(lang)`.
- `i18n.provider.ts` : `provideI18n()` fournit les tranches et charge le
  premier catalogue ; il répond aussi à `LINKS`.
- `catalog.guard.ts` : charge le catalogue de l'adresse visée, sans rien
  écrire d'autre.
- `paths.data.ts` : la table des adresses de chaque vue, par langue.
- `paths.rules.ts` : `pathOf`, `translatePath`. La table et ses règles
  restent ici, sous `pages` : les pages et la racine les lisent.
- `fr.data.ts`, `en.data.ts` : le contenu ; la tranche `profile` a son
  fichier à côté (`fr-profile.data.ts`, `en-profile.data.ts`, D22).

Les têtes de page lisent le catalogue **de la langue visée**
(`CatalogLoaderService.of(langOfUrl(url))`) et non la tranche courante : au
passage de `/projets` à `/en/projects`, la langue courante est encore le
français quand les resolvers tournent.

### 4.8 `pages/`

| Unité                                        | But                                                                                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `observatory/observatory-page.component.*`   | composer l'écran : scène, navigation, fenêtres ; brancher les gestes sur les managers                                                                                                       |
| `observatory/observatory-route.component.ts` | la feuille de route, vide : à son activation, dire au bureau quelle vue son adresse montre ; un seul composant pour toutes les vues, fiche comprise (ex-`ViewMarker` + `ProjectDetailPage`) |
| `page-head.resolver.ts`                      | titre, description et adresses alternatives de chaque vue (ex-`view-head` + `project-title.resolver`)                                                                                       |
| `workbench/workbench-page.component.*`       | l'atelier des composants partagés, en développement                                                                                                                                         |

- `station-projects.binding.ts` disparaît. La scène traduit elle-même slug
  et rang, le filtre est typé, les relais tombent. Il reste deux
  correspondances, des `computed` de la page : `Project` → `Planet`, et
  « l'adresse désigne-t-elle une fiche qui existe ».
- Échap passe par un `host` de la page, plus par un écouteur global.
- La pile des fenêtres suit la vue par un `linkedSignal` posé **dans la
  page** (`windowOf(view)`), puisque `WindowStackService` est générique ;
  l'effet de navigation ne garde que le focus (`ViewFocusService`).

Un resolver ne fait que calculer une donnée : c'est le composant de route,
dont c'est le rôle, qui déclare la vue au bureau.

### 4.9 La racine

`app.component.ts`, `app.config.ts`, `app.config.server.ts`, `app.routes.ts`,
`app.routes.server.ts`. Chaque route charge `ObservatoryRouteComponent`, déclare
sa vue dans `data` et ses têtes par le resolver `page-head`.

### 4.10 `src/testing/`

`fixtures/` et `doubles/`, décrits au §3.5.

## 5. Arborescence

Le dossier et ses fichiers source (hors specs et barrels), tels que
`check-structure.mjs --strict` les tient.

```
src/app/
  (racine)                                     app.component · app.config · app.config.server · app.routes · app.routes.server
  core/helpers/                                angle.helper · easing.helper · event.helper · format.helper · number.helper · random.helper
  core/models/                                 display-format.model · lang.model
  core/rules/                                  display-format.rules · draft.rules · localize.rules
  core/services/browser/                       browser-window.service · canvas-contexts.service · clock.service · cursor.service · document-styles.service · element-observer.service · media-preferences.service · page-visibility.service
  core/services/device/                        display-format.service
  core/services/errors/                        console-error-handler.service
  core/services/head/                          document-head.service
  core/services/i18n/                          locale.service
  core/services/presence/                      user-presence.service
  core/strategies/                             route-head.strategy
  features/common/models/                      scene-anchors.model
  features/common/ports/                       links.port
  features/observatory/components/animation-toggle/ animation-toggle.component
  features/observatory/components/home-title/  home-title.component
  features/observatory/components/intro-card/  intro-card.component
  features/observatory/components/not-found-window/ not-found-window.component
  features/observatory/components/observatory-scene/ observatory-scene.component
  features/observatory/components/planet-buttons/ planet-buttons.component
  features/observatory/models/                 observatory-ids.model · observatory.model
  features/observatory/ports/                  observatory-texts.port
  features/observatory/rules/                  scene-direction.rules · view.rules
  features/observatory/services/               featured-tour.service · home-reveal.service · scene-surroundings.service
  features/observatory/states/animation/       animation.action · animation.manager · animation.state · animation.updater
  features/observatory/states/observatory/     observatory.action · observatory.effect · observatory.manager · observatory.state · observatory.updater
  features/profile/components/about-window/    about-window.component
  features/profile/data/                       contact.data
  features/profile/models/                     contact.model
  features/profile/ports/                      profile-texts.port
  features/projects/components/featured-bar/   featured-bar.component
  features/projects/components/project-chapter/ project-chapter.component
  features/projects/components/project-detail/ project-detail.component
  features/projects/components/project-list/   project-list.component
  features/projects/components/project-preview/ project-preview.component
  features/projects/data/                      projects.data
  features/projects/data/projects/             bkone.data · ngx-statewise.data · skyted-app.data · skyted-companion.data · skyted-voice.data · speakey.data · template-dotnet.data · trainways.data
  features/projects/models/                    project-catalog.model · project-detail.model · project-family.model · project.model
  features/projects/ports/                     projects-texts.port
  features/projects/rules/                     project-labels.rules · ranking.rules
  features/projects/services/                  projects-repository.service
  features/projects/states/projects/           projects.action · projects.effect · projects.manager · projects.state · projects.updater
  i18n/data/                                   en-profile.data · en.data · fr-profile.data · fr.data · paths.data
  i18n/guards/                                 catalog.guard
  i18n/models/                                 catalog.model
  i18n/providers/                              i18n.provider
  i18n/rules/                                  paths.rules
  i18n/services/                               catalog-loader.service
  pages/observatory/                           observatory-page.component · observatory-route.component
  pages/resolvers/                             page-head.resolver
  pages/workbench/                             workbench-page.component
  shared/space-scene/components/space-scene/   space-scene.component
  shared/space-scene/directives/               scene-target.directive · turn-gesture.directive
  shared/space-scene/engine/                   space-scene.engine
  shared/space-scene/engine/motions/           camera.motion · clock.motion · grains.motion · scene.motion · star-flow.motion · turntable.motion
  shared/space-scene/engine/renderers/         grains.renderer · orbits.renderer · planet-labels.renderer · planets.renderer · scene.renderer
  shared/space-scene/engine/renderers/sky/     comets.renderer · constellations.renderer · sky.renderer · star-sky.renderer
  shared/space-scene/models/                   scene-constants.model · scene-layout.model · scene.model
  shared/space-scene/ports/                    scene-surroundings.port
  shared/space-scene/rules/                    canvas-resolution.rules · panel-veil.rules · scene-bodies.rules · scene-frame.rules · scene-layout.rules · scene-state.rules
  shared/space-scene/rules/camera/             camera-frames.rules · framing.rules · pointer.rules · projection.rules · traveling.rules
  shared/space-scene/rules/matter/             grain-reserve.rules · matter-light.rules
  shared/space-scene/rules/planets/            label-placement.rules · planet-focus.rules · planet-spacing.rules
  shared/space-scene/rules/sky/                comets.rules · constellations.rules · figure-label.rules · star-field.rules
  shared/space-scene/services/                 animated-canvas.service · scene-targets.service
  shared/ui/components/language-switch/        language-switch.component
  shared/ui/components/main-nav/               main-nav.component
  shared/ui/components/segmented/              segmented.component
  shared/ui/components/social-links/           social-links.component
  shared/ui/data/                              social-icons.data
  shared/ui/directives/                        bottom-edge-variable.directive · hover-focus.directive · layout-anchor.directive · view-heading.directive
  shared/ui/models/                            element-size.model · entrance.model · language-item.model · navigation-item.model · segmented.model · social-link.model
  shared/ui/ports/                             shared-texts.port
  shared/ui/services/                          layout-anchors.service · view-focus.service
  shared/ui/signals/                           element-size.signal
  shared/windows/components/window/            window.component
  shared/windows/directives/                   double-press.directive · draggable.directive · fit-height.directive · remember-scroll.directive · stacked-window.directive
  shared/windows/models/                       window.model
  shared/windows/ports/                        window-texts.port
  shared/windows/services/                     scroll-memory.service · window-stack.service
```

## 6. Comment on en est arrivé là

L'organisation a été conçue avant le code, puis construite étape par étape
(`docs/audit/phase-3.md`, décisions D7 à D22). Ce document décrit le code
livré ; ce qui s'en écarte est un défaut à corriger ici ou dans le code.
