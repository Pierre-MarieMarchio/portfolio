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
`ProjectsRepositoryService.getCatalog()`, portés par une seule action `success`
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
