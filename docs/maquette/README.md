# Maquette — « la station »

Le design du portfolio : un trou noir en `<canvas>`, les projets en orbite, et
par-dessus une interface à fenêtres. **Il n'est pas encore implémenté** : la
base du dépôt a été posée d'abord, sans lui.

## Ordre de lecture

1. `passation-la-station.md`, le design complet : routes, jetons de couleur et
   de typographie, composants (fenêtre, sélecteur segmenté, relevé, fiche,
   accueil), comportements clavier et accessibilité, données, contenus
   manquants.
2. `decoupage-angular.md`, le découpage Angular proposé, l'ordre de travail
   (§4) et les pièges (§5).
3. `captures/`, pour voir chaque vue et chaque état.

## Les exports Claude Design (`.dc.html`)

La maquette a été faite avec **Claude Design**. Ses fichiers `.dc.html` ne
sont pas de simples pages : chacun contient le gabarit **et tout le JS** du
composant, dans un bloc `<script type="text/x-dc">` (la classe `Component`
et sa logique). C'est la source la plus complète du comportement attendu,
à lire en entier avant d'implémenter.

- Ils sont **exclus de Prettier et d'ESLint** : on ne les reformate jamais,
  ils restent octet pour octet ce que Claude Design a exporté.
- Ils chargent `./support.js`, le runtime de Claude Design, qui n'est pas
  dans le dossier : ouverts en local, ils ne s'affichent pas. Pour les voir
  tourner, les rouvrir dans Claude Design ; pour les lire, un éditeur suffit.
- Un nouvel export se dépose dans `composants/` (un composant) ou à la racine
  de ce dossier (la maquette entière), sous le nom que Claude Design lui donne.

## Ce qui manque

Les documents renvoient à trois fichiers **absents de ce dossier** (déjà
absents à la réception : le fichier nommé `Portfolio v5-A…` était en réalité
une capture JPEG). Il faut les ré-exporter depuis Claude Design avant
d'implémenter les parties concernées :

| Fichier absent                        | Ce qu'il contient                                         | Bloque                                  |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| `Portfolio v5-A - la station.dc.html` | l'export Claude Design de la maquette entière : gabarit, données `projets[]`/`faits[]`/`fiches[]`, routage et canvas, **tout le JS** | le contenu réel et le comportement de toutes les vues |
| `Segmente.dc.html`                    | l'export Claude Design du sélecteur segmenté              | le composant segmenté (décrit en §4.2)  |
| `objet-canvas.md`                     | la spécification du rendu canvas, à porter telle quelle  | tout l'objet 3D                         |

Tant que les données manquent, `src/app/features/projects/data/projects.data.ts`
ne contient que ce qui est sûr : les slugs, les titres, la famille et l'ordre.
Aucun texte n'y est inventé.

## Ce qui a été renommé

Les fichiers étaient arrivés décalés : chaque nom portait le contenu de
l'élément situé deux rangs plus loin (le fichier nommé `05-…` montrait la
capture `03`, `Fenetre.dc.html` était la capture `22`, `objet-canvas.md` était
le prototype de la fenêtre, `angular.md` était la passation du design…). Chaque
fichier a été ouvert et renommé d'après **ce qu'il contient**, le 22 septembre
2026. Les noms actuels sont donc fiables.

Deux captures ne montrent pas tout ce que leur nom annonce, parce que la vue est
défilée en haut : `15-fiche-ngx-statewise-figure-flux` et
`16-fiche-template-dotnet-figure-couches` montrent le chapitre 03 de la fiche,
pas la figure elle-même.

## Chemins à relire dans les documents

Les passations ont été écrites avant ce rangement et gardent leurs chemins
d'origine. Correspondance :

| Chemin cité dans les documents   | Chemin actuel                                  |
| -------------------------------- | ---------------------------------------------- |
| `maquette/Fenetre.dc.html`       | `docs/maquette/composants/fenetre.dc.html`     |
| `angular.md` (le découpage)      | `docs/maquette/decoupage-angular.md`           |
| le README de la passation        | `docs/maquette/passation-la-station.md`        |
| `captures/`                      | `docs/maquette/captures/`                      |

## Écarts déjà décidés

La base du dépôt s'écarte de la maquette sur deux points, pour des raisons
d'architecture :

- **Routes en chemins (`/projets`), pas en fragments (`#/projets`).** Un
  fragment n'atteint jamais le serveur : ces pages ne pourraient être ni
  prérendues ni indexées. L'exigence qui motivait les fragments (l'objet ne
  doit jamais être démonté) est tenue autrement : l'objet vivra dans
  `AppComponent`, au-dessus du `<router-outlet>`.
- **Polices locales (Fontsource), pas Google Fonts** : le contenu doit
  s'afficher sans dépendre d'un CDN.
