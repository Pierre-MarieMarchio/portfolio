# Organisation du code

Ce document dit **où va chaque chose et pourquoi**. Il part des
responsabilités, pas des formes habituelles : aucune unité n'existe parce
qu'« on fait toujours un service » ou « un contrôleur ». Il complète
`passation-showcase.md` (les couches et la loi de dépendance) et fait foi pour
l'arborescence de `src/app`.

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

## 2. Les couches : où ranger un concept

| Question                                                                      | Couche                |
| ----------------------------------------------------------------------------- | --------------------- |
| Technique, sans un mot du portfolio (navigateur, `<head>`, langue, erreurs) ? | `core/`               |
| Morceau d'interface qu'une autre application pourrait reprendre tel quel ?    | `shared/ui/`          |
| Concept du portfolio ?                                                        | `features/<concept>/` |
| Contrat que deux features partagent sans pouvoir se connaître ?               | `features/common/`    |
| Textes de toutes les features, adresses de chaque vue par langue ?            | `i18n/`               |
| Compose un écran, déclare une étape de route ?                                | `pages/`              |
| Démarre l'application : config, table des routes, réponses aux ports ?        | racine `app.*.ts`     |

Sens des dépendances :
`racine → pages → i18n → features → features/common → shared/ui → core`.
Un import ne remonte jamais. La racine, qui compose tout, répond aux ports de
`features/common` : c'est son rôle, pas un import vers le haut. Le lint tient
chaque couche, `i18n` et la racine compris.

Le portfolio a **trois concepts** :

- **`projects`** : les réalisations. Leurs données, leur rang, leur liste,
  leur fiche, leur aperçu, la barre des projets vedettes.
- **`desktop`** : l'écran-bureau. Ce que le lecteur regarde (la vue, la
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
   sujet (`format.helper.ts`, `vector.helper.ts`), et au plus 8 fichiers
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
| `.manager`                              | la seule porte vers l'état d'un concept                                                                          | `inject(DesktopManager)` depuis un composant             | écrire l'état lui-même              |
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

| Zone                  | Dossiers de rôle permis                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `core/`               | `services/` `ports/` `strategies/` `interceptors/` `models/` `rules/` `helpers/` `signals/`                                               |
| `shared/ui/`          | `components/` `directives/` `pipes/` `services/` `validators/` `signals/` `ports/` `models/` `data/`                                      |
| `features/<concept>/` | `components/` `directives/` `pipes/` `services/` `states/` `ports/` `validators/` `rules/` `models/` `data/`, et `engine/` pour `desktop` |
| `features/common/`    | `ports/` `models/` (types seuls)                                                                                                          |
| `i18n/`               | `services/` `providers/` `guards/` `models/` `rules/` `data/`                                                                             |
| `pages/`              | un dossier par écran (`-page.component`, `-route.component`) ; `resolvers/` `guards/` `providers/`                                        |
| racine `src/app/`     | les `app.*.ts`                                                                                                                            |

`pages/` est la seule zone rangée par écran : un écran est une page.

## 4. Les fiches

Chaque fiche donne : **but** · **contrat** · **rôle** · **d'où elle vient**.

### 4.1 `core/` : la technique

#### `core/services/browser/` : le navigateur, inerte au prérendu

`BrowserEnvironment` mêlait neuf sujets ; chacun devient une unité, avec son
spec « inerte côté serveur ». Rien d'autre dans le dépôt ne touche une
globale.

