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
marqué `draft(…)`, et `src/testing/integration/drafts.spec.ts` compte ce qu'il reste.

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

## 2026-09-24 — Une capture tolère 200 pixels, pas une position fractionnaire (D24)

**Décision.** Les captures de référence de Playwright tolèrent 200 pixels
différents (`maxDiffPixels` dans `playwright.config.ts`). Le haut de la fiche
est arrondi au pixel (`round(clamp(96px, 13vh, 120px), 1px)`).

**Raison.** À 1180 × 820 sous Chromium, deux rendus alternent d'un lancement à
l'autre : le titre de l'à-propos change d'anticrénelage sur une ligne,
159 pixels toujours. Rien ne bouge, et le seuil par défaut le refusait. Une
régression de disposition dépasse largement 200 pixels : le haut de la fiche à
106,6 px en faisait 1 500, d'où l'arrondi, qui laisse le bureau identique
(117 px à 900 de haut, le plancher de 96 px à 540). `--window-top` n'est pas
arrondi : au bureau, 94,5 px deviendrait 95, et ses captures bougeraient.

## 2026-09-24 — Au téléphone, la fenêtre est une vitre (D25)

**Décision.** Au format `phone`, la fenêtre garde son API et ses gestes
(épingler, replier, fermer), mais se présente en vitre : elle arrive basse,
son haut à 60 % de l'écran ; faire défiler son corps la monte d'abord
jusqu'à 12 px du haut, puis fait défiler le contenu ; revenu en haut du
contenu, tirer vers le bas la redescend ; repliée, elle n'est plus que sa
barre, collée en bas ; la scène derrière se floute et s'assombrit à mesure
qu'elle monte. Couchée, elle prend la moitié droite, de haut en bas, sans
montée. Le glisser de la barre disparaît. Les emplacements de la page
couvrent l'écran.

**Raison.** Une fenêtre flottante de bureau, sur 390 px de large, cache
l'objet sans rien gagner à se déplacer. La vitre laisse l'objet visible en
arrivant et donne toute la hauteur à la lecture. Elle passe par le
défilement natif (l'élan, le rebond, le retour) plutôt que par un geste
écrit à la main, et par le CSS seul pour la disposition, puisque le HTML
prérendu vaut `desktop` (voir `raisons/core-et-interface.md`).

**Écarté.** Une vitre qui s'arrête sous la barre de pages : à 390 px, la
barre tient sur deux lignes et descend à 154 px, et la vitre haute doit
monter à moins de 80 px du haut. Elle passe donc sous la barre, dans l'ordre
des calques, jusqu'à ce que la barre de pages et le rail de contact aient
leur disposition de téléphone. Un geste de glisser écrit en
JavaScript : il refait l'élan et la latence du défilement natif. L'accroche
CSS (`scroll-snap`) : elle choisit la butée la plus proche, pas celle du
côté où l'on tire.

## 2026-09-24 — La caméra cadre au-dessus d'un panneau du bas (D26)

**Décision.** Le moteur reconnaît un panneau de fiche ou d'aperçu en bandeau
du bas : au moins 90 % de la largeur de l'écran, et son haut sous le milieu
(`isBottomBand`, `scene-layout.rules.ts`). `SceneLayout` en porte le haut
(`approachBandTop`, `closeUpBandTop`, absents ou `null` sinon). Avec un
bandeau, l'approche (chaque cran de `APPROACHES`) et le gros plan placent le
corps visé au milieu de la bande de ciel, entre la barre du haut et le haut
du panneau, et au centre de la largeur ; l'objet se tient à sa gauche (à sa
droite au gros plan), son centre dans l'écran. Sans bandeau, rien ne change.
La réserve de grains est tirée une fois pour la densité pleine, et la part
allumée suit l'aire de la fenêtre (`densityShare`), recalculée à chaque
redimensionnement du canvas et amenée à sa nouvelle valeur en 0,55 s de
demi-vie. Le golden du téléphone change : `PHONE_LAYOUT` porte son bandeau,
la scène `close-up` s'y ajoute, et ses cinq empreintes sont reprises ; aucune
autre ne bouge.

**Raison.** Au téléphone, la vitre (D25) arrive en bas, pas à droite : le
cadrage à droite rangeait la planète à 16-21 % de la largeur, sous la vitre
ou collée au bord. Une réserve tirée à la taille de l'ouverture ne pouvait
pas s'épaissir quand la fenêtre grandit ; la retirer redistribuerait tous les
points d'un coup, alors qu'allumer une part plus grande d'une même réserve
les fait apparaître un à un, par le tirage déterministe.

**Écarté.** Suivre la vitre qui monte : la scène est floutée derrière elle,
et un cadrage qui la suit ferait bouger l'objet à chaque défilement. Un
seuil de variation sous lequel la densité ne se recalcule pas : l'amorti
suffit, et une rotation garde l'aire. Rendre les nouveaux champs
obligatoires : le banc du golden (`src/testing/fixtures/`) les ignore et
reste hors de cette tâche.

## 2026-09-25 — Au téléphone, une vitre à la fois, un dock, un chrome replié (D27, amende D25)

**Décision.** Au format `phone`, une seule vitre est ouverte : celle de la
vue, ou l'aperçu sur l'accueil. Une vitre épinglée que le lecteur quitte se
range dans un dock en bas de l'écran (`ObservatoryDockComponent`), un lien par
fenêtre vers sa vue ; la toucher y ramène, et la vitre revient ouverte. Le
manager dérive la liste (`docked`, par `dockedOf`) ; l'état retient la
dernière fiche (`lastSheet`) pour qu'une fiche rangée ait où revenir. La
barre de pages tient sur une ligne, en haut à droite debout, en haut à
gauche couchée. Le rail de contact se replie derrière un bouton « @ » en bas
à gauche, qui ouvre les liens dans la même rangée, à droite de lui, où le
dock se tient aussi. Debout, la vitre s'arrête sous la barre de pages quand
elle monte, et au-dessus de la rangée du bas quand elle se replie ; couchée,
la barre et la rangée sont dans la moitié gauche, la vitre garde la moitié
droite. L'aperçu de l'accueil est une petite vitre basse, qui ne monte pas.
Les emplacements de la page prennent la place d'arrivée de leur vitre
(pleine largeur, le haut à 60 % ; moitié droite couchée) : c'est ce
rectangle que la caméra lit (D26). Au bureau et à la tablette, rien ne
change : le dock, le bouton « @ » et la place de la vitre sont dans le DOM à
tous les formats, cachés ou sans effet hors du téléphone.

**Raison.** À 390 px, la barre sur deux lignes descendait à 154 px et
couvrait la vitre montée ; le rail flottant couvrait les boutons de la vitre
repliée. Deux vitres ouvertes sur un écran de téléphone se couvrent l'une
l'autre sans qu'on puisse les déplacer. Le détail est dans
`raisons/bureau-et-pages.md` et `raisons/core-et-interface.md`.

**Écarté.** Les liens de contact dans la barre de pages : à 320 px, elle ne
tient déjà sur une ligne qu'à quelques pixels près. Les liens au pied de
chaque vitre : ils disparaîtraient sur l'accueil sans aperçu. Une bande
pleine largeur en bas : un dock vide y coûterait une bande d'écran pour rien.
Des boutons de planète sur la fiche, pour mesurer la planète visée : ils
seraient focalisables au bureau, sans rien faire ; l'e2e mesure son nom,
que la scène pose contre elle.

## 2026-09-25 — Au téléphone, le châssis tient dans le haut de l'écran (D27)

**Décision.** Au format `phone`, la barre de pages s'étend à plat sur tout le
haut, sans boîte ni bordure, sur un léger fondu de `--paper`. Elle ne montre
que le lien de l'autre langue : le code courant et la barre oblique restent
dans le DOM, masqués. La page active garde sa face allumée, sans cadre. Le
« @ » du rail de contact rejoint le bout droit de cette bande, à plat tant
qu'il est fermé. Ouvert, ses liens couvrent toute la rangée, sur `--paper`.
Couché, la barre tient dans la moitié gauche, et le « @ » se place en bas à
droite de cette moitié de ciel. La vitre ne réserve plus de bande en bas,
sauf quand le dock a une entrée : elle se retire alors de la hauteur du dock
(`--dock-reserve`, par `:has()`), et le dock ne se pose jamais sur elle. La
scène perd son plancher de 380 px : à 568 × 320, la page ne défile plus, et
la règle des vedettes passe dans la moitié droite, libre sur l'accueil.

**Raison.** Le bas de l'écran appartient à la vitre. Une bande de 56 px pour
un seul bouton coûtait la même hauteur à chaque vue, et le dock s'y posait
sur le texte. Le haut était déjà occupé par la barre, qui gagne la place du
code courant (la langue se lit dans le contenu). Le « @ » y garde un mot, un
glyphe et une place par orientation : le coin du châssis opposé à la vitre.

**Écarté.** Garder le « @ » en bas, flottant sur la vitre : il cachait son
pied. Le mettre dans le menu de la barre : un seul toucher de plus pour un
contact, et deux actions dans un même bouton. Couché, le mettre dans la
barre : à 568 px, la moitié gauche ne tient pas la langue, la navigation et
le « @ » sur une ligne.

## 2026-09-25 — Sous la vitre, un seul filtre (D28, amende D25)

