# Journal des décisions

Une entrée par décision qui engage plus d'une tâche : la décision, sa raison,
ce qui a été écarté, sa date. Les écarts à la maquette sont dans
`docs/maquette/README.md`, pas ici.

## 2026-09-23 — Atelier de composants en route de développement

**Décision.** Les composants partagés (`shared/ui/window`, `shared/ui/segmented`)
se voient dans `/atelier`, une route qui n'existe que dans les builds de
développement. La condition lit `ngDevMode` et non `isDevMode()` : le build de
production définit `ngDevMode` à `false`, le minifieur élimine la branche et le
chunk de l'atelier avec elle. L'atelier n'est pas nommé dans
`app.routes.server.ts`, où une route sans route client casse le build.

**Raison.** Les composants arrivent avant les pages qui les utilisent, et chaque
étape se vérifie dans un vrai navigateur.

**Écarté.** Storybook (un outillage et un second build pour deux composants) ;
des specs seuls (ils ne montrent pas le rendu).

**À défaire** quand les pages du relevé et de la fiche montrent tous les états
de la fenêtre et du segmenté.

## 2026-09-23 — Intégration et déploiement continus sur GitHub Pages

**Décision.** Chaque pull request et chaque push passent `npm run check` ; un push
sur `main` publie le site prérendu sur GitHub Pages, sous le chemin du dépôt
(`--base-href /portfolio/`), avec la coquille client en `404.html` pour que le
routeur rende sa propre vue « adresse inconnue ». Le dépôt est public : Pages
n'est pas offert sur un dépôt privé avec le plan gratuit.

**Raison.** `outputMode: 'static'` produit un site sans serveur ; un hébergeur
statique suffit, et celui du dépôt ne demande aucun compte de plus.

**Écarté.** Un hébergeur tiers (un compte et un secret de plus) ; un dépôt privé
sur un plan payant (un coût pour un contenu destiné à être public).

## 2026-09-23 — Les projets vedettes se dérivent du rang

**Décision.** Les vedettes de l'accueil sont les quatre premiers projets dans
l'ordre de l'orbite, calculés par `ProjectsManager.featured`, jamais stockés.

**Raison.** L'export (`vedettes = 4`) et la passation lient la sélection de
l'accueil au rang : les deux applications publiées et les deux dépôts publics,
quatre projets qu'on peut ouvrir soi-même.

**Écarté.** Un booléen par projet, qui laisse le rang et la sélection diverger.

**À revoir** le jour où un projet change de rang sans devoir entrer à l'accueil
ou en sortir.

## 2026-09-23 — Le catalogue des projets passe par un seul chemin

**Décision.** Projets, faits et fiches, avec les libellés de niveau, les titres
de chapitre par défaut et les couches de la figure, sont lus en une fois par
`ProjectsRepository.getCatalog()`, portés par une seule action `success`
et tenus par le state. Les faits sont la seule table des faits, indexée par
slug ; une fiche n'en porte aucun, et son type le refuse.

