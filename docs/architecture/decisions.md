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
