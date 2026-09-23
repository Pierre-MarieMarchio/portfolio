# Maquette — « la station »

Le design du portfolio : un trou noir en `<canvas>`, les projets en orbite, et
par-dessus une interface à fenêtres. **Il n'est pas encore implémenté** : la
base du dépôt a été posée d'abord, sans lui.

## Contenu

```
docs/maquette/
  Portfolio v5-A - la station.dc.html   la maquette entière (export Claude Design) :
                                        gabarit, données projets[] / faits[] / fiches[],
                                        routage, canvas, TOUT le JS
  passation-la-station.md               le design expliqué : routes, jetons, composants,
                                        comportements, accessibilité, contenus manquants
  decoupage-angular.md                  le découpage Angular proposé, l'ordre de travail (§4)
                                        et les pièges (§5)
  objet-canvas.md                       la spécification du rendu canvas, à porter telle quelle
  composants/
    Fenetre.dc.html                     la fenêtre (export Claude Design)
    Segmente.dc.html                    le sélecteur segmenté (export Claude Design)
  captures/                             23 captures, une par vue et par état (924 × 540)
```

## Ordre de lecture

1. `passation-la-station.md`, pour comprendre ce que le site doit faire.
2. `decoupage-angular.md`, pour l'ordre de travail et les pièges.
3. `Portfolio v5-A - la station.dc.html`, la source de vérité du comportement
   et des données : en cas de doute entre un texte et l'export, l'export fait
   foi.
4. `objet-canvas.md` avant de toucher au canvas, les `composants/` avant la
   fenêtre et le sélecteur, `captures/` pour chaque état.

## Les exports Claude Design (`.dc.html`)

La maquette a été faite avec **Claude Design**. Ses fichiers `.dc.html` ne
sont pas de simples pages : chacun contient le gabarit **et tout le JS**, dans
un bloc `<script type="text/x-dc">` (la classe `Component` et sa logique).

- Ils sont **exclus de Prettier et d'ESLint** et ne se modifient jamais : ils
  restent octet pour octet ce que Claude Design a exporté. Un nouvel export
  remplace l'ancien, sous le nom que Claude Design lui donne.
- Ils chargent `./support.js`, le runtime de Claude Design, qui n'est pas dans
  le dossier : ouverts en local, ils ne s'affichent pas. Pour les voir tourner,
  les rouvrir dans Claude Design ; pour les lire, un éditeur suffit.
- Aucun export n'en charge un autre : leur emplacement dans ce dossier est
  libre.

Les données de l'export (`projets[]`, `faits[]`, `fiches[]`) sont la seule
source du contenu. `src/app/features/projects/data/projects.data.ts` n'en
reprend pour l'instant que les slugs, titres, familles et l'ordre ; le reste
arrive avec l'implémentation de la maquette, recopié depuis l'export, jamais
réécrit.

## Ce qui a été renommé

Les fichiers de la première livraison étaient arrivés décalés : chaque nom portait le contenu de
l'élément situé deux rangs plus loin (le fichier nommé `05-…` montrait la
capture `03`, `Fenetre.dc.html` était la capture `22`, `objet-canvas.md` était
le prototype de la fenêtre, `angular.md` était la passation du design…). Chaque
fichier a été ouvert et renommé d'après **ce qu'il contient**, le 22 septembre
2026. Les exports manquants (la maquette entière, le segmenté, la spec canvas)
ont été ré-exportés le même jour et vérifiés : chacun contient bien ce que son
nom annonce. Les noms actuels sont donc fiables.

Deux captures ne montrent pas tout ce que leur nom annonce, parce que la vue est
défilée en haut : `15-fiche-ngx-statewise-figure-flux` et
`16-fiche-template-dotnet-figure-couches` montrent le chapitre 03 de la fiche,
pas la figure elle-même.

## Chemins à relire dans les documents

Les passations ont été écrites avant ce rangement et gardent leurs chemins
d'origine. Correspondance :

| Chemin cité dans les documents   | Chemin actuel                                  |
| -------------------------------- | ---------------------------------------------- |
| `maquette/Portfolio v5-A - la station.dc.html` | `docs/maquette/Portfolio v5-A - la station.dc.html` |
| `maquette/Fenetre.dc.html`       | `docs/maquette/composants/Fenetre.dc.html`     |
| `maquette/Segmente.dc.html`      | `docs/maquette/composants/Segmente.dc.html`    |
| `objet-canvas.md`                | `docs/maquette/objet-canvas.md`                |
| `angular.md` (le découpage)      | `docs/maquette/decoupage-angular.md`           |
| le README de la passation        | `docs/maquette/passation-la-station.md`        |
| `captures/`                      | `docs/maquette/captures/`                      |

## Écarts déjà décidés

La base du dépôt s'écarte de la maquette sur les points suivants :

- **Routes en chemins (`/projets`), pas en fragments (`#/projets`).** Un
  fragment n'atteint jamais le serveur : ces pages ne pourraient être ni
  prérendues ni indexées. L'exigence qui motivait les fragments (l'objet ne
  doit jamais être démonté) est tenue autrement : l'objet vivra dans
  `AppComponent`, au-dessus du `<router-outlet>`.
- **Polices locales (Fontsource), pas Google Fonts** : le contenu doit
  s'afficher sans dépendre d'un CDN.
- **La fenêtre mesure son plafond une fois posée.** L'export le mesure au
  montage, pendant l'animation d'ouverture qui décale encore la fenêtre de
  10 px : le plafond tombait 10 px trop court. Il est repris à la fin de
  l'animation.
- **Le segmenté ne déborde plus.** Sur la capture `07-releve`, « Personnels 03 »
  passe à la ligne et recouvre l'en-tête des colonnes. Le segmenté porté grandit
  avec ses rangées et ne recouvre rien.
- **Un double-clic sur un bouton de la barre ne replie pas la fenêtre** : ce sont
  deux clics sur ce bouton. L'export repliait aussi, par la même règle qui lui
  fait ignorer la prise sur un bouton.
- **Les bandes de la fenêtre (barre d'outils, corps, pied) sont dessinées par la
  fenêtre**, pas répétées par chaque appelant. Le rembourrage du corps, qui
  diffère d'une vue à l'autre, reste à l'appelant
  (`--window-body-padding`).