| Unité                                                    | But                                                 | Contrat                                                     |
| -------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| `browser-window.service.ts` `BrowserWindowService`       | la fenêtre : sa taille, ses événements              | `size()`, `on(type, handler)`                               |
| `media-preferences.service.ts` `MediaPreferencesService` | ce que le lecteur a demandé au système              | `reducedMotion()`, `cannotHover()`, `watch(query, handler)` |
| `clock.service.ts` `ClockService`                        | le temps : maintenant, la prochaine image, un délai | `now()`, `nextFrame(fn)`, `after(ms, fn)`                   |
| `page-visibility.service.ts` `PageVisibilityService`     | l'onglet est-il visible                             | `isHidden()`, `watch(handler)`                              |
| `element-observer.service.ts` `ElementObserverService`   | la taille et la visibilité d'un élément             | `onResize(el, fn)`, `onVisible(el, threshold, fn)`          |
| `document-styles.service.ts` `DocumentStylesService`     | lire les jetons CSS, attendre les polices           | `token(name, el?)`, `duration(name)`, `fontsReady(fn)`      |
| `cursor.service.ts` `CursorService`                      | le curseur de la page                               | `set(cursor)`                                               |
| `canvas-contexts.service.ts` `CanvasContextsService`     | un contexte 2D et la densité de pixels              | `context2d(canvas)`, `pixelRatio()`                         |

Les accès directs relevés passent par elles : `Date.now` de la mise au point
du focus, `setTimeout` du rideau ; l'`addEventListener('scroll')` de la
fenêtre devient un `(scroll)` de gabarit.

**Signal de réveil** : un composant qui injecte plus de quatre de ces
services pour un seul besoin appelle une façade propre à ce besoin.

#### `core/services/presence/`

- **`UserPresenceService`**. But : savoir quand le lecteur est là, au premier
  geste ou au plus tard après un délai ; tout de suite s'il a demandé moins
  de mouvement. Contrat : `whenPresent(maxMs, fn)`. C'est une règle, pas un
  accès au navigateur : elle a son propre dossier. Deux utilisateurs, la
  carte d'ouverture et la révélation de l'accueil, qui écrivaient chacune la
  même séquence.

#### `core/services/head/`, `core/strategies/`, `core/ports/` : le `<head>` du document

- **`DocumentHeadService`** (ex-`PageHead`). But : écrire le titre, la
  description et les liens de langue d'une page. Contrat : `write(content)`.
  Le nom et l'adresse du site arrivent par le jeton `SITE`
  (`site.port.ts`, interface `SiteIdentity`), que la racine fournit.
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

### 4.2 `shared/ui/` : l'interface réutilisable

Aucun mot du portfolio. Ce qui en contenait remonte dans une feature ou
devient générique.

#### La fenêtre : `components/window/` et ses directives

`WindowComponent` portait cinq responsabilités.

| Unité                                                    | But                                                                              | Contrat                                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `window.component.ts` `WindowComponent`                  | le cadre : barre de titre, épingler, replier, fermer, zones                      | `heading`, `meta`, `size`, `pinned`, `closable`, `label` ; `pinToggled`, `closed` |
| `draggable.directive.ts` `DraggableDirective`            | déplacer un élément par une poignée, dans les bornes de l'écran                  | `appDraggable` (la poignée)                                                       |
| `fit-height.directive.ts` `FitHeightDirective`           | borner la hauteur à l'écran, moins une réserve                                   | réserve lue en CSS (`--window-reserve`)                                           |
| `remember-scroll.directive.ts` `RememberScrollDirective` | garder la position de défilement d'une zone, revenir en haut quand sa clé change | `appRememberScroll` (clé), `resetOn`                                              |
| `scroll-memory.service.ts` `ScrollMemoryService`         | la mémoire des positions pendant la visite                                       | `save(key, top)`, `read(key)`                                                     |

- `FitHeightDirective` calcule depuis la **position de mise en page**
  (`offsetTop`), que le glissement ne change pas, puisqu'il passe par un
  `transform`. Elle ne lit donc rien de `DraggableDirective`. Si un spec
  montre que les deux mesures divergent, elles se réunissent : deux
  directives qui partagent un état caché n'en font qu'une.
- `resetOn` remplace les deux effets « remonter en haut » écrits dans la
  fiche et dans « à propos ».
- Les marges passées en dur (76, 88) deviennent `--window-reserve`, posée par
  le bureau.

#### L'ordre des fenêtres : `services/window-stack`, `directives/stacked-window`

