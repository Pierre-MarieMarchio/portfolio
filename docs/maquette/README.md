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
- **La barre de pages est faite de liens, pas de boutons pressés.** Les adresses
  sont de vrais chemins : chaque entrée reste explorable, prérendue et ouvrable
  dans un nouvel onglet. L'entrée courante porte `aria-current="page"` ; son
  dessin est celui de l'export.
- **Les liens d'une fiche sont espacés.** L'export les met côte à côte sans rien
  entre eux (fiche Bk-ONE : « … produit ↗numerilis.com ↗ »).
- **La fiche épinglée ne se montre que sur une adresse de fiche**, comme dans
  l'export (`ouvreFiche` exige une fiche courante) : son épingle n'a d'effet
  qu'entre deux fiches. Comportement de l'export conservé, pas une décision.
- **Le filtre du relevé lit `family`**, comme le code de l'export. Le texte de la
  passation parle du champ « contexte » : les deux partitions coïncident
  (contexte `Personnel` ⇔ famille personnelle).
- **Le châssis et la règle sont dans le document dès la première image, mais
  n'apparaissent qu'avec `suite`.** L'export ne monte les pages, le titre, la
  règle et le rail qu'au premier geste ou après 8,7 s, à la fin du voyage ; la
  passation veut le contenu « dans le document dès la première image », et le
  prérendu en dépend. Les deux tiennent : tout est rendu, puis retenu
  (`Arrival`) jusqu'au premier geste ou à 8,7 s, et chacun monte alors avec son
  délai de l'export. Sans script, le CSS seul les amène à 8,7 s. Comme dans
  l'export, quitter l'accueil ou arriver sur une autre adresse montre tout
  d'emblée, et les planètes suivent le même signal. Jusque-là, la barre de
  pages ne porte que la langue et s'élargit quand les pages arrivent ; chaque
  repère de la règle se lève ensuite avec sa planète, sur la même horloge
  (0,42 s d'écart, 0,7 s pour chacun).
- **Le rail de contact porte des icônes Material Symbols.** L'export y écrit
  « @ », « in » et « gh » en texte. Les icônes sont incluses en SVG (contour,
  graisse 400) : `mail`, puis `work` pour LinkedIn et `code` pour GitHub,
  Material n'ayant pas de logos de marque. Les noms accessibles ne changent pas.
- **Le carton s'efface sans JavaScript.** Il est prérendu et son fondu est en
  CSS (`animation … both`) : sans script, il disparaît seul à 5,6 s ; le script
  ne fait que le retirer au premier geste.
- **Sur téléphone, la barre de pages passe sur deux lignes et la règle ne garde
  que les numéros.** L'export n'a pas de règle pour les écrans étroits : à
  360 px, la barre sortait du cadre par la gauche et les quatre titres de la
  règle se chevauchaient. Sous 620 px (le seuil « étroit » de l'export), les
  noms restent portés par les planètes et par le nom accessible de chaque
  repère.
