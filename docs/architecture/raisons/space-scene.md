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
- `cornerPanelLeft` n'existe que couché : le bord gauche du plus à gauche
  des mêmes panneaux latéraux, s'il touche aussi le bord droit et le bas de
  l'écran, à 1 px près. La vitre couchée du téléphone l'est (mesurée
  244,0 → 568,320 à 568 × 320) ; aucune fenêtre du bureau ni de la tablette
  couchée ne l'est (bord droit à 44 px de l'écran, bas à 76 px au moins).
  La scène reconnaît ainsi la vitre couchée sans lire le format (D31).
- `topBar` garde la boîte de la barre du haut, et pas seulement sa hauteur :
  couchée, elle ne couvre que la moitié gauche, et un nom de constellation
  n'a à s'en écarter que s'il la croise.
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

## `src/app/shared/space-scene/rules/camera/rest-frame.rules.ts`

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
  roulis) ; elle peut doubler celle du cadrage fixe, pas plus. Couché, la
  vitre du coin (`cornerPanelLeft`) donne le même espace qu'un panneau à
  droite : sous la barre (56 px), à gauche de la vitre. Avant D31, le cadrage
  fixe y posait des boutons de planète sous la barre (jusqu'à 45 px au-dessus
  de son bas à 844 × 390). À 568 × 320, l'objet de la vue d'ensemble y perd
  de la taille (trou de 26 à 13 px de rayon) : le ciel sous la barre n'a que
  264 px de haut. Sans bandeau, ni panneau à droite, ni vitre au coin, le
  cadrage fixe est rendu tel quel : le bureau et la tablette couchée ne
  bougent pas.
- Au gros plan, à côté d'une vitre couchée, le trou se centre dans le plus
  grand rectangle vide que le chrome et la vitre laissent (`holeRoomBeside`,
  la découpe de `restInFreeSky`), celui où le plus grand disque tient à
  12 px de ses bords ; l'échelle du gros plan ne baisse que si ce disque
  est plus petit que son trou (`closeUpInRoom`). Mesuré, le trou garde son
  rayon (62 px à 844 × 390, 33 px à 568 × 320) et passe sous le titre, à
  gauche du « @ ». La planète visée reste où l'angle du gros plan la pose
  par rapport au trou, parfois sous la vitre : le contrat ne tient que le
  trou.

- Le repos de l'accueil garde la bande entre la barre et la règle
  (`measureRest`) tant qu'elle tient le trou à 12 px du chrome (barre,
  règle, titre, contact, dock) et que l'échelle n'y bute pas sur son
  plancher (0,07). Sinon, `restInFreeSky` essaie chaque rectangle vide que
  les bords du chrome découpent dans l'écran et garde celui où l'échelle est
  la plus grande (à égalité, le plus grand) : couché, la moitié droite
  au-dessus de la règle, ou le bas gauche sous le titre à 640 et 568 px ;
  debout à 320 px, la bande sous le titre. Dans ce rectangle, rentré de
  8 px, l'orbite extérieure tient aussi en largeur, à 30 px du bord
  (`sideHalf`), comme en hauteur ; debout, elle laisse en plus de chaque côté
  la longueur d'un coude de nom (48 px). À 320 × 568, la bande sous le titre
  n'a que 150 px de haut, deux rangées de noms hors du trou, et les noms des
  vedettes pointent vers le centre des deux côtés : sans ce retrait, le
  quatrième ne trouvait plus de place. Le trou y passe d'un rayon de 20 px
  (sous le titre) à 11 px. Au bureau et à la tablette, la bande tient :
  rien ne change. La recherche ne tourne qu'à la mesure de la mise en page,
  pas à chaque image.
- Le repos glisse vers sa nouvelle place avec l'amorti du repos (0,75 s de
  demi-vie), `x` compris : l'arrivée du titre, après l'intro, ne fait pas
  sauter l'objet.

## `src/app/shared/space-scene/rules/scene-bodies.rules.ts`, la vitesse

- La vitesse d'une orbite se calcule sur un rayon d'au moins 0,1
  (`NARROWEST_ORBIT`). Couché, avant D30, la bande du repos donnait un rayon
  nul à 780, 640 et 568 px : la vitesse devenait infinie, la position `NaN`,
  et le dessin s'arrêtait sur une exception à chaque image (le trou de
  `data-hole-*` restait celui du premier cadrage par défaut).