- **`WindowStackService`** (fourni par l'écran). But : quelle fenêtre est
  devant. Contrat : `bringToFront(id)`, `depthOf(id)`. Générique (des `id`).
- **`StackedWindowDirective`** (ex-`WindowSlotDirective`). But : inscrire un
  élément dans la pile, écrire sa profondeur, le mettre devant quand on le
  touche. Écoute sur son propre élément : l'écouteur global en capture et
  le contrat par `data-slot` disparaissent.

#### Mesurer un élément : `signals/element-size`, `directives/bottom-edge-variable`

- **`elementSize(el)`** (`element-size.signal.ts`) : un signal de la taille
  d'un élément. Remplace la mesure écrite à la main dans la barre des
  vedettes.
- **`BottomEdgeVariableDirective`** (ex-`HeadBottomDirective`). But : écrire
  en variable CSS jusqu'où descend l'élément qui la porte. Le nom de la
  variable est son entrée.

#### Une animation d'entrée : `models/entrance`

- **`entrance.model.ts`** : `Entrance = 'timed' | 'held' | 'shown'`, l'état
  d'un élément qui entre en scène (ex-`Arrival`). Le vocabulaire d'une
  entrée, sans rien du portfolio : la barre de navigation, les liens de
  contact et la barre des vedettes peuvent le lire sans connaître le bureau,
  qui le produit.

#### Les autres

- **`segmented/`** `SegmentedComponent` : inchangé ; sa sortie `chosen`
  devient `valueChange`.
- **`site-nav/`** (ex-`page-bar`, deux responsabilités) :
  `LanguageSwitchComponent` (les liens de langue) et `MainNavComponent`
  (la navigation), composés par l'écran.
- **`social-links/`** (ex-`contact-rail`) : `SocialLinksComponent`, une liste
  de liens à icône. Le bouton pause, qui commande l'animation du bureau,
  part dans `features/desktop`.
- **`view-focus/`** (ex-`landing-focus`) : `ViewFocusService`
  (`claim(container)`) et `ViewHeadingDirective`. But : mettre le focus sur
  le titre de la vue qui vient d'apparaître.
- **`layout-anchors/`** (ex-`object-marks`) : `LayoutAnchorsService`
  (`register(el, kind)`, `list(kind)`) et `LayoutAnchorDirective`. But :
  dire à qui les lit où sont posés les éléments de l'écran. Un seul registre
  au lieu de deux, générique sur `kind`. `data-object-line`, sans lecteur,
  disparaît.
- **`texts/`** `SHARED_TEXTS` : inchangé, moins les libellés de pause.

### 4.3 `features/common/`

- **`links/`** : le port `LINKS` (inchangé). La racine y répond.
- **`scene-anchors/`** : `SceneAnchorKind = 'head' | 'rule' | 'detail' |
'preview' | 'line'`, en type seul. La barre des vedettes (`projects`)
  déclare ses ancres, la scène (`desktop`) les lit : ce vocabulaire est un
  contrat entre deux features, que le compilateur vérifie. Il remplit les
  trois conditions d'admission : deux features le consomment, le besoin naît
  dans leurs composants, il est minimal.

### 4.4 `features/projects/`

| Unité                                     | But                                                                                   | D'où                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `data/*.project.ts`, `projects.data.ts`   | le contenu, un fichier par projet ; l'ordre est le rang                               | inchangé                                                            |
| `models/project.model.ts`                 | les formes d'un projet                                                                | sans `ProjectWithFacts`                                             |
| `models/project-family.model.ts`          | `ProjectFamily`, `FAMILIES`, `FamilyFilter`                                           | sorti d'un composant, typé partout                                  |
| `models/project-detail.model.ts`          | la fiche et ses chapitres                                                             | ex-`project-sheet.model` ; « approach » devient « chapter » partout |
| `rules/ranking.rules.ts`                  | `rank(projects, featuredCount)` : rang, numéro, vedette                               | sorti du manager ; les tests l'utilisent au lieu de le recopier     |
| `rules/project-labels.rules.ts`           | les libellés tirés d'un projet : ligne, position, niveau de preuve, titre de chapitre | reçoit `proofLevelLabel` et `chapterTitle` du manager               |
| `services/projects-repository.service.ts` | lire le catalogue                                                                     | inchangé                                                            |
| `states/projects/*`                       | le catalogue dans la langue courante                                                  | sans la chaîne `reset`                                              |
| `components/featured-bar/`                | la barre des projets vedettes sous l'accueil                                          | ex-`orbit-rule`                                                     |
| `components/project-list/`                | la liste de tous les projets, filtrable par famille                                   | ex-`project-index`                                                  |
| `components/project-preview/`             | l'aperçu d'un projet vedette                                                          | inchangé                                                            |
| `components/project-detail/`              | la fiche d'un projet, chapitre par chapitre                                           | ex-`project-sheet`                                                  |

**`ProjectsManager`**. But : donner aux écrans le catalogue dans la langue
courante. Contrat : `projects`, `ranked`, `featured`, `familyCounts`,
`find(slug)`, `detailOf(slug)`, `nextOf(slug)`, `isFeatured(slug)`, `load()`.
Il perd le classement (une règle pure), les libellés (de la présentation),
`factsOf`, `isLoading`, `isError`, `reset`. Le nombre de vedettes n'a plus
qu'une source, `FEATURED`.

### 4.5 `features/desktop/` (ex-`station`)

#### L'état : découpé selon ses actions

Un état est un ensemble de signaux **qu'aucune action ne traverse**. Arriver
sur une vue change à la fois la vue, la fiche, le chapitre, les fiches lues,
l'aperçu (selon les épingles) et le survol : ces signaux forment un seul
état, sinon une règle métier se disperse en chaînes d'effets.

| État        | Signaux                                                                                                            | But                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `desktop`   | `view`, `slug`, `chapter`, `section`, `visited`, `pins`, `preview`, `lastPreview`, `selected`, `hovered`, `family` | ce que le lecteur regarde, ouvre et désigne |
| `animation` | `paused`                                                                                                           | la scène en mouvement ou en pause           |

`DesktopManager` expose l'état et ses commandes ; ses dérivés sont ceux dont
un écran a besoin (`showsList`, `showsAbout`, `showsPreview`, `canStepBack`),
et plus aucun relais inutile.

- `rules/view.rules.ts` : `parentOf`, `stepBack`, et **`windowOf(view)`**,
  la table vue → fenêtre écrite une seule fois (deux copies aujourd'hui).
- `models/desktop.model.ts` : `DesktopView`, `DesktopWindow`, `SceneBody`,
  les ids DOM (ex-`station.ids`). Une seule union de vues : celle du moteur
  (`ObjectView`) et celle de la pile (`WindowSlot`) disparaissent.

#### Les composants

- **`space-scene/`** (ex-`object`). Le composant canvas perd ses sept
  responsabilités :

  | Unité                                                  | But                                                                   |
  | ------------------------------------------------------ | --------------------------------------------------------------------- |
  | `space-scene.component.ts` `SpaceSceneComponent`       | démarrer et arrêter la scène, lui passer ce que l'écran montre        |
  | `rules/canvas-resolution.rules.ts`                     | la taille des canvas selon le budget de pixels et la densité          |
  | `scene-layout.rules.ts`                                | faire des ancres posées sur l'écran la mise en page de la scène       |
  | `turn-gesture.directive.ts` `TurnGestureDirective`     | tourner la scène en la faisant glisser, sans cliquer au lâcher        |
  | `planet-buttons.component.ts` `PlanetButtonsComponent` | un bouton accessible par planète, le double toucher sur écran tactile |
  | `engine/`                                              | la boucle et ses couches (étape 6, D11)                               |

  Elle reçoit des `SceneBody { slug, title, short }` et des slugs, plus des
  rangs : la traduction slug ↔ rang devient son affaire interne. La page fait
  la correspondance `Project` → `SceneBody` par un `computed`. Le clic qui
  termine un glissement est absorbé par `TurnGestureDirective`, ce qui retire
  `swallowVoid` de l'écran.

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

### 4.6 `features/profile/`

- `components/about-window/` : la fenêtre « à propos », section par section
  (« part » devient « section »).
- `data/contact.data.ts` : les liens de contact (ex-`app.contact.ts`).
- `i18n/profile-texts.port.ts` : sa tranche de textes (sortie de `PAGES_TEXTS`).

### 4.7 `i18n/`

- `catalog.model.ts` : `Catalog`, composé des tranches des features et de
  `AppTexts` (têtes de page, lien d'évitement, libellés de navigation).
  `PagesTexts` disparaît : ses morceaux vont à leur feature.
- `catalog-loader.service.ts` `CatalogLoaderService` (ex-`Catalogs`) :
  `ensure(lang)`, `current`, `of(lang)`.
- `i18n.provider.ts` : `provideI18n()` fournit les tranches et charge le
  premier catalogue. Il ne fournit plus `LINKS`.
- `catalog.guard.ts` : charge le catalogue de l'adresse visée, sans rien
  écrire d'autre.
- `paths.data.ts` : la table des adresses de chaque vue, par langue.
- `paths.rules.ts` : `pathOf`, `translatePath`. La table et ses règles
  restent ici, sous `pages` : les pages et la racine les lisent.
- `fr.data.ts`, `en.data.ts` : le contenu.

Les têtes de page lisent le catalogue **de la langue visée**
(`CatalogLoaderService.of(langOfUrl(url))`) et non la tranche courante : au
passage de `/projets` à `/en/projects`, la langue courante est encore le
français quand les resolvers tournent.

### 4.8 `pages/`

| Unité                                  | But                                                                                                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `desktop/desktop-page.component.*`     | composer l'écran : scène, navigation, fenêtres ; brancher les gestes sur les managers                                                                                                       |
| `desktop/desktop-route.component.ts`   | la feuille de route, vide : à son activation, dire au bureau quelle vue son adresse montre ; un seul composant pour toutes les vues, fiche comprise (ex-`ViewMarker` + `ProjectDetailPage`) |
| `page-head.resolver.ts`                | titre, description et adresses alternatives de chaque vue (ex-`view-head` + `project-title.resolver`)                                                                                       |
| `workbench/workbench-page.component.*` | l'atelier des composants partagés, en développement                                                                                                                                         |

- `station-projects.binding.ts` disparaît. La scène traduit elle-même slug
  et rang, le filtre est typé, les relais tombent. Il reste deux
  correspondances, des `computed` de la page : `Project` → `SceneBody`, et
  « l'adresse désigne-t-elle une fiche qui existe ».
- Échap passe par un `host` de la page, plus par un écouteur global.
- La pile des fenêtres suit la vue par un `linkedSignal` posé **dans la
  page** (`windowOf(view)`), puisque `WindowStackService` est générique ;
  l'effet de navigation ne garde que le focus (`ViewFocusService`).

Un resolver ne fait que calculer une donnée : c'est le composant de route,
dont c'est le rôle, qui déclare la vue au bureau.

### 4.9 La racine

- `app.component.ts`, `app.config.ts`, `app.config.server.ts`,
  `app.routes.ts`, `app.routes.server.ts`.
- `app.links.ts` : `provideLinks()` répond au port `LINKS` avec
  `i18n/paths.rules`.
- `app.site.ts` : `provideSite()` répond au jeton `SITE`.

### 4.10 `src/testing/`

- `provideTexts` réutilise `provideI18n` avec les catalogues chargés, et
  `provideLinks`, au lieu de recopier leur câblage.
- `fake-managers.ts` devient `project-fixtures.ts` : des données d'exemple
  classées par la vraie `rank()`.

## 5. Arborescence cible

```
src/app/
  app.component.ts  app.config.ts  app.config.server.ts
  app.routes.ts  app.routes.server.ts  app.links.ts  app.site.ts

  core/
    services/
      browser/     browser-window · media-preferences · clock · page-visibility ·
                   element-observer · document-styles · cursor · canvas-contexts
      head/        document-head.service
      i18n/        locale.service
      presence/    user-presence.service
      errors/      console-error-handler.service
    strategies/    route-head.strategy
    ports/         site.port
    models/        lang.model
    rules/         localize.rules · draft.rules
    helpers/       format.helper · vector.helper · easing.helper · random.helper

  shared/ui/
    components/    window/ · segmented/ · social-links/ · language-switch/ · main-nav/
    directives/    draggable · fit-height · remember-scroll · stacked-window ·
                   bottom-edge-variable · layout-anchor · view-heading
    services/      scroll-memory · window-stack · layout-anchors · view-focus
    signals/       element-size.signal
    models/        window · segmented · social-link · site-nav · entrance
    data/          social-icons.data
    ports/         shared-texts.port

  features/
    common/
      ports/       links.port
      models/      scene-anchors.model
    projects/
      components/  featured-bar/ · project-list/ · project-preview/ · project-detail/
      services/    projects-repository.service
      states/      projects/
      ports/       projects-texts.port · featured-count.port
      rules/       ranking.rules · project-labels.rules
      models/      project · project-family · project-detail
      data/        projects.data · projects/<un fichier par projet>.data
    desktop/
      components/  space-scene/ · planet-buttons/ · intro-card/ · home-title/ ·
                   not-found-window/ · animation-toggle/
      directives/  turn-gesture.directive
      services/    home-reveal.service · featured-tour.service
      states/      desktop/ · animation/
      ports/       desktop-texts.port
      rules/       view.rules · scene-layout.rules · canvas-resolution.rules
                   scene/  scene-frame · panel-veil · scene-bodies · scene-math
                           camera/   camera-frames · framing · pointer ·
                                     projection · traveling
                           matter/   grain-reserve · matter-light
                           planets/  planet-focus · label-placement
                           sky/      star-field · comets · constellations
      models/      desktop.model · scene.model · scene-constants.model
      engine/      space-scene.engine
                   motions/    camera · clock · grains · scene · star-flow ·
                               turntable
                   renderers/  grains · orbits · planets · planet-labels · scene
                               sky/  sky · star-sky · constellations · comets
    profile/
      components/  about-window/
      ports/       profile-texts.port
      data/        contact.data

  i18n/
    services/      catalog-loader.service
    providers/     i18n.provider
    guards/        catalog.guard
    models/        catalog.model
    rules/         paths.rules
    data/          paths.data · fr.data · en.data

  pages/
    desktop/       desktop-page.component.* · desktop-route.component.ts
    workbench/     workbench-page.component.*
    resolvers/     page-head.resolver
```

Les contenus exacts du moteur (`engine/`, `rules/scene/`) se précisent
méthode par méthode à l'étape du moteur ; leur place, elle, est fixée.

## 6. L'ordre de migration

Chaque étape est une PR, `npm run check` vert à chaque commit.

1. **Lint et garde-fous** (étape 1 de `phase-3.md`) : zones `i18n` et
   racine, `--max-warnings 0`, règles Sonar, et `check-structure.mjs` qui
   tient §3. Le script entre en mode rapport : il liste les écarts de
   l'arborescence actuelle sans bloquer, et passe en erreur à la fin de
   l'étape 3, quand l'arborescence est en place.
2. **Golden étendu** (étape 5 de `phase-3.md`, avancée) : ses empreintes sont
   prises avant tout ce qui touche la scène ou son accès au navigateur.
3. **Arborescence et noms** : dossiers, fichiers, sélecteurs et classes, sans
   changer aucun comportement. Dans le même commit que chaque renommage :
   `scripts/check-prerender.mjs`, qui vérifie en plus que chaque sélecteur
   qu'une page ne doit pas contenir apparaît sur une autre ;
   `src/integration/*.spec.ts` ; `FEATURES` dans `eslint.config.js` ;
   `CLAUDE.md` et le message du lint sur les globales.
4. **Découpages** : `core/browser`, la fenêtre, la pile, la scène (hors
   moteur), l'état du bureau, `ProjectsManager`, le binding.
5. **Angular 22** : la langue dérivée, les têtes de page
   dans la langue visée (avec un spec `RouterTestingHarness` : changer de
   langue donne le titre dans la nouvelle langue).
6. **Clean code** : commentaires, code mort, doublons, valeurs en dur.
7. **Moteur** (D11).
8. **Documentation** : `passation-showcase.md` rejoint ce document.