**Raison.** Une seule couture pour une source distante, un seul cycle de
chargement (une fiche n'est jamais là sans son projet), et le prérendu lit le
même repository.

**Écarté.** Des constantes importées par le manager ; une lecture par table.

## 2026-09-23 — Les fenêtres vivent à la station, le routeur ne dit que l'adresse

**Décision.** Les routes gardent leurs chemins, `title` et `data.description`,
et chargent chacune un composant-marqueur de `pages/`, chargé d'emblée, qui
déclare sa vue à la station (`StationManager.navigated`) dès son constructeur.
La feature `station` tient l'état de l'instrument : vue, slug, épingles,
aperçu, sélection du relevé, fiches lues, famille filtrée, volet, chapitre. Elle
ne connaît que des slugs, jamais le catalogue. `pages/station` compose : elle
monte chaque fenêtre sur « vue courante ou épinglée », joint la station et les
projets, et décide entre fiche et adresse inconnue. `AppComponent` rend le
`<router-outlet>` (qui ne rend que les marqueurs) avant la station.

**Raison.** Une fenêtre épinglée reste montée quand la route change, ce qu'un
`router-outlet` ne sait pas faire. Ce qui survit à une navigation dans l'export
survit ici. Le HTML prérendu de chaque chemin contient sa fenêtre, et le premier
rendu client voit la même vue que le serveur : l'hydratation reprend le DOM au
lieu de le reconstruire.

**Écarté.** Outlets nommés (les épingles dans l'URL, non prérendables) ;
`RouteReuseStrategy` (une seule vue affichée à la fois) ; les quatre fenêtres
toujours montées (plusieurs `<h1>`, contenu caché prérendu) ; composants routés
doublés d'une copie épinglée (deux instances, état et position perdus).

**À revoir** si `view` gagne un second écrivain, ou si le budget initial du
bundle est dépassé : passer alors à `@defer` avec hydratation incrémentale,
jamais à un `@defer` simple, dont le serveur ne rend que le substitut.

## 2026-09-23 — La reprise de l'audit : nettoyer, puis construire, le moteur en dernier

**Décision.** Le plan de `docs/audit/README.md` se suit dans l'ordre (D1) :
l'outillage (étape 1), puis le nettoyage sans changement de rendu (étapes 2 à
5), puis les fonctionnalités (projets, accueil, bilingue : étapes 6 à 8), et le
moteur canvas en dernier (étape 9). Une étape, une branche, une PR. Les règles
de taille, de complexité et de nommage entrent en avertissement à l'étape 1,
et chaque étape passe en erreur celles qu'elle a résolues.

**Raison.** On ne traduit pas du code qu'on va refaire, et un nettoyage qui ne
change pas le rendu se vérifie en comparant le HTML prérendu avant et après.

**Écarté.** Les fonctionnalités d'abord (le bilingue sur des composants de 450
lignes, à reprendre ensuite) ; des règles d'emblée en erreur (un `check` rouge
pendant tout le nettoyage, ou des exceptions partout).

## 2026-09-23 — Le focus va au titre de la vue après une navigation, pas au premier chargement

**Décision (D6).** Quand le lecteur arrive sur une vue par une navigation, le
focus va à son `h1` (`appLandingHeading`, `LandingFocus`), dans le conteneur
de la vue : la fenêtre de son emplacement, ou le titre de l'accueil. Au premier
chargement, rien ne bouge : le focus reste en haut du document.

**Raison.** Après une navigation sans rechargement, un lecteur d'écran ne sait
pas que la page a changé si rien ne le lui dit : le titre annonce la vue. Au
premier chargement, le navigateur l'annonce déjà, et le lecteur au clavier
attend de partir du début du document, là où est le lien d'évitement.