## `src/app/shared/space-scene/rules/planets/label-placement.rules.ts`

- Un nom de planète cherche une place hors du disque du trou, à 4 px près,
  comme il cherche une place libre parmi les panneaux et les autres noms. Le
  renderer ne lui donne le trou que caméra arrivée (à 0,05 de sa visée) et
  les noms voulus : pendant un déplacement ou un effacement, un nom garde la
  place de l'ancienne règle plutôt que de sauter en plein vol. Sans cette
  condition, huit empreintes du bureau bougeaient (les passages vers et
  depuis l'à-propos), que D30 garde.
- Entre deux noms, l'écart se mesure de centre à centre, avec la même
  tolérance de 4 px (`offsetAcross`). Avant D31, il se mesurait de bord
  gauche à bord gauche : deux noms de largeurs différentes pouvaient se
  couvrir, comme « Skyted Companion » (148 px) et « Template .NET »
  (123 px), 9 px l'un sur l'autre à 640 × 360. Le fond des noms est plein
  (`--paper` à 92 %) : le recouvrement se voit. Contre un panneau, la mesure
  reste celle d'avant, de bord gauche à bord gauche : la corriger aussi
  déplaçait sept empreintes du bureau. Un vrai test de recouvrement des
  boîtes, sans tolérance, les déplaçait aussi : le repos du golden du bureau
  a deux noms qui se couvrent de 3,4 px, dans la tolérance.

## `src/app/shared/space-scene/rules/camera/camera-frames.rules.ts`, la tablette

- Debout, à côté d'un panneau (`sidePanelLeft`), l'approche garde le disque
  (2,4 rayons) à 12 px du bord gauche : elle décale le trou vers la droite
  s'il le faut, puis réduit l'échelle à la place restante devant le panneau.
  Au chapitre 3 d'une fiche, à 820 × 1180, le disque sortait à 7 px du bord.
  Couché, le disque déborde à gauche par dessin : rien ne change.

## `src/app/shared/space-scene/engine/motions/camera.motion.ts`

- Un repos qui change compte comme un mouvement de la caméra. Le repos
  s'amortit après que la caméra a lu sa visée : sous le mouvement réduit, une
  nouvelle mesure (le titre de l'accueil qui apparaît, par exemple) entrait
  dans le repos sans que la caméra la rejoigne, et la boucle s'arrêtait,
  faute de mouvement. Le trou restait au repos d'avant, et la capture
  alternait d'un lancement à l'autre selon l'ordre des mesures.
- La caméra est dite arrivée quand, après le pas de l'image, elle est à moins
  de 0,05 de sa visée (`frame.arrived`) : mesurée avant le pas, l'image du
  saut du mouvement réduit était dessinée comme en route, et restait la
  dernière.

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
- D30 ne change que l'arrivée du téléphone : un nom posé sur le trou au repos
  cherche désormais une autre place. `PHONE_LAYOUT` n'a pas de chrome, donc
  pas de repos déplacé, et la fiche n'y est pas debout à côté d'un panneau.
- D31 ne change aucune empreinte : les dispositions du golden n'ont ni vitre
  au coin, ni boîte de barre (`topBar`), et leurs noms ont tous une même
  largeur (120 px par défaut, ou la taille mesurée donnée à tous), où l'écart
  de centre à centre est celui de bord à bord.

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

## `src/app/shared/space-scene/rules/sky/figure-label.rules.ts`

- Le nom d'une constellation allumée se pose au-dessus de sa figure, 16 px
  plus haut. S'il y croise la barre du haut (`topBar`), il passe sous la
  figure, 16 px plus bas, suspendu par son haut. Couché, la barre couvre le
  haut de la moitié gauche, où l'à-propos allume ses figures : à 568 × 320,
  le nom de « Profil » s'écrivait à 15 px du haut, sous la barre. Sa
  largeur ne se mesure (`measureText`, plus l'interlettrage) que si sa
  hauteur croise celle de la barre : au bureau, le dessin est appel pour
  appel celui d'avant.

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
