# La scène spatiale et ses outils de test

Les raisons qui ne se lisent pas dans le code de `src/app/shared/space-scene/`
et de `src/testing/`, rangées par unité (D10).

## `src/app/shared/space-scene/rules/scene-bodies.rules.ts`

- Le système de la maquette est gardé tel quel : ses sept orbites
  (`ORBIT_REFERENCE_COUNT`) sont celles de l'export.

## `src/app/shared/space-scene/rules/scene-layout.rules.ts`

- Un panneau est un bandeau du bas s'il couvre au moins 90 % de la largeur
  et que son haut est sous le milieu de l'écran (`BOTTOM_BAND`). La vitre du
  téléphone arrive à 60 % : elle l'est. Montée pour la lecture, elle ne l'est
  plus ; la page doit alors désigner sa place d'arrivée, pas la vitre montée
  (D26).
- Les hauts de bandeau sont optionnels dans `SceneLayout` : un rectangle qui
  ne les donne pas garde le cadrage à droite, au pixel près.
- `panelBandTop` est le haut du plus haut bandeau parmi toutes les ancres
  montrées, sauf les deux barres, quel que soit leur rôle : l'index et
  l'à-propos s'inscrivent sans rôle (`''`), la page introuvable dans
  l'emplacement de la fiche. `sidePanelLeft` n'existe que debout (hauteur
  plus grande que la largeur) : le bord gauche du plus à gauche des panneaux
  hauts d'au moins un quart de l'écran et qui commencent après son premier
  quart (`SIDE_PANEL`). Le rail de contact et la courte fenêtre de la page
  introuvable, à la tablette, n'en sont pas. Couché, rien ne change.
- La vitre repliée tient dans son emplacement (voir `pages/observatory/`) :
  le haut du bandeau devient celui de sa barre, et la caméra glisse vers le
  cadrage au grand ciel. Le glissement est celui de toute visée (0,55 s de
  demi-vie), immédiat sous le mouvement réduit.

## `src/app/shared/space-scene/rules/camera/camera-frames.rules.ts`

- Au-dessus d'un bandeau, le corps visé est au centre de la largeur et au
  milieu de la bande de ciel ; l'objet se range à côté, son centre dans
  l'écran : l'échelle cède avant (2,9 rayons au plus dans la demi-largeur),
  comme elle cède devant un panneau à droite.
- Le décalage du corps se calcule avec l'élévation et le roulis du cadrage
  visé (`BodyOffset`) : ceux du cran pour l'approche, ceux du repos pour le
  gros plan. Le gros plan dessine l'objet 6 % plus petit (l'ouverture) : le
  corps y tombe un peu plus près de l'objet que visé, dans la marge.

- Debout, quand l'échelle du repos bute sur son plafond (0,42) et laisse de
  la hauteur libre, le repos se relève (`UPRIGHT_REST`, élévation 0,6 et
  roulis -0,45) dans cette seule marge : le facteur vertical ne dépasse pas
  ce que la bande libre permet à l'échelle plafonnée, donc le trou garde sa
  taille. Les quatre vedettes s'étagent au lieu de s'aligner, et leurs noms
  ne se touchent plus (mesuré à 320, 360 et 390 px, sous les deux moteurs).
  Le roulis compte autant que l'élévation : à 320 px, les deux planètes du
  milieu étaient à la même hauteur et leurs noms, posés de part et d'autre,
  se chevauchaient. Couché, ou quand l'échelle n'est pas plafonnée (le
  bureau, la tablette couchée), le repos est celui d'avant.

## `src/app/shared/space-scene/rules/camera/free-sky.rules.ts`

- La vue d'ensemble, l'à-propos et la page introuvable montrent l'objet
  entier. Avec un bandeau en bas, son trou se centre dans la bande de ciel
  (sous la barre du haut, au-dessus du bandeau) et au milieu de la largeur ;
  debout avec un panneau à droite (la tablette), dans l'espace à gauche du
  panneau, 16 px avant lui. L'échelle tient l'orbite extérieure dans cet
  espace, moins 28 px pour le bouton de la planète (48 px), par l'étendue
  exacte de l'ellipse tournée (`discSpan`, élévation, aplatissement et
  roulis) ; elle peut doubler celle du cadrage fixe, pas plus. Sans bandeau
  ni panneau à droite, le cadrage fixe est rendu tel quel : le bureau, la
  tablette couchée et le téléphone couché ne bougent pas.