**Écarté.** Le focus à chaque arrivée, premier chargement compris (il sautait
le lien d'évitement) ; aucun focus du tout (une navigation muette).

## 2026-09-23 — Un projet, un fichier : identité, faits et fiche ensemble

**Décision (D5).** Chaque projet s'écrit dans un fichier à lui,
`features/projects/data/projects/<slug>.project.ts`, typé `ProjectEntry` :
son identité, ses faits et sa fiche, obligatoires tous les trois.
`PROJECTS` n'est plus que la liste ordonnée de ces entrées, et le rang est sa
position. Le repository en tire le catalogue (projets, faits et fiches par
slug) ; rien d'autre ne lit ces fichiers. Quand le site devient bilingue
(étape 8), les textes d'un projet restent dans son fichier, le français et
l'anglais côte à côte.

**Raison.** Ajouter un projet touchait six endroits, et un oubli passait tous
les garde-fous : le relevé annonçait huit fiches pour sept lignes, et une
fiche était prérendue vide. Un fichier par projet, dont le type exige chaque
partie, rend l'oubli impossible à compiler. Les textes d'un projet côte à
côte, dans les deux langues, se relisent ensemble et ne divergent pas.

**Écarté.** Trois tables indexées par slug (l'état d'avant, où rien ne
garantit qu'elles couvrent les mêmes projets) ; les textes des projets dans
le catalogue de langue (une fiche éclatée entre trois fichiers, et un slug à
recopier dans chacun).

## 2026-09-23 — Le bilingue : un catalogue à l'exécution, l'adresse fixe la langue

**Décision (D3).** Chaque texte de l'interface est dans un catalogue typé,
un par langue : `src/app/i18n/fr.ts` et `en.ts`, qui implémentent tous deux
`Catalog` (une clé oubliée ne compile pas). Chaque couche déclare la tranche
dont elle a besoin, derrière son propre jeton (`SHARED_TEXTS` dans
`shared/ui`, `PROJECTS_TEXTS` et `STATION_TEXTS` dans leurs features,
`PAGES_TEXTS` à la racine) ; la racine de composition (`provideI18n`) les
sert depuis le catalogue de la langue courante. Chaque catalogue est un
chunk : l'initialiseur charge celui de la première adresse, et chaque route
charge le sien avant de s'activer (`loadCatalog`). La langue est lue dans
l'adresse (`Locale`, dans `core`), jamais stockée ; elle écrit `lang` sur la
racine du document, et `PageHead` écrit le `canonical`, les `hreflang` et
`og:locale`. Changer de langue, c'est suivre un lien vers la même vue à son
autre adresse : la station reste montée, et `syncRoute` ne remet rien à zéro
quand la vue et la fiche ne changent pas. L'anglais rédigé sans relecture est
marqué `draft(…)`, et `src/integration/drafts.spec.ts` compte ce qu'il reste.

**Raison.** C'est la seule approche qui tienne à la fois « un fichier par
langue, aucun texte dans les gabarits » et « changer de langue sans rien
perdre ». Des jetons par couche gardent la loi de dépendance : `shared/ui` et
les features ne connaissent ni la racine ni l'autre langue.

**Écarté.** L'i18n native d'Angular (`$localize`) : le français resterait
dans les gabarits, changer de langue rechargerait une autre application, et
GitHub Pages ne sert qu'un `404.html` pour deux builds. ngx-translate et
Transloco : une dépendance, du JSON non typé et un chargeur côté serveur pour
ce que quelques dizaines de lignes font ici. Rapport 00, §5.

## 2026-09-23 — Les adresses : le français à la racine, l'anglais sous /en

**Décision (D4).** Le français garde ses adresses (`/`, `/projets`,
`/projet/:slug`, `/a-propos`) ; l'anglais les a sous `/en` (`/en`,
`/en/projects`, `/en/project/:slug`, `/en/about`). Une seule table,
`src/app/i18n/paths.ts`, en tire les routes, les liens (le port `LINKS` de
`features/common`), le sélecteur de langue et les alternatives de l'en-tête.
Les deux langues sont prérendues ; une adresse inconnue reste inconnue dans
l'autre langue.

**Raison.** Les adresses françaises existantes ne cassent pas, chaque page
est indexable dans sa langue, et une adresse partagée dit la langue qu'elle
montre.

**Écarté.** `/fr/…` pour le français (toutes les adresses existantes
changeraient) ; la langue en paramètre ou en préférence stockée (une même
adresse montrerait deux pages, que le prérendu ne peut pas servir).

## 2026-09-23 — Le moteur de l'objet : un refactor limité, sous un test « golden »

**Décision (D2).** Le moteur canvas n'est pas réécrit. Il est d'abord figé par
un test « golden » (`object-engine.golden.spec.ts`) : sur une horloge et une
graine fixes, chaque appel aux deux canvas et chaque style écrit sur les
planètes, les libellés et les lignes de la règle sont repliés en une empreinte
par scène, arrondis au millième de pixel. Sous ce test, trois extractions :
les valeurs partagées (`constants.ts` : une seule portée du curseur, le bord
de l'ombre, la vitesse orbitale, l'élévation du voyage) et la projection du
plan (`projection.ts`) ; le tourne-disque (`turntable.ts`) ; le placement des
libellés (`labels.ts`). Les empreintes n'ont pas bougé. Puis quatre
corrections du rapport 01, chacune tenue par un spec : le plancher des orbites
sur téléphone, la traversée non rejouée à la sortie du mouvement réduit,
`fitOrbits` avant la caméra, la partie bornée par les figures. La boucle des
grains ne change pas.

**Raison.** Le moteur est le rendu que la maquette décrit, réglé à l'œil ;
une réécriture ne se vérifie pas sans captures. Un test qui compare le dessin
appel par appel rend chaque extraction vérifiable sans navigateur.

**Écarté.** Le découpage complet du rapport 05 (`Camera`, `DiskRenderer`,
`PlanetsRenderer`, `StyleWriter`…) : trop de surface pour un gain de lecture,
dans un code que personne d'autre ne touche. Les avertissements de taille et
de complexité qui restent sur `object-engine.ts`, `sky.ts`, `scene.ts`,
`comets.ts`, `constellations.ts`, `math.ts` et `object.component.ts` sont ce
prix : la règle les garde en avertissement pour ces fichiers seulement.

## 2026-09-23 — Les fichiers gardent leur suffixe (D7)

**Décision.** Les fichiers et les classes gardent leur suffixe de rôle, les
services compris : `window.component.ts` / `WindowComponent`,
`clock.service.ts` / `ClockService`. La liste des suffixes est fermée
(`organisation.md` §3). `angular.json` fixe `type`
pour chaque schematic, afin que `ng generate` produise la même forme.

**Raison.** Le suffixe dit le rôle avant d'ouvrir le fichier, et une recherche
par rôle (`*.service.ts`) range le dépôt d'un coup d'œil.

**Écarté.** La convention du style guide Angular depuis la v20
(`window.ts` / `Window`), que `ng generate` suit par défaut en v22.

## 2026-09-23 — `pages/` ne contient que des pages (D8)

**Décision.** `pages/` ne garde que les composants routés, la composition de
l'écran, les `*.provider.ts` qui joignent deux features et les
`*.resolver.ts` de route. Un garde le vérifie. Le reste descend : le contenu
de profil (fenêtre « à propos », liens de contact) dans une feature
`profile`, les composants de l'écran dans `features/desktop`, ce qui n'a
aucun métier (pile des fenêtres, bas de l'en-tête, arrivée) dans `shared/ui`.
Les destinations sont dans `docs/architecture/organisation.md`.

**Raison.** La référence définit `pages/` comme la couche de composition ;
dix-sept fichiers y avaient glissé sans qu'aucune règle ne le voie.

**Écarté.** Tout ranger dans `features/desktop` : plus simple, mais la
feature mêlerait le profil et la navigation.

**Remplace** l'entrée « Les fenêtres vivent à la station » sur un point : les
sous-composants n'y vivent plus.

## 2026-09-23 — Zéro avertissement (D9)

**Décision.** Le lint tourne avec `--max-warnings 0`. Les règles de
`eslint-plugin-sonarjs` et `eslint-plugin-unicorn` qui correspondent à ce que
montre SonarLint sont choisies une par une et passent en erreur. Aucune
exception : ni `eslint-disable` dans le code, ni règle levée pour un fichier
dans la config. Une règle qui gêne se règle en corrigeant le code. Seuls
restent les réglages par catégorie de fichiers (les specs, par exemple), qui
sont la règle de cette catégorie et non une exception ; chacun a sa raison
dans ce journal.

**Raison.** Une règle en avertissement n'est tenue par rien : la CI passait
avec 43 avertissements.

**Écarté.** Les presets complets (environ 1 300 constats, dont beaucoup
contraires aux choix du projet : `no-null`, `globalThis.window`, noms de
fichiers).

## 2026-09-23 — Pas de commentaire dans le code (D10)

**Décision.** Le code ne porte pas de commentaire. Un nom juste dit ce que
fait le code ; une fonction qui a besoin d'être expliquée est renommée ou
découpée. Aucune trace du chantier non plus : ni étape, ni date, ni « on a
d'abord fait… ». Le pourquoi d'une contrainte (une valeur réglée à l'œil, un
contournement de navigateur, une limite à ne pas dépasser) va dans ce journal
ou dans un document d'architecture, jamais sur la ligne concernée.

**Raison.** Un commentaire paraphrase le code ou raconte son histoire ; dans
les deux cas il se lit deux fois et vieillit seul, et plusieurs étaient devenus
faux. On ne laisse pas l'échafaudage sur la maison : l'épaisseur des
fondations se justifie dans les plans, pas sur la chape.

**Écarté.** Garder les commentaires de « pourquoi » dans le code.

## 2026-09-23 — Le moteur de l'objet devient des objets (D11)

**Décision.** D2 est remplacée. Le moteur est découpé en classes à
responsabilité unique : un renderer par couche dessinée derrière une
interface étroite, la caméra, l'entrée et l'état de scène à part, les
dépendances passées au constructeur. SRP et KISS d'abord : pas d'abstraction
sans deux utilisateurs. Le golden reste la preuve ; il est d'abord étendu
(comètes, `dpr` 2, téléphone, libellés mesurés, mouvement réduit) dans un
fichier à part dont les empreintes sont prises avant toute extraction. Aucune
allocation dans la boucle des grains. L'exemption du moteur disparaît du lint
à la fin.

**Raison.** Le moteur est le seul code qui échappe aux règles du projet, et
le seul qu'on ne peut pas lire sans la maquette.

**Écarté.** Garder D2 et ses avertissements permanents.

## 2026-09-23 — Des noms qui se comprennent sans la maquette (D12)

**Décision.** Un nom se comprend sans avoir lu la maquette. La feature et la
page `station` deviennent `desktop` (l'écran se comporte comme un bureau à
fenêtres), le composant `object` devient `space-scene` (la scène spatiale en
canvas), `shared/ui/object-marks` devient `shared/ui/layout-anchors` : dans
`shared/ui`, un nom ne connaît pas son lecteur. Le vocabulaire des ancres,
partagé par la barre des vedettes et la scène, est un type de
`features/common/scene-anchors`. Les
autres noms du même genre sont revus avec le même critère.

**Raison.** « la station » et « l'objet » sont des mots de la maquette ; un
lecteur du code n'a aucun moyen de les deviner.

## 2026-09-23 — Une nomenclature précise et modulaire (D13)

**Décision.** `docs/architecture/organisation.md` fait foi pour
l'arborescence. Chaque unité y est conçue depuis son but, sa responsabilité,
son contrat et son rôle, puis reçoit sa forme, son nom et son dossier. Une
seule structure partout : zone → dossier de rôle → sous-dossier de concept →
fichiers. Un fichier porte le suffixe de son rôle et va dans le dossier de ce
rôle, qui n'accepte que ce suffixe ; un fichier par sujet, au plus 8 fichiers
source par dossier, un sous-dossier par concept au-delà.
`scripts/check-structure.mjs` le vérifie dans `npm run check`.

**Raison.** Un fichier générique finit n'importe où, et un dossier de
cinquante fichiers ne se lit pas : le moteur en avait treize à plat. Une
règle vérifiée ne s'érode pas.

**Écarté.** Ranger les morceaux à côté de leur premier utilisateur : il
faudrait les déplacer au second. Un dossier `utils/` sans définition, qui
accepte tout. Une règle écrite sans script.

## 2026-09-23 — L'état du bureau se découpe selon ses actions (D14)

**Décision.** Un état est un ensemble de signaux qu'aucune action ne
traverse. Le bureau a deux états : `desktop` (la vue, la fiche, le chapitre,
les fenêtres, la sélection, le survol, le filtre) et `animation` (la pause).

**Raison.** Arriver sur une vue change à la fois la vue, l'aperçu selon les
épingles et le survol. Découpés par concept nommé, ces signaux obligeraient
une règle métier à se disperser en chaînes d'effets entre managers.

**Écarté.** Un état par concept (`location`, `windows`, `selection`).

## 2026-09-23 — Le composant de route déclare la vue, la langue se dérive du routeur

**Décision.** Un seul composant de route, vide (`desktop-route.component`),
sert toutes les vues, fiche comprise : à son activation, il dit au bureau
quelle vue son adresse montre. La langue se dérive de
`Router.lastSuccessfulNavigation` ; la garde ne fait que charger le
catalogue ; les têtes de page lisent le catalogue de la langue visée. Amende
D3.

**Raison.** Un seul point d'écriture de la vue, porté par l'unité dont c'est
le rôle ; une seule source de la langue.

**Écarté.** Un resolver qui écrit la vue : un resolver calcule une donnée, il
n'écrit pas un état, et son nom mentirait sur son rôle. Deux composants
marqueurs (un par forme de route). Dériver la langue de la navigation en
cours (le catalogue serait lu avant d'être chargé).

## 2026-09-23 — Les suffixes disent comment on se sert du fichier (D15)

**Décision.** Le suffixe d'un fichier dit comment on s'en sert : placé dans
un gabarit (`.component`, `.directive`), injecté (`.service`, `.manager` et
les pièces d'ngx-statewise, `.port`), déclaré dans une configuration
(`.provider`, `.guard`, `.resolver`, `.strategy`), appelé (`.rules`,
`.helper`, `.signal`), importé (`.model`, `.data`), instancié dans la scène
(`.engine`, `.motion`, `.renderer`). `.helper` remplace `.utils`. `.port`
réunit un contrat et son jeton, tranches de textes comprises. Les concepts
d'Angular (`.pipe`, `.interceptor`, `.validator`…) sont dans la liste
d'office : on construit avec le framework, pas contre lui. Seul un rôle
qu'Angular ne connaît pas demande une entrée de ce journal.

Chaque fichier va, dès sa création, dans le dossier de son rôle
(`helpers/`, `directives/`…), jamais à côté de son utilisateur : rien n'est
à déplacer le jour où un second utilisateur arrive. Un dossier de rôle reste
lisible : un fichier par sujet, au plus 8, un sous-dossier par concept
au-delà.

**Raison.** En créant ou en lisant un fichier, on sait tout de suite son rôle,
qui s'en sert et dans quel contexte.

## 2026-09-23 — Le moteur est corrigé avant le lint, sans exemption provisoire (D16)

**Décision.** L'ordre du plan de phase 3 change : le golden étendu (étape 2),
puis le moteur (étape 7), puis le lint (étape 1), puis la suite dans l'ordre.
La PR du lint passe `--max-warnings 0` et retire le bloc du moteur d'un même
geste : aucune règle n'y est levée, même pour un temps. Le golden étendu
partage son banc avec le premier (`src/testing/fixtures/engine-scene.fixture.ts`,
`src/testing/doubles/`) et ajoute à l'empreinte `aria-hidden` et `tabIndex`
des boutons.

**Raison.** D9 n'admet aucune exception ; une exemption « jusqu'à l'étape 7 »
en serait une, et le moteur ne se corrige que sous le golden étendu.

**Écarté.** Une exemption datée du moteur, retirée à l'étape 7 ; un budget
d'avertissements qui ne fait que baisser (un second appel à eslint, une
sortie bruyante).

## 2026-09-23 — Les règles du lint et leurs réglages par catégorie (D17)

**Décision.** Précise D9. Le lint ajoute `sonarjs` recommandé, entier : c'est
le profil que montre SonarLint. Il ajoute aussi une liste fermée de règles
`unicorn`, écrite dans `eslint.config.js` (`UNICORN_RULES`) : celles que
SonarLint reprend, plus `consistent-boolean-name`, `switch-case-braces`,
`no-useless-undefined` et `prefer-ternary`. Tout est en erreur, templates
compris, et `eslint` comme `stylelint` tournent avec `--max-warnings 0`.
`no-null` et `prefer-global-this` restent dehors. Le moteur n'a plus de bloc
à lui, ni pour la taille ni pour les noms de formule (`R`, `Q`, `M0`). Les
zones `i18n/` et `pages/` ont leur loi, et aucune zone ne remonte vers les
`app.*.ts` de la racine. `scripts/check-structure.mjs` vérifie
`organisation.md` §3 : il fait un rapport dans `npm run check`, et passe en
`--strict` à la fin de l'étape 3.

Les réglages qui restent sont ceux d'une catégorie de fichiers, et chacun a
sa raison :

- **Specs et `src/testing/`** : pas de modificateur d'accès obligatoire (des
  doubles jetables, pas une surface d'application) ; pas de plafond de
  lignes par fichier ni par fonction (un `describe` est aussi long que le
  nombre de comportements qu'il fixe).
- **`@ts-expect-error` avec sa raison** : la seule façon de tester qu'un type
  refuse une valeur (`projects.data.spec.ts`).
- **`states/`** : seul le manager importe le state et l'updater ; les autres
  zones passent par le manager.
- **`core/services/browser/`** : le seul dossier qui touche les globales du
  navigateur, une unité par sujet, qui sont interdites partout ailleurs parce
  qu'elles n'existent pas au prérendu.
- **`features/common/`** : n'importe rien du dépôt ; `../../` en sort
  toujours, et `@testing` n'a rien à y faire.
- **`_tokens.scss`** (Stylelint) : là où s'écrivent les valeurs que
  `declaration-property-value-disallowed-list` interdit ailleurs.

Les raisons de lecture de la config, qui n'y sont plus en commentaire :

- les noms (`NAMES`) sont ceux que suit déjà le code. Une clé entre
  guillemets (`'data-view'`, `'--head-bottom'`) est un nom du DOM, et un `_`
  en tête marque un paramètre qui n'est là que pour sa position ;
- le lint est typé, car interdire `any` doit voir aussi celui que personne
  n'a écrit (une bibliothèque, un `JSON.parse`) ;
- le groupe `core` exclut `@angular/core`, dont un jeton de port a besoin
  même dans `features/common` ;
- une feature sœur est aussi refusée par son nom nu, pour qu'un
  `../../contact/…` ne sorte pas d'une feature sans écrire `features` ;
- `FEATURES` est comparé au disque : une nouvelle feature sans sa ligne
  bloquerait sinon un import interdit sans rien dire ;
- `prefer-on-push-component-change-detection` n'est pas activée : depuis
  Angular 22, `OnPush` est la stratégie par défaut du framework ;
- `.claude/**` est ignoré, car le worktree d'un agent y vit pendant qu'il
  travaille ;
- Stylelint laisse à Prettier la mise en page, et les notations des jetons
  (`oklch(0.165 0.02 265)`) disent la même couleur dans les deux écritures.
  Safari sur iOS ne lit encore que `-webkit-text-size-adjust`.
- le DOM du prérendu (Domino) n'a ni `dataset` ni `append()` : ce qui
  s'exécute au prérendu écrit ses `data-*` par `setAttribute` et insère par
  `insertBefore(element, null)` (`page-head.service.ts`) ; `dataset` ne sert
  que dans le navigateur.

**Raison.** Une règle se lit dans la config, sa raison dans ce journal (D10).
Un réglage de catégorie est la règle de cette catégorie, pas une exception.

**Écarté.** `unicorn` recommandé entier (un millier de constats contraires aux
choix du projet) ; garder le bloc du moteur jusqu'à l'étape 7 (D16).

## 2026-09-23 — Les réglages de la scène canvas hors moteur (D18)

**Décision.** Ce que `ObjectComponent` portait en commentaire, sorti avec les
unités qui le portent maintenant :

- `PIXEL_BUDGET` (`canvas-resolution.rules.ts`) vaut 4,2 millions de pixels
  par canvas, avec un ratio plafonné à 2. Le coût de la traversée suit les
  pixels dessinés et les étoiles, dont le nombre les suit aussi : au-delà
  d'environ cinq millions, un écran 4K à 200 % tombait sous dix images par
  seconde. 4,2 millions garde nets un écran 1080p à 150 % et un retina de
  13 pouces ; au-delà, le ratio cède, et une poussière dessinée en carrés de
  2,5 px n'y perd rien.
- Sans survol (écran tactile), une planète demande deux touchers : le premier
  montre le nom du projet, le second l'ouvre (`PlanetButtonsComponent`).
- Un glissement n'est pas un clic : `TurnGestureDirective` émet `spun` au
  lâcher, sans quoi tourner la scène fermait l'aperçu.
- Un bouton de planète fait 48 px, la taille d'une cible tactile ; le moteur
  le place par `transform`.

**Raison.** D10 : le pourquoi quitte le code, pas le dépôt.

## 2026-09-23 — L'arborescence est en place, avec quatre unités de passage (D19)

**Décision.** À la fin de l'étape 3, chaque fichier a son suffixe et son
dossier de rôle, et `check-structure.mjs` tourne en `--strict` dans
`npm run check`. Les textes suivent les composants qui les lisent :
`DesktopTexts` reçoit `home` et `notFound`, une tranche `ProfileTexts`
(`features/profile/ports`) reçoit `about` et `contact`, et le catalogue a les
clés `desktop` et `profile`. Quatre unités restent telles quelles jusqu'à
l'étape qui les découpe :

- `pages/providers/desktop-projects.provider.ts` (`DesktopProjectsBinding`)
  joint le bureau et les projets. Elle devient des `computed` de la page à
  l'étape 4.
- `pages/desktop/project-detail-route.component.ts` et
  `desktop-route.component.ts` sont les deux feuilles de route. Elles
  fusionnent à l'étape 5.
- `features/desktop/services/window-stack.service.ts` et
  `directives/window-slot.directive.ts` connaissent encore les fenêtres du
  bureau. Elles passent dans `shared/ui`, génériques, à l'étape 4.
- `BrowserEnvironmentService` est rangé dans `core/services/browser/`, mais
  son découpage est celui de l'étape 4.

`check-prerender.mjs` refuse aussi une absence qu'aucun composant ne
pourrait produire : chaque élément qu'une page ne doit pas contenir doit être
le sélecteur d'un composant du dépôt. Sans cela, un sélecteur renommé rend le
contrôle vide sans qu'il échoue.

**Raison.** L'étape 3 déplace et renomme sans changer de comportement ; ce
qui demande un nouveau contrat attend l'étape dont c'est l'objet.

## 2026-09-23 — `shared/` tient des librairies : ui, windows, space-scene (D20)

**Décision.** `shared/` n'est plus un dossier d'interface : il tient des
librairies, chacune reprenable par une autre application avec un peu de
travail. Chacune est une zone du lint (`SHARED_LIBS`, comparé au disque comme
`FEATURES`) qui n'importe que `core`, ni le portfolio ni une autre librairie.

- `shared/ui/` : les composants d'interface sans métier.
- `shared/windows/` : le système de fenêtres, c'est-à-dire la fenêtre, son
  glissement, sa hauteur, sa mémoire de défilement, la pile et l'ordre des
  fenêtres, et ses textes derrière son propre port.
- `shared/space-scene/` : la scène spatiale en canvas, c'est-à-dire le trou
  noir, le disque et ses grains, le ciel, la caméra, la projection et le
  tourne-disque, avec des corps en orbite et des figures nommées. Son API
  parle de cadrages, de corps et de mise en avant, jamais de vues du site, de
  projets ni de chapitres.

`features/desktop` garde la chorégraphie : quelle vue donne quel cadrage,
quelles planètes sont en vedette ou visées, les textes, et les boutons des
planètes s'ils portent du métier.

**Raison.** Le moteur mêlait une scène générique et les mots du portfolio
(`view: 'sheet'`, `featured`, `chapter`, `part`). Les séparer rend chacune
des deux lisible sans l'autre. La fenêtre est un système complet, qui n'a rien
à faire au milieu des petits composants d'interface.

**Écarté.** Sortir aussi la mécanique i18n : elle est soudée au type
`Catalog` de l'application, et aucun second utilisateur ne la demande.

## 2026-09-24 — Les raisons du code ont leur dossier, et un garde-fou tient D10 (D21)

**Décision.** Le pourquoi qu'un commentaire portait va dans
`docs/architecture/raisons/`, un fichier par groupe de zones
(`space-scene.md`, `core-et-interface.md`, `bureau-et-pages.md`,
`projets-et-textes.md`), avec une section par unité. Une paraphrase
disparaît au profit d'un nom. `scripts/check-comments.mjs` refuse tout
commentaire dans `src/`, sauf le `@ts-expect-error` d'un spec avec sa raison
(D17). Il lit chaque fichier TypeScript avec le parseur du compilateur : un
`//` dans une chaîne ou une regex n'est pas un commentaire.

**Raison.** D10 se vérifie par un script. Une règle écrite sans script
s'érode ; avec un script, c'est un garde-fou.

**Écarté.** Garder les raisons dans ce journal : elles portent sur une ligne
de code, pas sur une décision, et il en compte plus de deux cents.

## 2026-09-24 — Un catalogue de langue se découpe par tranche (D22)

**Décision.** Quand un catalogue de langue dépasse la limite de lignes du lint,
on en sort une tranche entière, celle d'une couche, dans son propre fichier à
côté : `fr-profile.data.ts` et `en-profile.data.ts` portent la tranche
`profile`, et `fr.data.ts` / `en.data.ts` l'importent. Le type `Catalog` ne
change pas.

**Raison.** La réécriture du texte (docs/wording/) a fait passer `en.data.ts`
au-delà de 300 lignes, surtout à cause des `draft(…)` sur plusieurs lignes.
Couper par tranche suit les ports : chaque fichier correspond à une couche qui
lit ses propres textes.

**Écarté.** Raccourcir des phrases pour tenir dans la limite : le texte ne se
règle pas sur un outil. Une exception au lint : proscrite (D9).

## 2026-09-24 — Le bureau s'appelle `observatory` (D23, amende D12)

**Décision.** La feature et la page `desktop` deviennent `observatory`, avec
tout ce qui en porte le nom : composants (`observatory-scene`,
`ObservatoryPageComponent`, `ObservatoryRouteComponent`), modèles, état,
actions (`'OBSERVATORY_*'`), ports, la clé `observatory` du catalogue et les
sélecteurs `app-observatory-*`. Le mot « desktop » reste dans les textes, où il
nomme une plateforme logicielle. Les entrées précédentes de ce journal gardent
les noms de leur date.

**Raison.** Le site va porter des formats d'affichage `phone | tablet |
desktop` : « desktop » désignerait alors deux choses. « observatory » dit la
métaphore, un ciel qu'on observe à travers des panneaux d'instrument, et se
comprend sans la maquette, comme le demande D12.

**Écarté.** Garder `desktop` avec des formats neutres (`compact | medium |
expanded`) : une page « desktop » affichée sur un téléphone se lit mal.
Revenir à `station` : l'opérateur a voulu un autre nom. `console` et `orbit`
nomment déjà autre chose (`ConsoleErrorHandler`, `orbits.renderer`).