**Décision.** Au téléphone, la vitre qui monte ne pose qu'un filtre sur le
ciel qu'elle couvre : le sien, `--glass-blur-pane` (`blur(4px)
brightness(0.7) saturate(1.08)`), sur `--vitre-pane`, la teinte de `--vitre`
à 62 %. La couche `.shade`, qui couvrait tout l'écran, disparaît : le flou et
l'assombrissement qui suivent la montée (D25) passent sur `.lead`, le ciel
resté au-dessus de la vitre. Au téléphone, les segmentés tiennent sur une
ligne (resserrés, et défilants dans leur boîte en dernier recours), et dans
la barre de titre, c'est le titre qui se tronque, jamais le compteur.

**Raison.** Vitre haute, on ne voyait plus rien du ciel : sous Chromium,
le filtre de la fenêtre voyait celui de l'ombre, et deux flous et un
assombrissement de 0,55 s'empilaient. Mesuré contenu masqué, à 390 × 844, le
ciel sous le corps gagne un tiers d'écart de luminance (× 1,3 sur une fiche,
× 1,35 sur l'à-propos). `--ink-2` y garde 5,0:1 au moins sur le point le
plus clair.

**Écarté.** Un ciel plus net encore : un balayage de neuf réglages (flou,
luminosité, teinte) montre qu'au-delà de × 2 le contraste passe sous 4,5:1.
Mesurer le flou sous WebKit : celui de Playwright sous Linux ne dessine pas
`backdrop-filter` (témoin : `brightness(0.2)` sur du blanc reste blanc).
Le rendu se juge sous Chromium et sur un iPhone.

## 2026-09-25 — Chaque vue cadre dans le ciel libre (D29, étend D26)

**Décision.** Le moteur reconnaît un bandeau du bas quel que soit le rôle de
la fenêtre (`panelBandTop`), et un panneau latéral sur un écran debout
(`sidePanelLeft`). Avec l'un ou l'autre, la vue d'ensemble (relevé), la vue
de côté (à-propos) et la page introuvable centrent l'objet dans le ciel
libre, entre la barre du haut et le bandeau, ou à gauche du panneau, et
l'ajustent pour que l'orbite extérieure et ses planètes y tiennent
(`free-sky.rules.ts`). Sans l'un ni l'autre, les cadrages constants restent
tels quels. Repliée, la vitre du téléphone sort de son emplacement fixe :
l'emplacement se réduit à sa barre, la scène lit ce nouveau bandeau, et la
caméra y glisse avec son amorti ordinaire. Au repos de l'accueil, sur un
écran debout déjà au plafond de taille, la caméra regarde de plus haut
(élévation jusqu'à 0,6) : les planètes s'étagent, leurs libellés se
séparent, et le trou noir garde sa taille. La scène écrit le centre et le
rayon du trou noir sur `.stage` (`data-hole-*`), seulement quand ils
changent, pour que les tests lisent le cadrage.

**Raison.** D26 ne cadrait au-dessus de la vitre que l'approche et le gros
plan. Au relevé, l'objet restait posé sur le haut de la vitre, ses numéros
emmêlés, la moitié haute du ciel vide ; repliée, la vitre rendait l'écran
sans que l'objet le reprenne. Un écran debout a de la hauteur à revendre :
la dépenser en élévation démêle les libellés sans rapetisser l'objet.

**Écarté.** Suivre la vitre qui monte (D26 l'écarte déjà). Resserrer la
tolérance de placement des libellés : elle déplaçait les empreintes du
bureau.

## 2026-09-25 — L'accueil se pose dans le ciel que le chrome laisse (D30, étend D29)

**Décision.** Le titre de l'accueil, le rail de contact et le dock
s'inscrivent auprès de la scène sous un rôle `chrome` ; avec les deux
barres, ils forment `SceneLayout.chrome`. Le repos de l'accueil garde la
bande entre la barre et la règle tant qu'elle tient le trou hors du chrome
et au-dessus de son échelle plancher ; sinon, il se pose au centre du plus
grand ciel libre, le rectangle vide où l'objet entier (orbite extérieure
comprise) est le plus grand (`restInFreeSky`), et ses orbites s'ajustent à
sa largeur aussi. Les noms de planètes cherchent une place hors du disque
du trou, caméra arrivée. Debout à côté d'un panneau, l'approche garde le
disque sur l'écran. Couché, la vitre prend au moins 324 px, et la barre, le
« @ » et le dock se rangent à sa gauche (`--glass-width`) ; l'aperçu couché
ne dépasse pas la hauteur de l'écran.

**Raison.** Couché, la bande entre la barre (à gauche) et la règle (à
droite, en bas) supposait une règle pleine largeur : l'objet s'y réduisait à
un trou de 8 px de rayon contre le titre, et à 780, 640 et 568 px ses orbites
tombaient à zéro et le dessin s'arrêtait. Debout à 320 px, le trou passait
sous le titre ; à 360 et 390 px, deux noms de vedettes le traversaient. Le
détail est dans `raisons/space-scene.md` et `raisons/bureau-et-pages.md`.

**Écarté.** Un cadrage par format, lu dans le CSS : la scène ne connaît pas
le format, et le bureau prérendu vaut `desktop`. Toujours chercher le
rectangle libre : au bureau, il déplacerait un repos que la maquette fixe.
Donner au repos les fenêtres pour obstacles : les orbites se règlent sur le
repos à chaque vue, et une fiche ouverte changerait celles du bureau. Écarter
les noms du trou aussi pendant les déplacements : sans gain pour le lecteur
(le nom sauterait en plein vol) et huit empreintes du bureau bougeaient.
Une vitre couchée sous la barre de pages : elle perdait 56 px de hauteur
sur 320.

**Budget.** Le bundle initial passe de 499,6 à 502,6 kB : le seuil
d'avertissement monte de 500 à 520 kB (`angular.json`), pour que le build
reste sans avertissement ; le seuil d'erreur (1 MB) ne bouge pas. Le test
« keeps the sky readable under the raised glass » demande un gain de
× 1,15 au lieu de × 1,25 : le ciel est tiré à chaque chargement, et le gain
mesuré va de × 1,24 à × 1,29, si bien que × 1,25 échouait une fois sur dix.

## 2026-09-25 — Couché, le ciel commence sous la barre et finit à la vitre (D31, étend D29 et D30)

**Décision.** Le moteur reconnaît une vitre couchée à sa seule géométrie :
sur un écran couché, un panneau latéral qui touche le bord droit et le bas
de l'écran (`cornerPanelLeft`, `scene-layout.rules.ts`). Il garde aussi la
boîte de la barre du haut (`topBar`). Avec une vitre au coin, la vue
d'ensemble, l'à-propos et la page introuvable cadrent l'objet dans le ciel
libre de D29 : sous la barre, à gauche de la vitre. Le gros plan de
l'aperçu centre le trou dans le plus grand rectangle vide que le chrome et
la vitre laissent (`holeRoomBeside`), l'échelle réduite seulement s'il n'y
tient pas. Le nom d'une constellation allumée passe sous sa figure quand,
au-dessus, il croiserait la barre. Couché, le titre de l'accueil s'arrête
avant la vitre et passe à la ligne. Entre deux noms de planète, l'écart se
mesure de centre à centre.

**Raison.** Couché, D29 laissait les cadrages fixes : à 568 × 320, un bouton
de planète de la vue d'ensemble passait sous la barre, et le nom « PROFIL »
s'écrivait à 15 px du haut, sous elle. L'aperçu ouvert, la vitre couvrait
la fin du titre à 640 et 568 px, et le gros plan posait le trou sous le
titre et à moitié sous la vitre, aux quatre tailles. Les noms se mesuraient
de bord gauche à bord gauche : de largeurs différentes, ils se couvraient
(9 px à 640 × 360). Le détail est dans `raisons/space-scene.md` et
`raisons/bureau-et-pages.md`.

**Écarté.** Étendre `sidePanelLeft` au téléphone couché : il tient aussi le
disque de l'approche sur l'écran, et les fiches couchées auraient changé
sans défaut à corriger. Garder le cadrage fixe en le descendant sous la
barre : il aurait fallu une seconde règle à côté du ciel libre, qui tient
déjà la hauteur et la largeur. Mesurer les noms par un vrai test de boîtes,
sans tolérance, ou l'écart aux panneaux de centre à centre aussi : sept
empreintes du bureau bougeaient, dont le repos, où deux noms se couvrent de
3,4 px dans la tolérance de 4 px. Descendre le nom de la constellation sous
la barre en le gardant au-dessus de sa figure : il se poserait sur ses
étoiles, qui commencent 16 px sous lui.

## 2026-09-25 — Au doigt, on regarde l'objet de près (D32)

**Décision.** Aux formats `phone` et `tablet`, deux doigts qui s'écartent sur
le ciel rapprochent la caméra : l'échelle dessinée est multipliée par un
facteur borné à [1, 3], et le point sous le milieu des doigts reste sous
eux. Chaque doigt se pose sur le ciel (la scène, ou le bouton `.void` qui
la couvre quand une fenêtre est ouverte) ou sur un bouton de planète ; une
fenêtre, le châssis, un lien, un champ gardent leurs gestes, et un doigt qui
s'y pose ne commence jamais un pincement. Un toucher seul sur une planète
garde son effet (révéler, puis ouvrir) ; si un second doigt le rejoint, son
clic est avalé. Relâcher garde le facteur. Sur l'accueil au repos, où
aucun `.void` n'existe, un double toucher passe du cadrage de la vue à un
regard proche (× 2,2) centré sur le trou, et retour. Le facteur revient à 1,
avec l'amorti de la caméra, à chaque changement de cadrage (route, chapitre,
section, aperçu) et de taille du canvas. Sous `prefers-reduced-motion`, le
geste reste (c'est une manipulation directe) et s'applique sans amorti. Le
facteur est posé sur l'image quand elle est tracée (`ZoomMotion.lay`), après
la caméra : le crochet `data-hole-*` le reflète, et à 1 rien ne change, les
empreintes du golden non plus. Le canvas du ciel, `.void` et les boutons
de planète prennent `touch-action: none` à ces deux formats, et le canvas du ciel y reçoit le
pointeur, pour que la règle ne touche que le ciel et pas ce qui est posé
dessus. Un pincement avale le clic qui le suit : il ne referme jamais une
fenêtre. Un second doigt met fin au tour de l'objet ; le tour ne suit que le
doigt qui l'a commencé.

**Raison.** Au téléphone, le trou fait 11 px de rayon à 320 × 568 et 25 à
30 px vers 390 px de large : on ne le voyait plus de près. Le seul zoom
était le pincement natif de la page, qui agrandit tout, barre et vitre
comprises, et pixellise le canvas au lieu de rapprocher l'objet. Un zoom
écrit redessine à la résolution du canvas et laisse le chrome à sa taille.
Centrer le double toucher sur le trou plutôt que sur le point touché : le
trou est trop petit pour être visé au doigt, et le cadrage l'a déjà posé
dans le ciel libre (D29, D30), loin du chrome ; il y grandit sans bouger.
Accepter les planètes sous les doigts : au téléphone, leurs cibles de 44 px
entourent un trou de 11 à 30 px de rayon, et un pincement naturel sur
l'objet en touche presque toujours une ; exiger le ciel sous les deux
doigts faisait échouer le zoom là où il sert. Le détail est dans
`raisons/space-scene.md`.

**Écarté.** Garder le pincement natif de la page : il agrandit aussi la
vitre et la barre, et l'objet reste flou. Mettre `touch-action: none` sur
`.scene` : la règle s'étend à tous ses descendants, et la vitre perdait le
zoom natif de son texte (son défilement, Chromium le rend aux conteneurs de
défilement, WebKit sans garantie). Laisser glisser l'objet d'un bord à
l'autre sous un doigt : le facteur ne décale jamais le ciel au-delà du bord
du canvas, et à 1 il n'y a plus de décalage du tout. Un double toucher sur
les autres vues : leur premier toucher tombe sur `.void`, qui remonte d'un
cran. Au bureau, la molette ou le pincement du pavé tactile : rien ne le
demande, et le bureau ne change pas (ni `touch-action`, ni captures).

## 2026-09-26 — Au doigt, les noms évitent le disque ; le ciel libre range la figure et reprend la vitre repliée (D33, étend D29 à D31)

**Décision.** La scène reçoit le format par une entrée, `touch` (vrai aux
formats `phone` et `tablet`), et ne s'en sert que pour les noms de
planètes : caméra arrivée, un nom évite aussi le disque dessiné (l'ellipse
de 2,4 rayons de `drawnDisc`, écrite sur `.stage` en `data-disc-*`) et le
bouton de chaque autre planète. Debout, le gros plan qui poserait son trou
sur le chrome range le trou et sa planète ensemble dans la plus grande pièce
vide au-dessus du bandeau. Avec un ciel libre, la figure allumée de
l'à-propos et son nom s'y rangent, hors du disque. Couchée, la vitre repliée
n'est plus que sa barre ; la scène la lit comme un bandeau au coin
(`cornerBandTop`) et reprend toute la largeur au-dessus.

**Raison.** Sur les captures du téléphone et de la tablette, des noms
traversaient le disque ou une autre planète, le trou de l'aperçu passait
sous le titre, la figure allumée sortait de l'écran ou passait sous la
barre, et la vitre repliée couchée laissait la moitié droite vide. Le détail
est dans `raisons/space-scene.md` et `raisons/bureau-et-pages.md`.

**Écarté.** La même règle des noms au bureau : neuf empreintes bougeaient
(D30 et D31 les gardent). Lire le format dans le moteur : il le reçoit comme
`reduced`, et le cadrage, lui, ne le lit toujours pas (D30). Élargir
`isBottomBand` à la barre repliée : l'approche centrerait la planète et
pousserait le trou à gauche, et l'approche debout aurait changé.

## 2026-09-26 — Au téléphone, le pied de la vitre reste à l'écran et la vitre couchée serre son chrome (D34, amende D25 et D27)

**Décision.** Debout, la vitre prend la hauteur de son contenu, entre le
reste sous `.lead` et la hauteur montée : courte, elle se pose en bas,
son pied à l'écran. Couchée, la barre de titre perd son retrait
vertical, le pied le réduit à `--s1` et ne met plus d'écart entre ses deux
lignes : trois jetons de `_tokens.scss` (`--window-bar-padding`,
`--window-footer-padding`, `--window-footer-gap`) changent de valeur par
format. Avec une entrée au dock, la page trace un filet `--line` au bas de
la vitre, juste au-dessus du dock. Au téléphone, l'index coupe ses mots
(césure, puis n'importe où) et resserre ses colonnes.

**Raison.** Sur les captures, le lien de la 404 tombait sous l'écran,
la vitre couchée ne montrait qu'une ligne de corps à 568 × 320, rien ne
séparait la vitre du dock, et les colonnes de l'index se chevauchaient.
Des jetons par format plutôt qu'un bloc de plus dans la fenêtre : son
style est au plafond de 4 kB.

**Écarté.** Un pied collé au bas visible : vitre basse, il couvrait la
seule rangée de l'index qu'on voyait à 320 × 568. Faire défiler la barre d'outils avec le corps, couchée : le
corps n'est plus le seul à défiler, et `remember-scroll` perd son élément.
Une vitre qui arrive plus haut quand son contenu tient : le CSS ne sait pas
comparer un contenu à une part d'écran, et les longues vitres doivent
arriver à 60 %.

## 2026-09-26 — Au téléphone, le trou noir est le sujet ; les noms se font rares (D35, étend D33, amende D29 à D31)

**Décision.** C'est la décision de l'opérateur, après avoir regardé le site
sur un écran de téléphone : « ça fait petit et chargé ». Au format `phone`
seulement, debout comme couché, le moteur reçoit le format par une nouvelle
entrée (`format`, qui remplace `touch` ; `touch` s'en déduit), et le cadrage
le lit pour cette présentation seule : la tablette et le bureau gardent
leurs cadrages. Chaque vue (accueil, aperçu, index, fiche, à-propos,
introuvable) part de son cadrage d'aujourd'hui et fait grandir le trou
jusqu'à deux fois son rayon, tant que son disque dessiné tient dans une
pièce vide du ciel, à 12 px du chrome, de la vitre et des bords ; il ne
devient jamais plus petit qu'aujourd'hui, sauf le gros plan de l'aperçu
(`hole-focus.rules.ts`). Les orbites se règlent sur ce trou agrandi, pas
plus près que 3,2 rayons pour la plus proche ni 4,8 pour la plus lointaine,
et peuvent sortir de l'écran. Seule la planète qui compte est nommée : au
repos de l'accueil, aucune, puis celle qu'un premier toucher désigne ;
l'aperçu, la sienne ; la fiche, la sienne, couchée aussi ; l'index, la
rangée choisie. Cette planète et la place de son nom entrent dans le
cadrage : le trou, la planète et son nom tiennent ensemble dans le ciel, et
l'objet tourne pour l'y amener s'il le faut. La scène écrit où la planète
visée est dessinée (`data-target-x`, `data-target-y`).

**Raison.** Le trou faisait 11 px de rayon à 320 × 568 et 25 px à
390 × 844 sur l'accueil, entouré de quatre noms. Mesurés au repos, en
mouvement réduit, avant puis après (en px) :

| Taille    | accueil     | index       | fiche       | à-propos    | introuvable |
| --------- | ----------- | ----------- | ----------- | ----------- | ----------- |
| 320 × 568 | 11,2 → 22,4 | 29,1 → 58,2 | 25,8 → 51,7 | 33,0 → 62,3 | 29,1 → 58,2 |
| 360 × 780 | 22,9 → 45,8 | 32,7 → 65,5 | 29,1 → 58,1 | 37,1 → 74,2 | 32,7 → 65,5 |
| 390 × 844 | 24,8 → 49,6 | 35,5 → 70,9 | 31,5 → 63,0 | 40,2 → 80,4 | 35,5 → 70,9 |
| 568 × 320 | 18,8 → 37,6 | 13,1 → 26,1 | 45,9 → 46,9 | 19,3 → 38,7 | 13,1 → 26,1 |
| 640 × 360 | 20,7 → 41,5 | 18,5 → 37,1 | 51,7 → 62,3 | 23,1 → 46,1 | 18,5 → 37,1 |
| 844 × 390 | 29,2 → 58,5 | 26,6 → 53,2 | 54,2 → 77,3 | 25,9 → 51,7 | 26,6 → 53,2 |

La fiche couchée bute sur le disque qui tient à gauche de la vitre (568 et
640 de large), ou sur la planète et son nom qui doivent tenir avec lui
(844 de large, 77 px au lieu de 85). Les règles du gros plan couché
(`holeRoomBeside`, D31) et debout (`closeUpClearOfChrome`, D33) ne servaient
qu'au téléphone : elles sont retirées. Le détail est dans
`raisons/space-scene.md`.

**Écarté.** Un aperçu couché aussi grand qu'aujourd'hui : sous le titre, le
ciel n'a pas la place du trou avec sa planète et son nom (le trou passe de
33 à 18 px de rayon à 568 × 320, de 45 à 22 à 640 × 360, de 62 à 55 à
844 × 390) ; aujourd'hui il passait sous le titre et la planète n'était pas
visible. Garder les orbites d'aujourd'hui en rayons : autour d'un trou de
50 px à 390 × 844, de 4,1 à 6,9 rayons, elles passaient à 200 à 340 px du
centre, sur un écran de 390 px. Les garder en pixels : à 320 × 568, la
planète de l'aperçu passait à moins de 2,9 rayons du disque, à tous les
angles. Ne pas faire tourner
l'objet au premier toucher : la planète au bord de l'écran, contre le
disque, n'avait nulle part où écrire son nom. Relever le seuil du bundle :
il reste sous 520 kB (519,2 kB).

## 2026-09-27 — Au doigt, la scène dessine à 60 i/s au plus ; au téléphone, moins de pixels et de grains (D36)

**Décision.** Aux formats `phone` et `tablet`, la boucle de la scène ne
dessine jamais deux images à moins de 10,5 ms d'intervalle : un écran à
120 Hz reçoit une image sur deux, soit 60 ; un écran à 60 ou 90 Hz n'est pas
touché. Le pas de temps couvre l'intervalle entier, rien ne ralentit. Au
format `phone` seulement, le canvas plafonne à un ratio de pixels de 1,5 (au
lieu de 2), la part de grains allumée vaut 0,6 fois celle du bureau à tous
les instants (même tirage, même allumage progressif), le ciel garde le
nombre d'étoiles qu'il aurait à un ratio de 2, et les traînées de la
traversée sont regroupées par teinte, par palier d'éclat et par palier
d'épaisseur, chaque groupe tracé en un seul `stroke` : la tête à l'éclat
plein, la queue à la moitié, au lieu d'un dégradé par traînée. Une traînée
prend le palier le plus proche vers le haut : groupée, elle n'est jamais
plus pâle que la même traînée en dégradé au milieu de sa tête ou de sa
queue. Vitre basse, le
ciel au-dessus d'elle (`.lead`) ne porte plus de filtre (`none`) ; le flou et
l'assombrissement apparaissent en montant, jusqu'à la même valeur
qu'aujourd'hui. Le filtre reste `none` sur le premier millième de la montée
(moins d'un pixel de défilement) : interpolé depuis `none`, il peut valoir
`blur(0px) brightness(1)` au départ et poser quand même une couche. Le
bureau ne change pas.

**Raison.** Sur un Android à 120 Hz (Galaxy S21 Ultra), le carton
d'ouverture et la scène ramaient. Mesuré : la boucle dessinait à chaque
`requestAnimationFrame`, donc 120 fois par seconde ; vitre ouverte, deux
`backdrop-filter` couvraient l'écran au-dessus d'un canvas qui change à
chaque image, dont celui de `.lead` (`blur(0px) brightness(1)`) même vitre
basse ; le plancher de densité (0,42) faisait dessiner au téléphone environ
3 400 grains par image, les trois quarts de ceux du bureau dans un disque
bien plus petit ; à dpr 2, les deux canvas passaient de 384 × 854 à
768 × 1708 ; la traversée créait un `createLinearGradient` et un `stroke`
par traînée à chaque image.

**Écarté.** Baisser le nombre d'étoiles : 182 à cette taille, ce n'est pas
lui. Plafonner le bureau à 60 i/s : ses écrans rapides n'en ont pas besoin.
Retirer le flou de la vitre : D28 l'a réglé pour le contraste. Compter les
étoiles au ratio du canvas : à 1,5, le téléphone en perdait un quart. Des
paliers arrondis au plus proche, une queue à 0,4 : mesurée sur captures
pendant la traversée (390 × 844, dpr 3, de 4,8 à 6,8 s), l'énergie des
traînées au-dessus du fond tombait d'environ moitié.

**Budget.** Le bundle initial passe de 519,2 à 520,5 kB : le seuil
d'avertissement monte de 520 à 530 kB (`angular.json`), à la demande de
l'opérateur ; le seuil d'erreur (1 MB) ne bouge pas. La comparaison de deux
listes de nœuds s'écrit une seule fois (`planets/same-nodes.rules.ts`).

## 2026-09-27 — Au téléphone, la vitre se tire, et on balaie d'un chapitre à l'autre (D37, étend D25)

**Décision.** Au format `phone`, la barre de titre de la vitre porte une
poignée décorative (32 × 3 px, `--line`), dessinée par son fond (le jeton
`--glass-handle`), sans élément de plus ni changement de hauteur. Vitre
ouverte et basse (conteneur à son début, ou couchée), un glisser vers le bas
qui part de la barre (hors de ses boutons), ou du corps quand il est en haut
de son contenu, la replie à 64 px, ou lâché à plus de 0,6 px/ms ; pendant le
glisser, la vitre suit le doigt par une translation écrite dans le DOM, et
revient à sa place lâchée sous le seuil. Repliée, un glisser vers le haut de
48 px, un lâcher à plus de 0,6 px/ms, ou un toucher simple de sa barre la
rouvre. Un glisser horizontal qui part de la barre d'outils ou du corps, à
56 px ou lâché à plus de 0,5 px/ms, et plus de 1,5 fois plus large que haut,
émet `swiped` (`next` vers la gauche) : la fiche change de chapitre, l'à-propos
de volet, l'aperçu de vedette, par la même sortie que leur segmenté, bornée
aux deux bouts. Un balayage qui part d'un élément qui défile lui-même à
l'horizontale lui appartient. Le geste se décide par une règle pure
(`glassIntentOf`, `glassGestureOf`) ; la directive ne retient le toucher
(`touchmove` annulé) que tant que le geste est à elle, et un second doigt
l'abandonne. Au-delà de 6 px, ou avec un second doigt, le clic qui suit est
avalé, par la même directive. Sous `prefers-reduced-motion`, les gestes
restent, sans suivi ni retour animé. La tâche 8 du cadrage
(`docs/workstreams/mobile-tablette/TACHES.md`) est faite ici.

**Raison.** Sur un vrai téléphone, l'opérateur voulait ouvrir et fermer les
vitres du doigt, en plus du bouton « – / + », et passer d'un chapitre à
l'autre sans viser le segmenté. Le modèle est celui des feuilles de Plans et
de Musique : la feuille suit le doigt, et le lâcher décide, selon la distance
ou la vitesse. Le détail est dans `raisons/core-et-interface.md`.

**Écarté.** Un glisser écrit à la main pour monter la vitre : le défilement
natif le fait, avec son élan (D25), et il ne change pas. L'accroche CSS
(`scroll-snap`) : elle choisit la butée la plus proche (D25). Le balayage à
la tablette : elle garde les gestes du bureau, la barre y déplace la fenêtre.
Placer la règle dans `shared/windows/rules/` : le contrôle de structure
n'ouvre pas ce rôle à la bibliothèque des fenêtres ; elle vit dans le fichier
de sa directive, comme les petites règles des autres directives. Une
poignée en élément ou en pseudo-élément : ses règles faisaient dépasser à la
feuille de la fenêtre son budget de 4 kB ; le fond ne suit pas `--radius`
(3 px de haut, l'arrondi ne se voit pas). Une directive à part pour avaler
le clic : elle doublait l'écoute des pointeurs et le poids du bundle.

## 2026-09-27 — Au téléphone debout, l'accueil dit un nom à la fois, et les pages passent en onglets en bas (D38, amende D27 et D35)

**Décision.** Au format `phone` en portrait seulement, la navigation
(`app-main-nav`) quitte la barre du haut et devient une barre d'onglets
fixe en bas, pleine largeur, trois onglets égaux de 44 px au moins, plus
`env(safe-area-inset-bottom)`, sur `--paper` sans `backdrop-filter`, un
filet `--line` en haut ; l'onglet actif garde sa face allumée et porte un
repère d'accent de 2 px en haut. Le lien de langue et le « @ » restent en
haut. Le jeton `--tabs-reserve` (nul hors du portrait) relève tout ce qui se
posait en bas : la vitre basse, repliée ou montée, l'aperçu, le dock et son
filet, la règle des vedettes. L'élément ne bouge pas dans le DOM : tout est
CSS, et `app-main-nav` s'inscrit à la scène comme ancre `chrome`, sans
boîte hors du portrait (`display: contents`), donc ignorée ailleurs. Sous
l'objet, la règle ne montre plus qu'une rangée : « ‹ », le titre de la
vedette désignée, « › », puis « Tous les projets → ». La vedette désignée
est celle que lit déjà la ligne de lecture : la survolée (`hovered`), sinon
la dernière ouverte en aperçu, sinon la première. « ‹ », « › » et un
balayage de la rangée (48 px au moins, plus de 1,5 fois plus large que
haut) la changent par le même `hovered`, bornés aux deux bouts
(`featured-pick.rules.ts`) ; toucher le titre ouvre l'aperçu. La scène
allume la planète désignée, dès le repos et même quand elle vient du repli
(`restingPickOf`, passée à la scène par la page), et l'amène dans le ciel
(D35) mais n'écrit plus
son nom sur le ciel : la rangée le porte (`labels: 'none'` sur l'accueil
sans aperçu). Couché, à la tablette et au bureau, rien ne change.

**Raison.** C'est le choix de l'opérateur, après un essai sur un vrai
téléphone : l'accueil « a trop d'infos, la règle et ce qu'il y a écrit font
trop UI de desktop » ; il choisit « un nom à la fois » et « la barre de
pages en bas, en onglets, à portée du pouce ». La navigation au pouce vient
du modèle des applications (Plans, Musique) : la navigation en bas, la
feuille au-dessus.

**Écarté.** La règle entière au doigt, numéros sans nom : c'est elle que
l'opérateur trouvait trop chargée. La barre d'onglets couchée : sur 320 à
390 px de haut, elle prendrait la place de la vitre. Un `backdrop-filter`
sur la barre : un coût à chaque image au-dessus du canvas (D36). Cacher le
nom de la planète par une feuille globale : le trait qui le relie à sa
planète est dessiné dans le canvas et restait seul sur le ciel.

**Budget.** Le bundle initial passe de 525,1 à 529,9 kB, sous le seuil
d'avertissement de 530 kB, qui ne bouge pas.

## 2026-09-27 — Le code propre au téléphone se charge à part (D39, amende D37)

**Décision.** Deux morceaux ne servent qu'au format `phone` et sortent du
bundle initial : le geste de la vitre (D37), et le cadrage qui fait du trou
noir le sujet (`hole-focus.rules.ts`, D35). `PhoneCodeService`
(`core/services/device/`) les charge par `import()` dès que le format vaut
`phone`, au démarrage du client ou au passage à `phone`, une seule fois,
jamais à la tablette, au bureau ni au serveur.

- La vitre : `GlassGesturesDirective` reste dans le bundle initial, réduite
  à ses entrées, sa sortie et ses écoutes. Le suivi du toucher devient
  `GlassGestureTracker` (`shared/windows/trackers/`), la règle pure
  `glass-gesture.rules.ts` (`shared/windows/rules/`), avec ses specs. Le
  bureau demande ce code à son démarrage, car au téléphone l'accueil n'a
  pas de vitre et la première s'ouvre d'un toucher. Si un geste commence
  avant que le code soit là, la directive retient chaque événement du
  pointeur, au téléphone seulement, et les rejoue dans l'ordre à son
  arrivée : le geste compte, le clic qui suit un glisser est avalé. Seul ce
  qui ne se rattrape pas lui échappe : le `touchmove` n'a pas pu être
  retenu, le défilement natif a pu commencer.
- La scène : `SpaceSceneComponent` demande la règle et la donne à l'engine
  avec ses entrées (`SceneInputs.holeFocus`). Tant qu'elle n'est pas là, la
  scène cadre comme sans elle ; à son arrivée, la cible de la caméra change
  et la caméra y va par son amorti ordinaire, sans saut. Les bancs de l'engine la donnent avant la
  première image : les goldens, téléphone compris, ne bougent pas.
- Le rôle `.tracker` (`trackers/`) s'ouvre à `shared/windows`, avec `rules/`
  (`organisation.md` §3.2 à §3.4, `check-structure.mjs`) : D37 avait écarté
  `rules/` faute de ce rôle.

**Raison.** Le bundle initial était à 529,92 kB, pour un avertissement à
530 kB. L'opérateur a choisi de sortir le code propre au téléphone plutôt
que de relever le seuil. Mesuré en retirant chaque candidat : le geste de la
vitre pesait 3,71 kB, le balayage de la rangée des vedettes (D38) 0,53 kB,
`hole-focus.rules.ts` 2,85 kB. Après : 524,64 kB d'initial, et deux
morceaux paresseux, `glass-gesture-tracker` (3,21 kB) et `hole-focus-rules`
(3,07 kB).

**Écarté.** Relever le seuil : c'est ce que l'opérateur a refusé. `@defer` :
il ne diffère qu'un bloc de gabarit, dont le contenu manque au prérendu, et
la directive de la vitre est posée sur la section de la fenêtre, qu'il
faudrait doubler. Retirer les comètes : elles sont de la scène à tous les
formats. Le balayage de la rangée des vedettes : 0,53 kB, dont l'enveloppe
et le rejeu reprendraient presque tout. Le dock (D27) : son élément est
dans le HTML prérendu à tous les formats. Les traînées groupées du
téléphone (`trail-batch.renderer.ts`, `trail-steps.rules.ts`, D36) : elles
dessinent la traversée dès les premières images ; arrivées après, elles
laisseraient ces images au dégradé par traînée, le coût que D36 a retiré.
`free-sky.rules.ts` sert aussi à la tablette debout (D29), et
`zoom-gesture.directive.ts` à la tablette (D32) : ils restent.

**Budget.** Le bundle initial passe de 529,9 à 524,6 kB ; le seuil
d'avertissement reste à 530 kB.

## 2026-09-27 — Au téléphone, le relevé est une liste de cartes (D40, amende D34)

**Décision.** Au format `phone`, debout et couché, le relevé n'affiche plus
l'en-tête des colonnes et chaque rangée devient une carte pleine largeur :
le numéro et le titre (avec « lu ») sur la première ligne, la preuve sur
toute la largeur en dessous. La pile et le rôle ne se montrent qu'à la
carte ouverte, sous la preuve, avant le bloc ouvert, qui perd sa colonne
vide et s'aligne sur la preuve. Toucher la carte est le `toggle` du bureau,
avec la même sélection et les mêmes états. Le gabarit ne change pas : la
disposition est dans la feuille du composant (`display: contents` sur le
bloc du projet, `order` pour mettre la pile sous la preuve). La coupure des
mots que D34 posait sur le relevé du téléphone est retirée. C'est la
tâche 9 du cadrage.

**Raison.** À 390 px, le tableau de quatre colonnes coupait ses mots
(« En dévelop-pement ») et serrait le plus la preuve, qui est la colonne à
lire d'abord. Sur une seule colonne, les mots des faits tiennent entiers,
et la coupure n'a plus de raison d'être. Rester dans le même composant
évite d'avoir deux relevés à tenir d'accord ; la feuille suffit, parce que
la rangée porte déjà tous ses faits.

**Écarté.** Un gabarit par format (un `@if` sur le format) : le prérendu
ne connaît pas le format, et deux gabarits divergeraient. Déplacer la pile
après la preuve dans le gabarit : au bureau, elle se lit sous le titre,
dans la colonne du projet. Garder la preuve dans une colonne étroite à
côté du titre : c'est ce qui la coupait.

## 2026-09-27 — La traversée et la carte sont l'arrivée par l'accueil (D41)

**Décision.** La carte d'ouverture et la traversée ne se jouent qu'à
l'arrivée sur l'accueil. Ouvrir une autre vue (relevé, fiche, à-propos,
introuvable, dans les deux langues, au premier chargement comme au
rechargement) ne monte pas la carte, ni au prérendu ni au client, et la
scène s'ouvre posée : ciel à plat, objet à sa taille et au cadrage de la
vue dès la première image, matière en fondu de 0,6 s. Sur l'accueil,
passer la carte au premier geste termine vite la traversée : ce qui en
reste se joue en 0,9 s au plus, par son horloge accélérée, sans changer
ses courbes, puis la scène reprend son régime. Un seul signal décide pour
la scène, l'arrivée de l'interface (`revealed`, porté par `landed` dans la
direction) : vrai à l'ouverture, pas de traversée ; devenu vrai pendant la
traversée, elle finit vite. Le bureau lit la vue dans l'adresse chargée
avant son premier rendu, pour que ce signal soit juste dès la première
image du client.

**Raison.** Le retour de l'opérateur, sur un vrai téléphone : passer la
carte laissait l'animation jouer sous l'interface, et un rechargement sur
une autre vue que l'accueil montrait la carte et la traversée sous cette
vue. La traversée est l'arrivée au site par son accueil ; elle n'a pas de
sens sous une vue qu'on ouvre par un lien. Finir vite plutôt que couper :
une coupe fait passer l'objet d'un point à sa taille pleine en une image.

**Écarté.** Couper la traversée net au premier geste. Garder la carte sur
toutes les vues. Rejouer la traversée à chaque retour sur l'accueil.

## 2026-09-27 — À l'à-propos, les quatre figures se voient, se rangent au téléphone et se touchent (D42, étend D33)

**Décision.** Dans la vue à-propos seulement, une figure non allumée se trace
à 45 % d'éclat (20 % avant) et ses étoiles sont 25 % plus grosses ; l'allumée
ne change pas, et toutes restent coupées par l'ombre. Hors de l'à-propos, le
fondu de sortie repart des 20 % d'avant. Au format `phone`, debout et
couché, les trois figures non allumées se rangent dans le ciel libre autour
de l'allumée et de son nom, que D33 place comme avant : entières, écartées
de 10 px l'une de l'autre, hors de l'ombre du trou quand le ciel le permet,
hors du disque de préférence, au plus près de leur place d'origine, à une
échelle commune qui descend par crans de 1 à 0,42 seulement s'il le faut.
Une disposition se calcule par figure allumée, une fois par ciel (taille,
ciel libre, trou avant le zoom) ; à chaque image, la place d'une figure est
la moyenne de ces dispositions pesée par l'allumage : au changement de
volet, elles glissent au rythme de la caméra. Au téléphone, les figures ne
dérivent plus et ne suivent plus la parallaxe : le rangement tient sans se
refaire. Ce code rejoint le morceau paresseux du téléphone (D39). À tous les
formats, un `<button>` par figure, nommé par son volet, couvre la boîte de
la figure (44 × 44 px au moins), positionné par `transform` depuis le tracé ;
hors de l'à-propos, hors écran ou sous une vitre, il est inerte, hors
tabulation et `aria-hidden`. La cible vit sur `.stage` (z-index 1), au-dessus
du canvas du ciel qui prend le doigt (0, D32) et de `.void` (`--z-scene`,
0), comme les boutons de planète. La figure allumée garde sa cible active :
la toucher rechoisit son volet, sans effet, et une cible qui s'éteindrait à
chaque choix changerait l'ordre de tabulation sous le doigt. Le toucher ou le clic choisit le volet par
`chooseSection`, comme le segmenté ; un glisser de plus de 6 px n'est pas un
clic ; un doigt posé dessus peut commencer un pincement (D32) et deux
touchers n'y font pas un double toucher du ciel. Au bureau, sous le
pointeur, une figure non allumée monte à 70 % et le curseur devient une
main (`@media (hover: hover)`). La boucle ne s'arrête plus avant la fin du
fondu des figures, même en pause.

**Raison.** Le retour de l'opérateur, au bureau et au téléphone : « pour
l'à-propos, les constellations doivent plus se voir non sélectionnées
(revoir aussi leur position en mobile) et qu'elles ouvrent le bon menu si on
clique dessus ». À 20 %, les trois figures non allumées ne se lisaient
plus ; au téléphone debout, seule l'allumée tenait dans le ciel libre, les
autres tombaient sous la vitre. `objet-canvas.md` §7 : « un ciel dont trois
figures disparaissent n'est plus un ciel ». Dans Stellarium et Star Walk,
toucher une figure la désigne ; le segmenté reste le chemin au clavier.

**Écarté.** Ranger aussi la figure allumée : D33 la place, et le contrat la
garde. Refaire le rangement à chaque image, ou sur le trou agrandi par le
pincement : les figures se réorganisaient sous les doigts. Suivre le survol
par `pointerenter` : le moteur suit déjà le pointeur, et les écouteurs
pesaient dans le bundle initial. Ranger la tablette et le bureau : leurs
positions tiennent.

**Budget.** Le bundle initial passe de 526,2 à 529,9 kB (seuil
d'avertissement à 530 kB) : les cibles et leur écriture servent à tous les
formats et restent dans l'initial ; le rangement (4,7 kB) est dans
`hole-focus-rules`, qui passe de 3,1 à 6,6 kB.

## 2026-09-27 — Au bureau, la molette rapproche et le clic molette déplace la caméra (D43, étend D32, amende D39)

**Décision.** Au format `desktop`, sur le ciel (le canvas, `.void`, un
bouton de planète ou de figure), la molette rapproche ou éloigne la caméra
autour du point sous le pointeur, avec le facteur borné à [1, 3] du
pincement (D32) : un cran vaut × 1,1 (100 px, 3 lignes ou une page), un
petit delta de pavé tactile zoome d'autant moins, et `ctrl` + molette, le
pincement du pavé, fait pareil sans agrandir la page. Le bouton du milieu
maintenu sur le ciel déplace la caméra : le dessin suit le pointeur, borné
pour que le centre du trou reste dans le canvas ; relâcher garde le
décalage. Le décalage se pose après le facteur, et la molette zoome autour
du point vu sous le pointeur. Sur une fenêtre, le châssis, un lien ou un
champ, la molette et le bouton du milieu gardent leur effet natif ;
`preventDefault` (la molette, et le `mousedown` du bouton du milieu, qui
lance l'autodéfilement) ne vaut que sur le ciel. Un clic
molette sans glisser ne fait rien. Le facteur et le décalage reviennent à 1
et 0, avec l'amorti de la caméra, à chaque changement de cadrage et de
taille du canvas ; sous `prefers-reduced-motion`, sans amorti. À décalage
nul, l'image est celle d'avant : les goldens ne bougent pas.

- Le chargeur du téléphone se généralise : `PhoneCodeService` devient
  `FormatCodeService`, `load(formats, importer)`, qui charge dès que le
  format est l'un de `formats`. Il ne charge jamais au serveur, qui répond
  `desktop` (le spec de `FormatCodeService` le tient).
- Les gestes du ciel se chargent à part, par format. Au doigt (`phone`,
  `tablet`), le pincement et le double toucher de D32 : la directive
  `zoom-gesture` devient `ZoomGestureTracker`
  (`shared/space-scene/trackers/`, rôle ouvert à la scène). Au bureau, la
  molette et le clic molette : `SkyLookTracker`, `SkyPanMotion` et
  `sky-look.rules.ts` (`rules/gestures/`, avec `sky-touch.rules.ts`). Le
  morceau du doigt n'est jamais demandé au bureau ni au serveur, celui du
  bureau jamais au doigt. Une fois leur code là, les gestes de D32 font ce
  qu'ils faisaient : pincement borné, double toucher de l'accueil, un doigt
  sur une planète ou une figure peut commencer un pincement, clic avalé
  après un pincement, remise à 1.
- Au premier rendu reste une seule enveloppe : un effet de
  `SpaceSceneComponent` démarre, par `SceneLookService`, le tracker du
  format courant quand l'engine et son code sont là, l'arrête au changement
  de format et à la destruction, et donne le décalage du bureau à l'engine
  avec ses entrées (`SceneInputs.pan`) ; l'engine le pose par le crochet
  `ZoomMotion.pan`. Un pincement, un double toucher, un tour de molette ou
  un clic molette fait avant l'arrivée de son code est perdu : il n'est ni
  retenu ni rejoué, et l'autodéfilement du bouton du milieu peut encore
  partir. Chaque code est demandé au démarrage du client, ou au passage à
  l'un de ses formats. Si le format quitte `desktop`, le décalage est rendu.
- D39 est amendée : elle gardait `zoom-gesture.directive.ts` dans le bundle
  initial, parce que la tablette s'en sert ; il se charge maintenant avec
  la tablette et le téléphone.

**Raison.** La demande de l'opérateur : « sur desktop, avec la molette,
faire comme le zoom sur mobile si c'est possible, et pouvoir bouger la
caméra avec le clic molette ». Elle étend le bureau, que le cadrage
d'origine figeait. D32 écartait la molette parce que « rien ne le
demande » : c'est maintenant demandé. Le code du bureau seul ne tenait pas
sous le seuil : son enveloppe et son crochet dans l'initial pesaient plus
que les 90 octets qui restaient (530,52 kB mesurés). L'opérateur a choisi
de charger aussi à part le pincement plutôt que de relever le seuil. Même
argument que pour la molette : c'est un geste d'exploration, pas une
commande, et un regard perdu avant l'arrivée du code se refait.

**Écarté.** Faire défiler la page : elle ne défile pas. Un bouton de zoom
visible : il ajouterait une place au châssis. Relever le seuil du bundle :
c'est ce que l'opérateur a refusé. Retenir et rejouer les événements comme
la vitre (D39) : l'enveloppe pèserait presque autant que le geste, et un
regard perdu se refait.

**Budget.** Le bundle initial passe de 529,91 à 528,73 kB ; le seuil
d'avertissement reste à 530 kB. Deux morceaux paresseux s'ajoutent :
`zoom-gesture-tracker` (2,09 kB), demandé au téléphone et à la tablette,
et `sky-look-tracker` (1,97 kB), demandé au bureau. `sky-touch.rules.ts`,
que la directive du tour de l'objet partage avec les deux, sort dans un
petit morceau initial de 315 octets, compté dans ces 528,73 kB.

## 2026-09-28 — Au téléphone, le cadrage du trou garde ce que la planète n'a pas changé (D44, étend D35)

**Décision.** Au format `phone`, le cadrage qui fait du trou noir le sujet
(`hole-focus.rules.ts`, D35) se calcule toujours à chaque image, mais garde
d'une image à l'autre ce qui n'a pas bougé. Des quatorze angles essayés, les
treize angles fixes placent la planète au même endroit de l'écran à tout
moment de son orbite : leurs rayons tenus, pour chaque place du nom et
chaque pièce du ciel, sont repris tant que la taille du canvas, les pièces,
l'inclinaison, la taille du nom, le rayon du trou et la place de la planète
à cet angle ne bougent pas de plus d'un millième de pixel. Seul l'angle
d'aujourd'hui, où la planète est vue, se replace à chaque image quand elle
tourne. Les distances des pièces au trou, qui ne servent qu'à départager,
se recalculent à part, à chaque image. Le choix entre les places se refait
entier, dans le même ordre : une ligne qui ne peut plus gagner est sautée,
et le test du nom sur le disque n'a lieu que pour une place qui gagnerait.
La règle rend le cadrage et ce qu'elle garde (`FocusMemo`) ; la scène le lui
rend à l'image suivante (`FramingScene.focusMemo`). La géométrie des
groupes et des angles passe dans `rules/focus/focus-choices.rules.ts`, ce
qui se garde et le choix dans `rules/focus/focus-rows.rules.ts` ; seul
`hole-focus.rules.ts` les importe, ils restent dans son morceau paresseux.
La caméra, son amorti et les goldens ne changent pas.

**Raison.** Mesuré sur le build de production, Chromium à 384 × 854, dpr 3,
processeur ralenti × 4, sur 3 s au repos (JS des rappels
`requestAnimationFrame`, moyenne par image) :

| Vue                       | avant   | après  |
| ------------------------- | ------- | ------ |
| accueil au repos, vedette | 9,6 ms  | 6,1 ms |
| aperçu                    | 7,4 ms  | 5,7 ms |
| fiche                     | 5,75 ms | 5,6 ms |

Le plancher, la même recherche sans planète visée comme avant D38, est à
5,5 ms. Le ciel du téléphone compte 123 pièces à l'accueil : la recherche
plaçait jusqu'à 84 groupes dans chacune, à chaque image. Le trou relevé
(`data-hole-x`, `data-hole-y`, `data-hole-radius`) est le même qu'avant, et
un spec suit une orbite entière, trou en dérive, contre une recherche neuve
à chaque pas : l'écart reste sous 0,01 px, même quand le cadrage change
d'angle. Le morceau `hole-focus-rules` passe de 6,65 à 8,32 kB, le bundle
initial de 528,73 à 528,81 kB.

**Écarté.** Garder la place choisie tant que la planète ne s'est pas
déplacée d'un pixel, ou refaire la recherche à un rythme plus lent : au
moment où le meilleur angle change, le cadrage attendait le prochain
recalcul ; le long d'une orbite, la cible s'écartait alors de 114 px de
celle d'une recherche neuve. Garder aussi la place du trou dans ce qui doit
rester égal : au repos, elle dérive d'environ 0,03 px par image, et rien
n'était jamais repris. Précalculer le test du nom pour toutes les places :
à 123 pièces, l'image montait à 40 ms.

## 2026-09-28 — Cinq reprises sur captures : la vitre basse des petits téléphones, le relevé selon sa place, le titre, les segmentés de la tablette, l'accueil couché (D45, amende D27, D28, D34, D38 et D40)

**Décision.** Au téléphone debout, quand l'écran fait 640 px de haut ou
moins (`short-phone-portrait`), la vitre basse arrive à mi-hauteur
(`--glass-lowered: 0.5` au lieu de 0,6), l'aperçu monte jusqu'à la moitié
de l'écran (au lieu de 45 %), la barre de titre et le pied prennent les
jetons serrés du téléphone couché (D34), et la fiche et l'aperçu
resserrent l'intérieur de leur corps (retrait du haut à `--s2` ou `--s1`,
écarts du chapitre et de l'en-tête d'un cran). Couchée, le pied de la
fiche tient sur une ligne : la position s'y tronque, « Suite : … → »
reste entier. Le relevé passe en cartes (D40) quand sa vitre fait moins
de 500 px de large, par une requête de conteneur sur l'emplacement du
relevé, quel que soit le format ; plus large, le tableau. Au téléphone,
le titre de l'accueil laisse à droite la marge qu'il a à gauche et
équilibre ses lignes (`text-wrap: balance`). Les segmentés tiennent sur
une ligne à la tablette comme au téléphone (D28) : la règle vaut pour
tout ce qui n'est pas le bureau (`handheld`). Au téléphone couché aussi,
l'accueil dit un nom à la fois (D38) : la rangée « ‹ nom › » et « Tous
les projets → » prend la place de la règle, dans la moitié droite, et la
scène n'écrit plus le nom de la planète désignée sur le ciel ; la scène
le décide sur le format seul, plus sur l'orientation. La requête
`phone-portrait` se réduit à `(width < 620px) and (orientation:
portrait)`, qui lui est équivalente : debout, une hauteur sous 500 px
donne une largeur sous 620 px.

**Raison.** La relecture extérieure des captures, en mouvement réduit,
sous Chromium et WebKit. À 320 × 568, la vitre basse ne montrait que le
haut d'une ligne sur l'aperçu et rien sous le titre de la fiche au
chapitre 3 ; mesuré après, deux lignes entières au moins sur les deux,
dans les deux moteurs, à 320 × 568 et 360 × 640. En dessous de 0,5, la
caméra ne tient plus le trou dans le ciel (à 0,48, il passe sous la
vitre) ; l'aperçu à 55 % le perd aussi. Couché à 568 × 320, le pied sur
deux lignes tranchait la première ligne du chapitre 3 ; sur une ligne,
aucune ligne n'est coupée, pour les sept fiches qui ont un chapitre 3.
À la tablette debout, la vitre du relevé fait 459 px et le tableau y
coupait ses mots ; au bureau à 924 × 540, elle en fait 517 et le tableau
y tient : le seuil est entre les deux, pas à 560 px. Le titre touchait le
bord droit sous WebKit à 360 px, et Chromium laissait « et » seul en fin
de ligne à 640 × 360. « ET APRÈS » passait seul sur une seconde rangée
sous WebKit à 820 × 1180.

**Écarté.** Relever la vitre basse à tous les formats : aux écrans plus
hauts, rien ne manquait. Descendre sous 0,5 : le trou sort du ciel. Un
pied collé au bas visible (déjà écarté par D34). Un seuil du relevé à
560 px : le bureau à 924 × 540 passait en cartes. Choisir les cartes par
le format : une vitre étroite à la tablette gardait le tableau. Un fondu
au bas du corps couché : il cache la coupure sans l'ôter. Garder la règle
couchée : l'opérateur a choisi un nom à la fois pour le téléphone.

**Budget.** Le bundle initial passe de 528,81 à 529,39 kB.

## 2026-09-28 — Les navigations ne figent plus la page pour rien (D46)

**Décision.** Quatre correctifs, une PR chacun. Le routeur n'a plus de
View Transition : la page ne change jamais de composant et les fenêtres ont
leur propre entrée. La scène ne remesure plus ses vitres à chaque fin de
transition CSS : les mesures venues d'un événement attendent l'image
suivante et se fusionnent, et une transition qui ne fait que repeindre
(couleur, ombre, `fill`, filtre) n'en demande plus. L'écouteur `touchmove`
non passif n'existe plus que dans le tracker de la vitre du téléphone. La
vitre du téléphone garde sa teinte et son ombre mais perd son flou pendant
que la caméra voyage : la scène lève `data-sky-travel` sur la racine, et le
flou revient en fondu à l'arrivée.

**Raison.** Mesuré sur le build de production, Chrome sans interface à
390 × 844, dpr 3, processeur ralenti × 4, pire image longue
(`long-animation-frame`) dans les 3,5 s qui suivent le clic, moyenne de
trois passages :

| Navigation    | avant  | après  |
| ------------- | ------ | ------ |
| vers Projets  | 121 ms | 110 ms |
| vers la fiche | 103 ms | 83 ms  |
| vers À propos | 111 ms | 77 ms  |
| vers Accueil  | 89 ms  | 82 ms  |

Le critère de la session, aucune image au-delà de 50 ms, n'est pas atteint.
Au repos, le thread principal passe déjà 382 ms sur 500 à dessiner la scène
à × 4 ; une navigation n'ajoute qu'une cinquantaine de millisecondes, mais
elle tombe sur un thread plein. Ce qui reste dans la pire image : la vue que
crée Angular, son style et son layout (forcé par le `focus()` de
`ViewFocusService`, qu'il faudrait faire de toute façon), et le dessin du
ciel de la même image. La suite est de sortir la scène du thread principal.

**Écarté.** N'ajouter l'écouteur `touchmove` qu'au début d'un tirage :
Chrome décide au `touchstart` si la séquence attend la page, et le tirage
casserait. `touch-action: pan-y` sur la zone : le tirage du corps en haut de
son contenu et le défilement du rail ne se disent pas ainsi. Une vitre
opaque sans flou au téléphone : elle change le verre au repos. Ne plus
écrire `scrollTop` sur une fenêtre neuve déjà en haut : le layout forcé
passe simplement au `focus()` qui suit, sans rien gagner.

## 2026-09-28 — La scène se dessine dans un worker (D47, amende D11)

**Décision.** Quand le navigateur sait dessiner hors de la page (`Worker`,
`OffscreenCanvas` et son `transferToImageBitmap`, un canvas
`bitmaprenderer`), `SceneEngineService` lance `scene.worker.ts`, qui fait
tourner `SpaceSceneEngine` tel quel sur deux `OffscreenCanvas`. Le moteur
ne touche plus le DOM qu'à travers `SceneNode`, la petite surface qu'il
écrit (`style.transform`, `opacity`, `pointerEvents`, `cssText`,
`setAttribute`, `tabIndex`) et qu'il lit (la taille des noms). Dans le
worker, des nœuds enregistreurs (`NodeRecorderEngine`) notent ces
écritures ; chaque image dessinée part avec elles, en `ImageBitmap`
transférées, et `RemoteSceneEngine` pose l'image et les écritures dans la
même image de la page. Les noms restent collés à leurs planètes. Les
réponses immédiates dont les gestes ont besoin (la main prend-elle le
disque, était-ce un glisser, le zoom tient-il sur le canvas, peut-on
regarder de plus près) viennent des mêmes règles, appliquées dans la page.
Le décalage du bureau (`SkyPanMotion`) vit dans le worker et revient avec
chaque image. Sinon, l'engine tourne dans la page comme avant, chargé à
part.

**Raison.** Mesuré sur le build de production, Chrome sans interface à
390 × 844, dpr 3, processeur ralenti × 4 : au repos, le thread principal
passait 466 ms sur 500 en tâches, dont 369 ms de script ; il en passe 95,
dont 17 de script. Le bundle initial passe de 529,39 à 476,63 kB : l'engine
n'y est plus, le worker (59,4 kB) et l'engine de secours (50,9 kB) se
chargent à part. Un spec fait dessiner la même scène par les deux chemins,
au même tirage : les ordres de dessin sont les mêmes, un à un, et les
noms, boutons et lignes reçoivent les mêmes styles. Sur les captures au
téléphone et au bureau, rien ne change, et les gestes (tourner le disque,
molette, clic molette, double toucher) donnent le même relevé du trou.

La pire image d'une navigation ne baisse presque pas (64 à 144 ms à × 4) :
c'est la vue que crée Angular, son style et son layout. Ce qui reste est la
fenêtre recréée à chaque vue.

**Écarté.** `transferControlToOffscreen` : le canvas s'afficherait sans la
page, mais les noms, qui sont du DOM, décrocheraient de leurs planètes dès
que la page est occupée. Un worker pour le ciel seul : les étoiles et les
planètes glisseraient l'une contre l'autre pendant un vol.

## 2026-09-28 — La CI se découpe, mesure la couverture, passe par Sonar et déploie son propre build (D48)

**Décision.** Le workflow a cinq jobs. `lint` (format, types des outils,
ESLint et Stylelint, structure, commentaires), `test` (Vitest avec la
couverture, rapport lcov) et `build` (build de production, prérendu et
`check:prerender`, le site gardé comme artefact) tournent en parallèle.
`sonar` lit le rapport de `test` et attend la quality gate de SonarQube
Cloud, qui échoue le job si elle est rouge. `deploy`, sur `main` seulement,
attend `lint`, `build` et `sonar`, prend l'artefact du build, y ajoute ce
que GitHub Pages demande (`404.html`, `.nojekyll`) et le publie. L'adresse
du site devient une variable de build : `SITE_URL` (un `define`, dont
`angular.json` porte le défaut) et `BASE_HREF`, lus dans les variables du
dépôt, avec GitHub Pages pour défaut. Sous couverture, les tests ont 30 s
chacun (`vitest-coverage.config.ts`) : l'instrumentation ralentit les
scènes d'environ trois fois.

**Raison.** Le job `deploy` refaisait un build, avec un autre `base-href`
que celui qui avait été vérifié : ce qui partait n'était pas ce qui avait
passé les contrôles. Un seul job d'un bloc ne disait pas ce qui avait
cassé. Aucune couverture n'était mesurée ; elle est de 98 % des lignes et
94 % des branches. Le jour du nom de domaine et du VPS, seul `deploy`
change, et les deux variables du dépôt.

**Écarté.** Garder les ajouts propres à Pages dans le build : ils
n'auraient aucun sens sur un autre hébergeur. Lighthouse CI : utile, mais
son budget de perf dépend de la session sur les fenêtres, à reprendre
après.

## 2026-09-28 — Les réglages de la scène tiennent dans un fichier (D49)

**Décision.** `models/scene-config.model.ts` porte `SCENE_CONFIG`, typé par
`SceneConfig` et rangé par thème : la matière (densité, réserve, part au
téléphone, entrée, couleurs du disque), le ciel (étoiles, dérive,
parallaxe, portée du curseur, traînées), le canvas (budget de pixels,
densité d'affichage), la caméra (vitesse des orbites, échelle de repos,
zoom), la main (frottement, vitesse, entraînement des orbites), les gestes
(seuil de glisser, appui et double appui, cran de molette), les planètes
(écart) et les figures (cible tactile, noms, lumières). Chaque fichier
garde le nom de sa constante et la lit dans la config. Les trois seuils de
6 px (la main, la figure, l'appui) n'en font plus qu'un,
`gestures.dragPx`.

**Raison.** Ces valeurs se réglaient dans seize fichiers ; on les change
maintenant en un seul, sans chercher. La config est une donnée pure : elle
vit dans le worker (D47) comme dans la page, sans rien à transmettre. Les
valeurs n'ont pas changé : les goldens de la scène passent tels quels.

**Écarté.** Les tolérances de convergence, les valeurs tirées d'autres
valeurs, les sélecteurs et les réglages internes des placements : les
changer casse un invariant, cela ne règle pas un rendu. Une config fournie
à l'exécution (`provideSpaceScene`) : un seul site s'en sert, et il
faudrait la faire passer jusqu'aux règles pures et au worker.

## 2026-09-28 — La page de l'observatoire n'assemble plus que ce qui se croise (D50, amende D11 pour la page)

**Décision.** `ObservatoryPageComponent` garde ce que seule la page peut
faire, parce que cela croise les features : `Project` → `Planet`, la fiche
introuvable, le filtre typé, le projet désigné, le clic sur un corps, et
l'état de départ lu dans l'adresse. Le reste descend là où il appartient.
Le premier plan et le focus de la fenêtre de la vue passent dans
`ViewWindowsService` et `ViewSlotDirective` (`features/observatory`) ; la
navigation et les langues dans `ViewLinksService` (`i18n`) ; le rail de
contact dans `ContactLinksComponent` (`features/profile`) ; « révéler
l'accueil dès qu'on le quitte » dans `HomeRevealService`. La page importe
chaque zone par son `index.ts`, et ses champs portent le nom de leur type
(`observatory`, `featuredTour`, `homeReveal`).

**Raison.** La page faisait 330 lignes ; elle en fait 199, dont 59
d'imports. Le relevé de la session 3 (état des lieux) liste ce qui a été
déplacé et ce qui a été écarté, avec le gain de chacun.

**Écarté.** Des sous-compositions par vue : les fenêtres croisent
`observatory` et `projects` ou `profile`, donc leur composition reste dans
`pages/`, qui ne tient qu'un composant par écran. Une directive pour Échap :
le `host` d'une ligne suffit. Un service pour l'état de départ lu dans
l'adresse : trois lignes, au seul endroit qui connaît `i18n` et
l'observatoire.

## 2026-09-28 — `core/` et `shared/` ne disent plus un mot du portfolio (D51)

**Décision.** Le nom du site quitte `core/` : `DocumentHeadService` le reçoit
par le port `SITE_NAME` (`core/ports/`), auquel `provideI18n` répond avec
`OWNER_NAME` (`i18n/data/owner.data.ts`), que les deux catalogues reprennent
pour le nom de l'accueil. Dans la scène, `isAbout` devient
`areFiguresShown`, d'après l'entrée `figuresShown` dont il vient, et la
lumière des figures éteintes `unlitWhenShown`.

**Raison.** Le relevé de la session 3 (état des lieux) : c'étaient les deux
seuls mots du portfolio dans `core/` et `shared/`. Le nom était écrit deux
fois de plus dans les catalogues ; il ne l'est plus qu'une.

**Écarté.** Lire le nom dans le catalogue courant : la stratégie de titre
est créée avec le routeur, et le catalogue dépend de la langue, qui dépend
du routeur. Le nom ne change pas d'une langue à l'autre.

## 2026-09-28 — Les outils des specs sont écrits une fois, et tout ce qui teste vit sous `src/testing/` (D52)

**Décision.** Un outil de spec recopié d'un fichier à l'autre vient dans
`src/testing/`, une seule fois : le navigateur d'un spec (taille de l'écran,
`matchMedia`, observateurs) dans `doubles/browser.double.ts`, les gestes
dans `fixtures/pointer.fixture.ts`, le `TestBed` (plateforme, sorties,
composant enfant) dans `fixtures/testbed.fixture.ts`, la géométrie des
règles de la scène, la scène qu'on regarde et l'observatoire d'un spec dans
leur fichier. La scène de la page et celle du worker partagent
`ENGINE_OPTIONS`. Les suites d'intégration passent de `src/integration/` à
`src/testing/integration/`, qui ne tient que des `.spec`. Les specs
unitaires restent à côté de ce qu'elles testent.

**Raison.** Le même `stubViewport` était écrit cinq fois, le même
`inject(platform)` onze fois, le même bouchon de `matchMedia` sous six noms ;
les specs perdent environ 400 lignes sans qu'un test change. Le test de
parité entre la page et le worker ne comparait les mêmes réglages que parce
que trois copies se ressemblaient ; il les compare maintenant par
construction. Sous `src/testing/`, tout ce qui ne part pas en production est
à un seul endroit, et `tsconfig.app.json` n'exclut plus qu'un dossier.

**Écarté.** Un dossier `src/test/` qui reprendrait l'arbre de `src/app/` pour
y ranger chaque spec : on ne verrait plus qu'un fichier a son test, et c'est
contraire à la convention d'Angular. Renommer `src/testing/` : l'alias
`@testing/*` changerait dans des dizaines de specs pour un nom à peine plus
clair. Les compteurs locaux (`closed += 1`) et les événements qui ne
bouillonnent pas restent dans leur spec : les partager aurait changé ce que
leurs tests vérifient.

## 2026-09-28 — Un lancement à la main de la CI déploie aussi (D53, amende D48)

**Décision.** Le job `deploy` tourne sur `main` pour un push comme pour un
lancement à la main (`workflow_dispatch`) ; seules les pull requests ne
déploient pas.

**Raison.** Le 2026-09-28, quatre fusions sont arrivées sur `main` sans que
GitHub lance la CI. Relancée à la main, elle est passée, mais le site n'est
pas parti : il fallait pousser un commit pour rien. Le lancement à la main
passe par les mêmes contrôles que le push, et le déploiement attend toujours
`lint`, `build` et `sonar`.

**Écarté.** Un workflow à part pour déployer : il referait un build, ou
irait chercher l'artefact d'un autre run, ce que D48 a justement écarté.

## 2026-09-28 — Un test vérifie un comportement, là où il vit (D54)

**Décision.** Dans `features/`, `pages/`, `core/` et les suites
d'intégration, un test reste s'il vérifie ce qu'un lecteur, un appelant ou
un contrat attend. Il part s'il redit ce qu'un autre test vérifie déjà (on
garde celui de l'unité qui porte le comportement ; la page ne garde que le
branchement), s'il lit un détail interne, ou s'il fige un texte du site sans
vérifier une règle : un spec lit alors le texte dans le catalogue, par le
jeton de la feature, au lieu de le recopier. Les cas qui ne changent que par
leurs données passent en tableaux (`it.each`). `prerender-safety.spec.ts`
disparaît : chacune de ses assertions était déjà dans le spec « inerte côté
serveur » d'un service, sauf trois, passées dans ceux de `DisplayFormatService`
et `FormatCodeService`. `home-status.spec.ts` disparaît aussi : il ne
vérifiait qu'une phrase. Les `afterEach(() => TestBed.resetTestingModule())`
partent : Angular remet le `TestBed` à zéro après chaque test.

**Raison.** Ces specs passent de 564 à 512 tests et perdent environ 830
lignes sans perdre une ligne ni une branche couverte (la couverture gagne
deux lignes et une branche). Trois comportements n'avaient pas de test et en
ont un : un clic sur un corps du relevé le sélectionne puis le relâche, un
clic dans le vide revient de la fiche à la liste, et pointer la règle des
orbites reprend la visite au lecteur. Un texte retouché ne casse plus un
test qui ne vérifiait que sa lettre.

**Écarté.** Lire les textes dans `FR` depuis une feature : la loi de
dépendance interdit à une feature d'importer `i18n`, le jeton suffit.
Supprimer `animation.manager.spec.ts` : son test « état en lecture seule »
n'existe nulle part ailleurs. Couper le titre de chapitre par défaut de la
fiche : c'est le seul test qui montre que la fiche passe ses titres à
`chapterTitle`.

## 2026-09-28 — Les libs de `shared/` testent ce qu'on voit d'elles (D55, étend D54)

**Décision.** La règle de D54 vaut pour la scène, les fenêtres et `ui/`. Un
test qui lisait l'état interne de la scène (le plateau, l'horloge de la
traversée) part s'il redit `turntable.motion.spec` ou `traveling.rules.spec`,
ou se réécrit sur ce qui est dessiné. Une règle pure se teste dans le spec de
son fichier : `fitOrbits` et la traversée quittent les specs du moteur et de
la caméra. Les contrôles d'une fenêtre se trouvent par leur nom accessible,
plus par leur rang. `window.model.spec`, `window-texts.port.spec` et
`scroll-memory.service.spec` disparaissent : ils figeaient une constante,
testaient Angular, ou redisaient `remember-scroll`. Le golden ne bouge pas.

**Raison.** La couverture monte de 20 lignes et 19 branches : les tests qui
partent redisaient, et ceux qui arrivent tiennent un comportement sans test.
La souris suit la scène et pas le doigt, un onglet caché ne lance pas la
boucle, la caméra déplacée passe de la page au worker et en revient, un
geste annulé relâche le zoom. `AnimatedCanvasService` retestait les services
qu'il appelle ; son spec vérifie maintenant ce qu'il décide (dessiner hors du
fil principal ou non, et se replier si le navigateur refuse). Un bouton
d'agrandissement ajouté à la fenêtre (session 6) ne cassera pas les tests des
autres.

**Écarté.** Tester l'ordre entre le calage des orbites et la visée de la
caméra : inverser les deux lignes ne change rien de visible, aucun test ne
peut le tenir. Tester le garde `if (!container)` de `BottomEdgeVariable` :
aucun rendu réel n'y mène.

## 2026-09-28 — Une scène qui s'ouvre sur un gros plan est déjà ouverte : un test le tient (D56, complète D55)

**Décision.** Le spec du moteur vérifie qu'une page qui arrive sur un gros
plan (une fiche ouverte par son adresse) montre le trou à sa taille dès la
première image, sans l'animation d'ouverture.

**Raison.** Après D54 et D55, la couverture de `main` passe de 96,99 à
97,45 % des lignes et de 92,09 à 92,8 % des branches, mais une branche s'est
perdue : ce départ ouvert (`startOpen(true)`). Seul un test coupé y passait,
sans le vérifier. Le nouveau test échoue si la scène part fermée.

## 2026-09-28 — Le téléphone a une librairie de navigation, et les chapitres se tournent comme des pages (D57, amende D37)

**Décision.** Une librairie `shared/mobile-nav/` donne au téléphone des
gestes d'application native. Elle n'importe rien du dépôt, pas même `core` :
le navigateur lui arrive par `MOBILE_NAV_PLATFORM`, auquel
`provideMobileNav()` (`pages/providers/`) répond avec les services de
`core/services/browser/`, et ses mots par `MOBILE_NAV_TEXTS`, que
`provideI18n` fournit. Le lint le tient. Sa première brique est le pager :
un `scroll-snap` horizontal, une page à la fois, chaque page défile seule. Il
dit la page du lecteur à la fin du défilement (`scrollend`, sinon 120 ms
après le dernier `scroll`), jamais avant ; une page réglée d'en haut défile
après l'image suivante, sans animation en mouvement réduit ; les autres
pages sont `inert`. La fiche et l'à-propos mettent chaque chapitre et chaque
section dans une page, à tous les formats. Au téléphone, la page remplit le
corps et suit son défilement ; ailleurs, seule la page posée s'affiche, comme
avant. Au téléphone, les onglets de la fiche portent les titres des
chapitres. Le balayage de la vitre (`swiped`) disparaît : un glisser
horizontal est natif. Le tirage reste.

**Raison.** Le balayage écrit à la main suivait le doigt de 24 px au plus,
puis changeait de chapitre d'un coup, sans élan ni rebond. Le navigateur
fait tout cela lui-même, au doigt. Un même DOM pour tous les formats met
chaque chapitre dans le HTML prérendu et garde le bureau intact.
`overflow-y: inherit` fait suivre aux pages l'état de la vitre sans qu'elles
la connaissent. Les titres disent où mène un onglet mieux que « 02 ». Les
liens d'un projet sont répétés dans chaque page : chaque page défile seule,
et des liens posés hors du pager seraient hors d'atteinte. Le bundle initial
passe de 477,6 à 483,9 kB.

**Écarté.** Un pager seulement au téléphone, choisi par
`DisplayFormatService` : le prérendu est au bureau, et le téléphone
basculerait après l'hydratation. Deux gabarits, l'un par format : chaque
chapitre deux fois dans le DOM. Une variable CSS publiée par la fenêtre pour
l'état du corps : la feuille de la fenêtre dépassait son budget de 4 kB. Les
variables `--mnav-*` : le pager ne dessine rien ; elles viendront avec les
briques qui dessinent. Garder le balayage de l'aperçu : il part avec la
sortie `swiped` ; ses onglets restent, et le carrousel de l'accueil vient
ensuite. Le panneau coulissant : il remplace la coque de la fenêtre au
téléphone, que la session 6 refait, et il lui faut une fenêtre qui survive
aux changements de vue pour ne changer d'état qu'à la fin de son animation.

## 2026-09-28 — Au téléphone, les projets vedettes sont des cartes qu'on fait glisser (D58, amende D35)

**Décision.** `shared/mobile-nav/` gagne un carrousel de cartes. Chaque carte
est un bouton : numéro, nom, preuve, pile. La suivante dépasse du bord. Le
carrousel dit la carte posée à la fin du défilement, jamais avant, comme le
pager. Une carte réglée d'en haut défile après l'image suivante, sans
animation en mouvement réduit. Des points montrent la carte posée
(`aria-current`) ; ils restent hors de la tabulation. Au téléphone, il
remplace la rangée « ‹ nom › » de la barre des vedettes. Poser une carte
allume sa planète. Toucher une carte ouvre son aperçu. Le tour des vedettes
règle la carte ; il rend la main dès que le lecteur touche les cartes. Les
variables `--mnav-*` dessinent les cartes ; `_tokens.scss` les relie aux
jetons du site. Le bureau et la tablette ne changent pas.

**Raison.** « ‹ Skyted Companion › » se lisait comme du texte : des flèches
minuscules, rien n'invitait à toucher. Une carte entière est une cible
évidente, et la carte qui dépasse dit qu'il y en a d'autres. Le navigateur
fait l'élan et l'aimantation au doigt. Le geste écrit à la main disparaît,
et avec lui `swallowsTap`, `swipeStepOf` et `neighbourOf`. Le tour s'arrête
au premier contact : il ne fait pas défiler sous le doigt. Les points
reprennent « Page 2 sur 4 », déjà traduit : aucun mot nouveau.
`rule.previous` et `rule.next` ne servent plus ; ils partent. Seules
l'opacité et l'échelle s'animent, sans `backdrop-filter`. Le bundle initial
passe de 483,9 à 490,8 kB.

**Écarté.** Des points focalisables : dix arrêts de tabulation pour ce que
les cartes donnent déjà. Des points cachés aux lecteurs d'écran : ils
perdraient la carte posée. Un texte « Projet 2 sur 4 » : la librairie ne
parle pas de projets, et la liste donne déjà la position. Toucher une carte
voisine pour la centrer seulement : un lecteur d'écran qui active une carte
attend son aperçu. Une vitre floutée sous les cartes : elle bougerait au
défilement.

## 2026-09-28 — Au téléphone, une carte du relevé ouvre sa fiche d'un toucher (D59, amende D40)

**Décision.** En cartes, sous 500 px de vitre (D45), chaque carte du relevé
est un lien vers sa fiche. Un toucher suffit. Le tableau garde son accordéon,
sa sélection et « Voir le projet ». Les deux commandes partagent un même
gabarit ; la feuille montre l'une ou l'autre. La carte garde le nom de la
rangée. Le survol et le focus allument toujours la planète. Au retour, la
carte quittée reste allumée ; le bloc ouvert ne s'affiche plus en cartes.

**Raison.** Deux touchers pour lire un projet : le premier ouvrait un bloc
qui ne disait qu'une phrase et un lien. Un vrai lien marche sans JS dans le
HTML prérendu, se lit comme un lien et revient par le bouton retour. La
fiche encadre déjà la planète et porte les liens du projet. Le bundle
initial passe de 490,8 à 491,5 kB.

**Écarté.** Un lien qui ouvre l'accordéon au bureau : un lien pressé qui ne
mène nulle part n'a pas de sens. Choisir par `DisplayFormatService` : le
prérendu est au bureau (D57). Un lien étiré par-dessus le bouton : deux
commandes pour une carte. Montrer la pile et le rôle de la carte quittée :
la carte changerait de taille au retour.

## 2026-09-28 — Au téléphone, « Contact » ouvre une feuille d'actions, et le retour la ferme d'abord (D60, amende D27)

**Décision.** `shared/mobile-nav/` gagne une feuille d'actions sur un
`<dialog>` ouvert par `showModal()`. Elle a un titre, des rangées projetées
(`appActionRow`, lien ou bouton, icône et libellé, 44 px) et « Fermer ». Son
panneau est opaque et monte du bas. À la fermeture, la sortie joue, puis
`close()`, puis `open` passe à faux ; en mouvement réduit, tout de suite. Le
focus revient au bouton d'origine. Échap ne ferme qu'elle. Le retour la ferme
avant la vue : `CloseWatcher` l'envoie au `<dialog>` ; sans lui,
`BackLayersService` pose une entrée d'historique sur la même adresse et la
reprend si la page ferme. Au téléphone, « @ » devient « Contact » : m'écrire,
copier l'adresse, LinkedIn, GitHub, CV. La copie passe par `ClipboardService`
et dit « Adresse copiée ». La pause a son propre bouton à côté. Le bureau ne
change pas.

**Raison.** L'état des lieux : des icônes sans nom, la pause mêlée aux
adresses, la bande qui couvrait la langue. Un libellé dit ce que fait le
bouton ; chaque rangée reprend la phrase déjà écrite de son adresse. Le
`<dialog>` modal donne le focus, la couche du haut, Échap et le retour
Android. Fermer après la sortie garde un état qui ne ment pas. Le routeur
ignore un retour sur la même adresse. Le prérendu vérifie qu'aucun
`<dialog>` n'est ouvert. Quatre mots neufs. Le bundle initial passe de 491,5
à 501,8 kB.

**Écarté.** Un flou sous la feuille : un coût à chaque image (D36, D38). La
pause dans la feuille : ce n'est pas un contact. La pause dans la barre
couchée : 244 px ne la tiennent pas. Deux pauses dans le DOM : le rail la
prend à tous les formats. Toucher au bureau : le rail y nomme déjà tout.
Charger la feuille à part (`@defer`) : le bouton « Contact » doit être dans
le HTML prérendu et ouvrir la feuille au premier toucher ; différée, elle
demanderait deux touchers, pour environ 2,5 kB transférés.

## 2026-09-28 — Les onglets du téléphone restent dans `shared/ui`, et les transitions orientées attendent les fenêtres qui durent (D61)

**Décision.** La barre d'onglets du téléphone debout reste
`MainNavComponent` (`shared/ui`), telle que D38 l'a posée : elle n'entre pas
dans `shared/mobile-nav/`. Les transitions orientées (pousser en avant,
revenir en arrière entre la liste et la fiche) passent à la session 6.

**Raison.** La barre fait déjà ce que la brique devait apporter : fixée en
bas, `env(safe-area-inset-bottom)`, des cibles de 44 px, `aria-current`, et
ses mots par un port. La déplacer ne changerait rien pour le lecteur ; on ne
déplace pas pour déplacer. Les transitions animeraient une vue dont les
fenêtres sont recréées à chaque changement : c'est ce qui fige encore la
page au-delà de 50 ms à ×4, et D46 a retiré les View Transitions pour cette
raison. La session 6 garde les fenêtres montées ; on pourra y mesurer une
transition sur une vue qui ne se reconstruit plus.

**Écarté.** Une copie de la barre dans la librairie pour qu'elle soit
complète : deux barres pour un seul usage. Des transitions tout de suite,
sans mesure : elles risquaient de défaire D46.

## 2026-09-28 — Une fenêtre montée ne se détruit plus : elle se cache (D62, amende « Les fenêtres vivent à la station »)

**Décision.** Une fenêtre se monte la première fois que sa vue s'affiche,
puis ne fait plus que se cacher (`KeptWindowDirective` : `inert`,
`content-visibility: hidden`, `data-shown`). Rien n'est monté d'avance au
prérendu. La liste et l'à-propos se montent cachés quand le navigateur est
libre, une fois l'accueil révélé. Une fenêtre demandée se montre une image
plus tard, et la vue se déclare l'image après le travail du routeur. Seule
la fenêtre de la vue porte le `h1` ; les autres ont un `h2`. Revenue, une
fenêtre se déplie, redescend sa vitre et rejoue sa montée ; son défilement
reste. Une autre fiche repart en haut.

**Raison.** Recréer les fenêtres figeait chaque navigation : au téléphone à
×4, la pire image allait de 54 à 139 ms selon la navigation. Sur les cinq
navigations mesurées, trois passages chacune, aucune image n'atteint plus
50 ms, sauf une fois 51 à 52 ms à la toute première navigation d'une page
froide. `content-visibility` garde les positions de défilement, que
`display: none` perd, et ne coûte ni style ni layout. Séparer création,
style et layout en deux images les garde chacune sous 50 ms. Les lectures de
layout sur une fenêtre neuve ou cachée (segmenté, pager, carrousel,
`scrollTop`) forçaient 12 à 20 ms ; elles attendent que le contenu soit
dessiné. Un seul `h1` par page, même avec une fenêtre épinglée, qui en
ajoutait un second. Le montage au repos coûte une image d'environ 55 ms,
quand personne ne touche à rien. Le bundle initial passe de 501,8 à
507,7 kB.

**Écarté.** Les quatre fenêtres toujours montées : du contenu caché
prérendu. `display: none` : défilement perdu, page du pager remise à zéro.
Préparer la fiche avec un projet deviné : passer d'une fiche à l'autre coûte
autant qu'un montage. Chauffer le layout d'une fenêtre cachée sous
`visibility: hidden` : aucun gain mesuré. Garder les feuilles de style des
composants détruits (`REMOVE_STYLES_ON_COMPONENT_DESTROY`) : 5 ms gagnés,
inutiles une fois le travail réparti sur deux images.

## 2026-09-28 — Les boutons de la fenêtre disent ce qu'ils font, au bureau comme au téléphone (D63)

**Décision.** Les boutons de la barre passent dans `WindowControlsComponent`
(`shared/windows/components/window-controls/`). Des icônes SVG remplacent
○ ● – ✕. Chaque bouton montre son nom dans une bulle CSS, au survol et au
focus clavier ; la bulle est cachée aux lecteurs d'écran, et le nom reste sur
`aria-label`. Il n'y a plus de `title`. Au téléphone, épingler garde la
fenêtre en changeant d'onglet, et replier la baisse. Fermer dit où l'on va :
l'appelant donne le mot, tiré de `closeTargetOf`, la règle que suit aussi la
fermeture. Une note brève dit « Fenêtre gardée » ou « Fenêtre libérée » quand
on presse l'épingle.

**Raison.** Personne ne comprenait ○, et « fermer » ne disait pas où il
menait. Un `title` ne s'affiche jamais au doigt. Une seule règle pour le mot
et le geste : ils ne peuvent pas se contredire. Le chevron montre où va la
fenêtre ; le moins reste libre pour réduire. Les icônes sont dessinées pixel
pour pixel, à 20 px. La feuille de la fenêtre passe de 3,8 à 3,2 kB. Les
boutons à venir s'ajoutent à la liste du composant. Le bundle initial passe
de 507,7 à 512,8 kB.

**Écarté.** Une bulle en JS : du code pour ce que CSS fait. Des bulles au
toucher : le toucher presse le bouton. Choisir les mots en CSS : un nom
accessible ne se pose pas en CSS ; les mots du téléphone changent donc après
l'hydratation, comme D57 l'accepte. Une note à chaque changement de
l'épingle : fermer une fenêtre la désépingle sans qu'on l'ait demandé.

## 2026-09-28 — Au téléphone, la vitre est une feuille à crans de `shared/mobile-nav` (D64, amende D25, D37, D39 et D62)

**Décision.** `shared/mobile-nav/` gagne `BottomSheetComponent`. Au
téléphone, la page pose chaque fenêtre dans une feuille. La feuille a des
crans : replié, mi-hauteur, plein. La liste, l'à-propos et la fiche ont les
trois ; l'aperçu, replié et mi-hauteur. Couchée, la mi-hauteur se fond dans
le plein. Le rail défile en natif, du cran replié au cran plein. Au lâcher,
la règle pure `detentAfter` choisit le cran : 64 px vers le repli, 48 px
ailleurs, ou plus de 0,6 px/ms, les seuils de D37. La feuille y va en
douceur, tout de suite en mouvement réduit. Elle dit son cran à la fin du
défilement seulement (`scrollend`, sinon 120 ms après le dernier `scroll`).
Elle écrit `data-detent`, et la hauteur de sa bande pour la page. Un toucher
de la barre repliée la remonte. Le flou du ciel suit le rail entre la
mi-hauteur et le plein. Hors du téléphone, la feuille est `display:
contents`. La librairie ne connaît pas les formats : `MOBILE_NAV_PLATFORM`
gagne `isCompact`. Les deux librairies ne s'importent pas : `shared/windows`
ouvre un port facultatif, `WINDOW_FOLD`, que `WindowSheetDirective`
(`features/observatory`) fournit en passant par la feuille. Sans lui, la
fenêtre se replie seule, comme avant. « Baisser la fenêtre » et « Remonter
la fenêtre » changent donc le cran. Repliée par la feuille, la fenêtre garde
son contenu, `inert` sous la barre. Une fenêtre gardée (D62) revient à son
cran. `.slot:has(.glass--folded)` devient `[data-detent='folded']`.
`GlassGesturesDirective`, son tracker, sa règle, son modèle,
`ScrollStopsDirective` et la coque `.glass` de la fenêtre partent.

**Raison.** Le repli se faisait par une translation écrite à la main sur la
vitre, qui porte un `backdrop-filter`. Mis dans le rail, le repli devient un
défilement comme les autres : élan, rebond, chaînage du corps en haut de son
contenu, balayage horizontal du pager, sans une ligne de geste. Ce qui en
reste tient en deux écoutes passives (`touchstart`, `touchend`) et une
règle. Le tracker n'a plus de raison d'être : il n'est ni gardé ni chargé à
part. Dire le cran à la fin seulement évite de recadrer la scène à chaque
image ; `afterEveryRender` la fait lire la bande dès que le cran change. La
mesure de la feuille attend l'image suivante : faite dans le rappel du
`ResizeObserver`, elle forçait 15 ms de mise en page à la vitre qui
revenait. Mesuré à × 4, trois passages, aucune image n'atteint 50 ms sur les
cinq navigations (avant cette mise à l'image suivante : 55 à 67 ms). Garder
son cran à la fenêtre qui revient respecte le choix du lecteur ; la scène lit
la bande repliée de toute façon. Le bundle initial passe de 512,8 à
518,0 kB : le tracker parti était déjà à part.

**Écarté.** L'accroche CSS (`scroll-snap`) : elle choisit le cran le plus
proche, pas celui du côté où l'on tire (D25). Une translation de la vitre :
elle anime l'élément qui floute. Un repli hors du rail, rouvert par un
geste écrit : il faut encore suivre le doigt. Garder le tracker, chargé à
part : il n'a plus rien à suivre. Une feuille activée en CSS seul : la
librairie ne lit pas les formats, et chaque propriété passerait par une
variable. Redescendre la vitre à chaque retour (D62) : le lecteur l'avait
laissée là. Charger à part la règle du lâcher : environ 1 kB, qui doit être
là au premier toucher.

## 2026-09-28 — Au bureau, une fenêtre se déplace, s'aimante, se redimensionne et s'agrandit, à la souris comme au clavier (D65, amende D12)

**Décision.** Au bureau et à la tablette, une fenêtre a un cadre.
`WindowFrameDirective`, posée sur l'emplacement, écrit sa place
(`transform`), sa taille et `data-frame`. La barre déplace la fenêtre. Aux
bords gauche et droit, elle prend la moitié de l'écran ; au bord du haut,
elle s'agrandit. Un contour simple montre la zone ; seuls son opacité et son
`transform` s'animent. Les bords et les deux coins du bas redimensionnent,
de 320 × 200 à l'écran moins la réserve. Le double-clic de la barre agrandit,
puis rend la taille. « Déplacer » et « Redimensionner » répondent aux
flèches (8 px, 64 px avec Maj), disent leurs touches et finissent sur Entrée
ou Échap. « Agrandir » rejoint la liste des boutons. Tout ce code se charge à
part (`FormatCodeService`, `desktop` et `tablet`) : les deux trackers, les
règles pures, les poignées, les boutons du cadre et la hauteur bornée.
`DraggableDirective` et `FitHeightDirective` partent. Replier la fenêtre dans
sa barre ne reste qu'au téléphone. Une fenêtre gardée garde son cadre.

**Raison.** Déplacer ne se faisait qu'au pointeur : le clavier en était
exclu. La scène lit le rectangle de l'emplacement : poser le cadre là lui
fait suivre une fenêtre élargie. Borner la hauteur et placer la fenêtre
partageaient un état (une fenêtre redimensionnée n'a plus de plafond) :
elles ne font plus qu'une. Le double-clic d'un bureau agrandit ; réduire
viendra avec le dock. Le bundle initial passe de 518,01 à 517,98 kB. Deux
morceaux s'ajoutent : `window-frame-tracker` (8,19 kB) et
`window-controls-rules` (0,81 kB). Limite connue : la scène suppose les
fenêtres à droite ; posée à gauche, une fenêtre cache une part du trou. La
PR suivante corrige le cadrage.

**Écarté.** Les quarts d'écran : une fenêtre y tombe sous 58ch et cache le
ciel que D29 cadre. Un voile ou un flou pour l'aperçu : il animerait un
élément qui floute. Les boutons du cadre dans le bundle initial : 521,8 kB.
Un bord haut : c'est la barre. Garder le repli au bureau : il fait double
emploi avec agrandir et le dock à venir.

## 2026-09-29 — La scène cadre dans le ciel libre, de quelque côté que soient les fenêtres (D66, amende D29 et D65)

**Décision.** La page donne à la scène les fenêtres qui s'affichent
(`layout.windows`). La scène garde la plus large bande libre entre elles,
d'un bord à l'autre de l'écran. À égalité, elle garde celle de gauche. Libre
à gauche, les cadrages restent ceux d'aujourd'hui ; le bord est celui de la
bande. Libre à droite, le cadrage se calcule en miroir : le trou passe de
l'autre côté, l'inclinaison s'inverse, et la planète visée aussi. Entre deux
fenêtres, ou si le trou ne tient pas dans sa bande, l'objet entier s'y range
(`wholeInFreeSky`). L'approche et le gros plan retiennent leur trou avant le
bord de la fenêtre. Sous 15 % de la largeur, la scène garde sa dernière
bande. Le téléphone ne change pas.

**Raison.** Posée à gauche, une fenêtre cachait le trou (D65). Le miroir rend
à gauche ce que la droite a déjà. Une bande par colonne suffit : au bureau,
l'objet et sa planète se posent côte à côte. Garder la bande sous une
fenêtre agrandie évite de bouger la caméra sous une vitre opaque, puis
encore au retour. La caméra garde son amorti. Toutes les fenêtres comptent :
une fenêtre épinglée ne passe plus sur le trou. Les goldens ne bougent pas.
Le bundle initial passe de 517,98 à 518,11 kB ; le worker de 59,84 à
62,04 kB.

**Écarté.** Les pièces en deux dimensions du téléphone : au-dessus ou
au-dessous d'une fenêtre, un écran couché laisse une bande trop basse pour
l'objet. Recaler les orbites sur la bande : elles changeraient dans toutes
les vues. Décaler le cadrage de droite sans le refléter : la planète
partirait vers le bord. Suivre la fenêtre agrandie : il n'y a plus de ciel à
montrer. Déplacer la constellation de l'à-propos : hors du cadrage, à
reprendre à part.

## 2026-09-29 — Au téléphone, la vitre garde son flou quand la caméra voyage (D67, amende D46)

**Décision.** La vitre du téléphone ne perd plus son flou pendant que la
caméra voyage. Le drapeau `data-sky-travel` disparaît, avec tout ce qui ne
servait qu'à le produire : l'annonce du voyage par la scène, son message du
worker et `flagRoot`. Le flou du ciel au téléphone ne dépend donc plus que
du cran de la feuille.

**Raison.** Chaque changement de cran fait voyager la caméra. La vitre
passait alors nette pendant environ deux secondes, puis redevenait floue en
fondu, et faisait un aller-retour quand le drapeau rebasculait : le lecteur
voyait le trou net, puis flou, lentement, par à-coups. Mesuré image par
image sur la liste, l'à-propos et la fiche, du cran replié au plein, puis à
la mi-hauteur et au repli : la vitre ne change plus de valeur, et le flou de
la feuille va d'un cran à l'autre sans revenir en arrière. D46 retirait ce
flou quand la scène se dessinait sur le fil principal ; elle se dessine
depuis dans un worker (D47). Le bundle initial passe de 516,44 à
516,04 kB ; le worker de 62,04 à 61,79 kB.

**Écarté.** Ne garder le drapeau qu'au cran plein : un aller-retour restait
possible aux autres crans. Garder le drapeau pour un usage futur : du code
que rien ne lit. Une vitre sans flou au téléphone : elle change le verre au
repos (déjà écarté par D46).