## `src/app/shared/space-scene/engine/renderers/hole-mark.renderer.ts`

- La scène écrit le centre et le rayon du trou, en pixels CSS au dixième,
  dans `data-hole-x`, `data-hole-y` et `data-hole-radius` de sa scène
  (`.stage`) : l'e2e lit là où la caméra pose l'objet, que le canvas ne dit
  pas. L'écriture ne se fait que si la valeur change, dans le DOM et non dans
  un signal, comme les boutons des planètes.

## `src/app/shared/space-scene/engine/space-scene.engine.golden.spec.ts`

- Les cinq empreintes du téléphone changent : `PHONE_LAYOUT` porte
  désormais `panelBandTop` (430), la vue d'ensemble et l'à-propos se
  cadrent au-dessus de lui, et le repos debout se relève, ce qui déplace
  aussi l'arrivée, l'approche et le gros plan (qui prennent l'élévation du
  repos, et des orbites ajustées sur lui). Aucune autre empreinte ne bouge :
  les autres dispositions sont couchées.

## `src/app/shared/space-scene/engine/space-scene.engine.spec.ts`

- La densité après une rotation se compare à une scène jumelle, au même
  instant : le nombre de grains dessinés varie d'une image à l'autre selon
  ceux qui passent derrière le trou, plus nombreux quand le repos se relève.

## `src/app/shared/space-scene/engine/motions/grains.motion.ts`

- La réserve est tirée pour la densité pleine, et la part allumée suit l'aire
  de la fenêtre (`densityShare`). Recalculée après un redimensionnement, elle
  rejoint sa valeur en 0,55 s de demi-vie : les points s'allument ou
  s'éteignent un à un, par le tirage déterministe, sans être retirés. Au
  bureau, la part vaut 1 et le dessin est celui d'avant.

## `src/app/shared/space-scene/engine/motions/turntable.motion.ts`

- Le plateau qui n'est pas tenu est entraîné, pas engrené : il suit le
  ralentissement du plateau mené, avec un retard (`DRAG_LAG`), et ne le
  dépasse jamais.
- Le tour des orbites se partage selon Kepler, depuis le rayon saisi : les
  orbites intérieures en prennent plus, les extérieures moins.

## `src/app/shared/space-scene/engine/motions/star-flow.motion.ts`

- Pendant la traversée, la traînée part du point de fuite et ne garde qu'une
  part du glissement latéral (`TRAIL_SIDEWAYS`) : des traînées qui suivaient
  tout le glissement faisaient des hachures parallèles.
- À la fin de la traversée, l'écartement des étoiles est replié dans leur
  position avec la dérive et le glissement : le replier dans la seule
  position déplaçait les étoiles écartées de centaines de pixels en une image.
- Entre la fin du tunnel (7,9 s) et l'atterrissage de l'objet (9,6 s), le ciel
  continue de s'écarter (`COAST`, porté par la vitesse d'approche) : sans cela
  il se figeait sous un objet qui fonce vers nous.

## `src/app/shared/space-scene/engine/renderers/sky/star-sky.renderer.ts`

- La traînée se mesure en secondes (`TRAIL_SECONDS`), pas en images : mesurée
  par image, une traînée à 20 Hz était trois fois plus longue qu'à 60 Hz.
- La première image trace des traînées que personne ne voit, pour chauffer le
  GPU.

## `src/app/shared/space-scene/engine/renderers/sky/star-sky.renderer.spec.ts`

- Le point de fuite ne devance le virage que de quelques pixels : le spec
  prend le centre de l'image pour lui.

## `src/app/shared/space-scene/engine/renderers/planet-labels.renderer.ts`

- Posé sur un panneau de texte, le numéro d'une planète s'efface ; la planète
  reste dessinée.

## `src/testing/doubles/driven-host.double.ts`

- Les images ne tournent que quand le spec avance l'horloge, et `now` est
  cette horloge : la vitesse d'un geste est exacte.

## `src/testing/fixtures/project.fixture.ts`

- Un manager n'est jamais doublé : une copie de ses règles dérive des
  siennes. Un spec reçoit le vrai `ProjectsManager`, nourri par un double du
  dépôt, la couture où une source distante se brancherait.

## `src/testing/fixtures/texts.fixture.ts`

- Les textes de chaque couche et les liens sont fournis d'un coup : un spec de
  composant a besoin des mots, pas du chargement d'un chunk. Le vrai
  branchement (`provideI18n`) est exercé par `src/integration/i18n.spec.ts`.
