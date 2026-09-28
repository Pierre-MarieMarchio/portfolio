# La scène spatiale et ses outils de test

Les raisons qui ne se lisent pas dans le code de `src/app/shared/space-scene/`
et de `src/testing/`, rangées par unité (D10).

## `src/app/shared/space-scene/rules/scene-bodies.rules.ts`

- Le système de la maquette est gardé tel quel : ses sept orbites
  (`ORBIT_REFERENCE_COUNT`) sont celles de l'export.
- Au téléphone (D35), `fitOrbits` mesure la place en rayons d'un trou deux
  fois plus grand (`PHONE_ORBITS.growth`), puisque le cadrage le double : les
  orbites gardent à peu près leur taille à l'écran au lieu de doubler avec
  lui. Elles ne descendent pas sous 3,2 rayons (la plus proche) ni sous 4,8
  (la plus lointaine) : un corps reste à 2,9 rayons au moins de l'empreinte
  du disque, et les orbites extérieures peuvent sortir de l'écran. La
  fonction rend l'orbite extérieure qu'aurait donnée la règle d'avant, pour
  que la vue d'ensemble et l'à-propos du téléphone partent de leur échelle
  d'aujourd'hui avant de la doubler.

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
- `cornerBandTop` n'existe que couché : le haut du plus haut panneau bas
  (haut sous le milieu), trop court pour être latéral, collé au bord droit
  et au bas de l'écran. C'est la vitre repliée couchée (mesurée 316,303 →
  640,360) ; l'aperçu couché, plus haut qu'un quart de l'écran, est un
  panneau au coin, pas un bandeau. Le ciel libre (`freeSkyOf`) y prend toute
  la largeur au-dessus de ce bandeau, comme au-dessus de la vitre debout ;
  l'approche de la fiche y centre la paire trou-planète, pas la planète
  seule (`isPairCentred`) : centrer la planète, comme debout, poussait le
  trou vers la gauche. Mesuré, le trou avance de 25 % de la largeur sur
  l'index et de 13 à 14 % sur la fiche, aux quatre tailles, entier. Rendre
  `isBottomBand` plus large aurait déplacé l'approche et le gros plan du
  téléphone debout (D33).
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
- Le gros plan à côté d'une vitre couchée (`holeRoomBeside`, D31) et le
  gros plan debout rangé loin du chrome (`closeUpClearOfChrome`, D33) ne
  servaient qu'au téléphone, seul à avoir une vitre au coin ou un bandeau :
  ils sont retirés, et le cadrage du trou au téléphone les remplace
  (`hole-focus.rules.ts`, D35). Le gros plan du bureau et de la tablette
  reste `closeUpFrame`, tel quel.
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

- Aux formats `phone` et `tablet` seulement (`SceneInputs.touch`, lu par le
  composant sur `DisplayFormatService`), un nom de planète, caméra arrivée,
  évite aussi le disque dessiné et le bouton de 48 px de chaque autre
  planète. Le disque est l'ellipse de `drawnDisc` (`pointer.rules.ts`) :
  2,4 rayons dans son plan, la portée que `DISC_ON_SCREEN` garde déjà sur
  l'écran, aplatie par l'ouverture et le roulis, et 1,3 rayon au moins en
  hauteur pour l'anneau lentillé ; le test est exact (le rectangle du nom
  ramené dans le repère du disque). Sans la condition du format, neuf
  empreintes du bureau bougeaient : au bureau aussi, une planète qui passe
  devant le trou pendant un tour à la main pose son nom sur le disque. Le
  bureau garde donc l'ancienne règle, au pixel près.
- Au doigt, quand aucune rangée de la recherche ordinaire (pas de la hauteur
  d'un nom) n'est libre, le nom essaie les rangées posées juste au-dessus et
  au-dessous de chaque bouton (`rowsClearOf`) : à 320 × 568, les quatre
  boutons tiennent en 65 px sous le titre, et les seules places sont les
  bandes étroites au-dessus et au-dessous d'eux ; sans elles, aucun des
  quatre noms ne s'affichait.
- Au doigt aussi, l'écart entre deux noms n'a plus de tolérance : les 4 px
  de D31 laissaient « Skyted Companion » et « Template .NET » se toucher de
  3 px sous WebKit à 780 × 360.

## `src/app/shared/space-scene/rules/figures/figure-room.rules.ts`

- Quand la scène a un ciel libre (`freeSkyOf` : un bandeau, un panneau
  latéral debout, une vitre au coin), la figure allumée et son nom se
  rangent dans ce ciel, rentré de 8 px (`figureRoomOf`) : sous la barre, au
  gauche ou au-dessus de la vitre, dans l'écran. La figure glisse, décalée
  de sa part d'allumage : elle rejoint sa place à mesure qu'elle s'allume,
  et le nom, pendant ce glissement, reste serré dans le ciel
  (`nameInRoom`). Le nom se pose au-dessus de la figure, sinon au-dessous,
  puis la paire s'écarte du disque (à gauche, à droite, au-dessus,
  au-dessous de sa boîte) jusqu'à ce que le nom ne le croise plus. Avant, à
  390 × 844, « COMPÉTENCES » commençait à x = 0 et la figure sortait à
  gauche ; à 780 × 360 elle passait sous la barre ; à 568 × 320,
  « PARCOURS » traversait le disque. Sans ciel libre (le bureau), la figure
  garde sa place et son nom la règle de D31.

## `src/app/shared/space-scene/rules/figures/figure-arrangement.rules.ts`

- Les figures non allumées se posent une à une, la plus grande d'abord, sur
  la meilleure de 82 places (leur place d'origine ramenée dans le ciel, puis
  une grille de 9 × 9), sans croiser la boîte déjà prise ni une figure déjà
  posée, à 10 px près. Une place sur le disque coûte la diagonale du ciel :
  toute place hors du disque passe devant. L'ombre du trou est d'abord
  interdite, puis tolérée si aucune échelle ne tient sans elle. L'échelle,
  commune à toutes, descend de 1 à 0,42 ; si rien ne tient, les figures sont
  seulement ramenées dans le ciel.

## `src/app/shared/space-scene/rules/figures/phone-figures.rules.ts`

- Au téléphone (D42), une disposition se calcule pour chaque figure
  allumée : l'allumée prend la place de `figureInRoom` (D33), sa boîte et
  celle de son nom sont prises, les trois autres se rangent autour
  (`arrangeFigures`), l'ombre comptée à 1,05 rayon plus la portée d'une
  étoile.
- Le rangement part des figures sans dérive ni parallaxe et du trou avant le
  pincement : il ne se refait que si la taille, le ciel libre ou le trou
  bougent d'un pixel, ou si les noms changent (`phoneFigures`). La place
  dessinée est la moyenne des dispositions pesée par l'allumage de la
  caméra, d'où le glissé au changement de volet. Ce module est dans le
  morceau paresseux du téléphone (D39), par `hole-focus.rules.ts`.
- Mesuré à 320 × 568, 390 × 844, 780 × 360 et 568 × 320 : les non allumées
  tiennent entières à l'échelle 1, sauf à 568 × 320 (0,9 quand le Dragon
  n'est pas allumé). À 320 × 568, le Dragon allumé perd 4 étoiles sur 9 sous
  l'ombre : D33 n'écarte du disque que son nom.

## `src/app/shared/space-scene/rules/figures/figure-target.rules.ts`

- La cible d'une figure couvre la boîte de ses étoiles (portée comprise),
  agrandie à 44 × 44 px autour de son centre. Elle est inerte hors de
  l'à-propos (ou avant que les figures y soient à moitié montrées), si son
  centre sort de l'écran ou tombe sous un panneau (`isUnderPanel`, la marge
  des planètes).

## `src/app/shared/space-scene/engine/renderers/sky/figure-targets.renderer.ts`

- Une cible s'écrit d'une seule chaîne `style.cssText` (transform, largeur,
  hauteur, `pointer-events: auto`), comparée à la précédente : une écriture
  par changement, jamais de lecture. Inerte, elle ne garde que
  `pointer-events: none`. `aria-hidden` et `tabIndex` s'écrivent à la
  première image, puis au passage d'un état à l'autre : le gabarit les pose
  inertes, et sans l'écriture de la première image une cible active dès
  l'arrivée restait `aria-hidden`, hors tabulation, et la feuille lui
  laissait `pointer-events: none` (mesuré au navigateur à 1280 × 800 et
  390 × 844 : aucune cible ne recevait le pointeur).

## `src/app/shared/space-scene/engine/renderers/sky/constellations.renderer.ts`

- L'éclat de 45 % et le grossissement de 25 % ne valent que dans
  l'à-propos : le fondu de sortie repart des 20 % d'avant, et les empreintes
  du bureau hors de l'à-propos ne bougent pas (D42).
- Le survol se lit sur le pointeur que le moteur suit déjà (`hoverPoint`,
  sans le seuil du mouvement réduit que garde la lentille), dans la boîte de
  la cible non inerte : une boîte par figure et par image, pas d'écouteur.

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
- Le fondu des figures compte aussi comme un mouvement (D42) : en pause, la
  caméra immobile arrêtait la boucle après une image, et la figure choisie
  restait allumée à moitié (0,75 d'éclat mesuré au lieu de 0,95).

## `src/app/shared/space-scene/engine/renderers/hole-mark.renderer.ts`

- La scène écrit le centre et le rayon du trou, en pixels CSS au dixième,
  dans `data-hole-x`, `data-hole-y` et `data-hole-radius` de sa scène
  (`.stage`) : l'e2e lit là où la caméra pose l'objet, que le canvas ne dit
  pas. L'écriture ne se fait que si la valeur change, dans le DOM et non dans
  un signal, comme les boutons des planètes.
- Le disque dessiné s'y écrit aussi (`data-disc-width`, `data-disc-height`,
  les demi-axes en pixels CSS, et `data-disc-roll`, le roulis en radians) :
  l'e2e vérifie qu'un nom ne le croise pas avec la même géométrie que le
  moteur.
- `data-target-x` et `data-target-y` disent où est dessinée la planète visée
  (approche d'une fiche, gros plan de l'aperçu), après la répulsion ; vides
  sinon. La fiche n'a pas de bouton de planète (D27) : l'e2e lit là le point
  qu'elle doit garder à l'écran, au-dessus ou à gauche de la vitre (D35).

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
- D33 ne change que l'à-propos du téléphone (`aside`) : `PHONE_LAYOUT` a un
  bandeau, donc un ciel libre, où la figure allumée se range. Les
  dispositions du bureau n'ont pas de ciel libre, et le golden ne passe pas
  `touch` : les noms y gardent l'ancienne règle, et l'arrivée du téléphone
  ne bouge pas.
- D35 change les cinq empreintes du téléphone, et elles seules : le test
  passe désormais le format `phone`, qui double le trou de chaque vue dans
  le ciel libre, resserre les orbites sur le trou agrandi et ne nomme que la
  planète visée. Les autres dispositions ne passent pas de format (le bureau
  par défaut) et gardent leurs empreintes. Le gros plan du téléphone ne passe
  plus par `closeUpClearOfChrome` : sans chrome dans `PHONE_LAYOUT`, cette
  règle ne le touchait pas.

## `src/app/shared/space-scene/engine/space-scene.engine.spec.ts`

- Le gros plan à côté d'une vitre couchée se teste au format `phone` : la
  règle qui le rangeait loin du chrome (`holeRoomBeside`, D31) est remplacée
  par celle du trou au téléphone (D35), qui ne s'applique qu'à ce format.
- La densité après une rotation se compare à une scène jumelle, au même
  instant : le nombre de grains dessinés varie d'une image à l'autre selon
  ceux qui passent derrière le trou, plus nombreux quand le repos se relève.

## `src/app/shared/space-scene/engine/motions/grains.motion.ts`

- La réserve est tirée pour la densité pleine, et la part allumée suit l'aire
  de la fenêtre (`densityShare`). Recalculée après un redimensionnement, elle
  rejoint sa valeur en 0,55 s de demi-vie : les points s'allument ou
  s'éteignent un à un, par le tirage déterministe, sans être retirés. Au
  bureau, la part vaut 1 et le dessin est celui d'avant.
- L'entrée de la matière dure 6,2 s ; pressée (D41), sa durée est fixée une
  fois, au moment où elle l'est, pour finir ce qui reste dans le temps donné
  (`hastenedEntrySpan`). Recalculée à chaque image, elle ralentirait avec ce
  qui reste et ne finirait jamais.

## `src/app/shared/space-scene/engine/motions/clock.motion.ts`

- Une traversée pressée (D41) garde ses courbes : seule son horloge accélère,
  d'un facteur fixé au moment où la scène se pose (`crossingPace`), puis
  revient à 1 à la fin de la traversée. Le ciel lit la même horloge : son
  écartement reste monotone et sa remise à plat a lieu comme à la fin
  normale. La rotation, les marques et le reste de la scène gardent le temps
  réel.

## `src/app/shared/space-scene/engine/space-scene.engine.ts`

- Un redimensionnement dessine tout de suite, sauf pour une scène posée dès
  l'ouverture dont la caméra n'a pas encore d'image : sans traversée pour
  réduire l'objet à un point, ce dessin le montrerait à une taille qui n'est
  pas celle de la vue. Pendant une traversée, il reste : les goldens en
  dépendent.

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
- Au téléphone (D36), les traînées passent par `TrailBatchRenderer`
  (`trail-batch.renderer.ts`, paliers dans `rules/sky/trail-steps.rules.ts`) :
  deux teintes, huit paliers d'éclat (de 0,8 à 0,012, × 0,55 environ à chaque
  palier) et quatre d'épaisseur (0,6 à 2,4 px CSS) font au plus 64 `stroke`
  par image. Une traînée prend le palier le plus proche vers le haut. La tête
  va jusqu'à 45 % de la traînée, là où le dégradé commençait à pâlir ; la
  queue prend la moitié de son éclat, ce que vaut le dégradé au milieu de la
  queue. Seule une traînée plus pâle que la moitié du dernier palier n'est
  pas tracée. Les points des groupes vivent dans des tableaux plats réutilisés
  d'une image à l'autre : aucune allocation par image. Les traînées groupées
  se tracent après les points, et non chacune sous le sien. Le téléphone ne
  chauffe pas les dégradés à la première image : il n'en trace plus.

## `src/app/shared/space-scene/rules/sky/star-field.rules.ts`

- Une étoile pour 3600 px² divisés par le ratio : le nombre d'étoiles suit le
  ratio du canvas. Au téléphone (D36), il est compté à un ratio de 2, celui
  d'avant le plafond à 1,5 : sans cela le ciel perdait un quart de ses
  étoiles, et les traînées de la traversée autant.

## `src/app/shared/space-scene/engine/renderers/sky/star-sky.renderer.spec.ts`

- Le point de fuite ne devance le virage que de quelques pixels : le spec
  prend le centre de l'image pour lui.

## `src/app/shared/space-scene/rules/figures/figure-label.rules.ts`

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

## `src/app/shared/space-scene/engine/motions/zoom.motion.ts`

- Le facteur se pose après la caméra, sur `cx`, `cy` et `radius` : tout ce
  qui se dessine autour du trou (disque, orbites, planètes, noms, comètes,
  ombre du ciel) suit sans rien savoir du zoom. Le ciel de fond ne bouge
  pas ; les grains gardent leur taille et s'écartent.
- Le zoom s'écrit comme un point fixe (l'ancre) et un facteur :
  `x' = x · f + ancre · (1 − f)`. À 1, `lay` ne touche à rien, ce qui garde
  le golden à l'identique au bit près.
- Pendant un pincement, le facteur suit les doigts sans amorti ; relâché, il
  reste. Le double toucher et le retour à 1 s'amortissent comme la caméra
  (demi-vie 0,55 s) et se posent à 0,002 du but, le seuil de `easeOpening` :
  à 0,0002, la boucle tournait encore sept secondes pour un écart que l'œil
  ne voit pas.
- Un changement de taille du canvas remet le facteur à 1, l'ancre suivant
  les nouvelles proportions, et réveille la boucle : `resize` trace une image
  mais ne relance pas l'animation, et la boucle arrêtée gardait le zoom.
- L'objet `hole` est à lui et réutilisé : pas d'allocation par image.

## `src/app/shared/space-scene/rules/camera/zoom.rules.ts`

- `anchorKeeping` garde le point pris sous les doigts sous leur milieu,
  puis borne le décalage pour que le ciel zoomé couvre encore le canvas.
  Ancre et décalage se déduisent l'un de l'autre, et à 1 le décalage borné
  vaut 0 : relâcher à 1 rend le cadrage de la vue, sans reste.
- `isSameFraming` compare le genre de cadrage, le corps visé, le chapitre et
  la section allumée : un survol ou une sélection au relevé ne remettent pas
  le facteur à 1.

## `src/app/shared/space-scene/trackers/zoom-gesture.tracker.ts`

- Seuls les doigts comptent (`pointerType: 'touch'`), et seulement hors du
  format `desktop` : un écran tactile de bureau garde le pincement natif.
  Le tracker n'est démarré qu'aux formats `phone` et `tablet` (D43) : c'est
  l'enveloppe de `SpaceSceneComponent` qui tient la règle du format, et
  qui l'arrête quand le format devient `desktop`.
- Un doigt compte s'il se pose sur le ciel ou sur une cible de la scène
  (`[data-scene-target]`, `isOnScene`) ; le double toucher, lui, ne compte
  que les taps posés sur le ciel (`isOnSky`) : deux taps sur une planète
  restent à la planète, qui révèle puis ouvre. Les boutons de planète
  prennent `touch-action: none` au téléphone et à la tablette, sans quoi un
  doigt posé sur l'un d'eux rendrait le pincement à la page.
- Un toucher est un tap s'il dure moins de 300 ms et bouge de moins de 6 px ;
  deux taps à moins de 320 ms et 32 px font un double toucher. Un geste qui
  a pincé ne compte jamais comme tap.
- Le clic avalé après un pincement passe par `ClickAbsorberService`, le même
  que le tour de l'objet : une seule écoute à la fois, levée au prochain
  appui.

## `src/app/shared/space-scene/components/space-scene/space-scene.component.scss`

- Aux formats `phone` et `tablet`, le canvas du ciel reçoit le pointeur
  (`pointer-events: auto`) et porte `touch-action: none`. C'est le plus bas
  des calques positionnés : il ne prend que les touchers qui tombaient avant
  sur `.scene`, et la règle ne s'hérite pas vers la vitre, le chrome ou les
  planètes, qui sont ses voisins, pas ses enfants.

## `src/app/shared/space-scene/engine/frame-loop.engine.ts`

- La boucle d'images (réveil, arrêt, visibilité, pas de temps borné à 60 ms)
  sort du moteur à l'identique : le moteur dépassait sa taille permise avec
  l'API du zoom. `EngineHost` y vit et reste exporté par le moteur.
- Au doigt (D36), une image demandée à moins de 10,5 ms de la précédente est
  sautée et redemandée ; le pas de temps part de la dernière image dessinée,
  il couvre donc l'intervalle entier. 10,5 ms laisse passer 90 Hz (11,1 ms) et
  coupe 120 Hz (8,3 ms). Le golden du téléphone a bougé aussi pour cela : le
  double d'hôte finit certains pas par un reste de moins de 10,5 ms, qui est
  désormais sauté. Le dessin que `resize` force hors de la boucle n'est pas
  compté : le canvas redimensionné est vide jusqu'à lui.

## `src/app/shared/space-scene/rules/hole-focus.rules.ts`

- Au téléphone (D35), chaque vue part du cadrage d'aujourd'hui et fait
  grandir le trou jusqu'à deux fois son rayon, tant que son disque dessiné
  (2,4 rayons, la même ellipse que `drawnDisc`) tient dans une pièce vide du
  ciel, à 12 px de ses bords. Les pièces sont les rectangles vides que
  laissent le chrome et la vitre, prolongée jusqu'au bord de l'écran
  (`skyRooms`) ; elles se recalculent quand la disposition change, pas à
  chaque image (`FramingScene.sky`).
- Le rayon qui tient se calcule sans itérer : l'étendue du groupe (disque,
  planète visée, son nom) est, sur chaque axe, un maximum de fonctions
  affines du rayon, et chaque paire bord haut / bord bas donne une borne.
- Avec une planète visée (fiche, aperçu, rangée choisie de l'index, planète
  touchée à l'accueil), le groupe comprend son bouton (24 px) et une place
  pour son nom, sous elle, au-dessus, ou à côté. Treize angles sur l'avant
  du disque sont essayés, plus celui d'aujourd'hui ; une planète à moins de
  2,9 rayons de l'empreinte du disque est écartée. À rayon égal, l'angle
  d'aujourd'hui gagne, puis le plus proche, puis la pièce la plus proche du
  trou : le cadrage ne tourne que s'il le faut.
- Le nom réservé sous ou au-dessus de la planète se place centré, ou décalé
  vers l'extérieur du trou ; `placeName` essaie les mêmes places dans le même
  ordre quand ses deux flancs sont pris (`stacks`).
- Si le nom ne tient nulle part, la planète seule est réservée. Une vue ne
  devient jamais plus petite qu'aujourd'hui, sauf le gros plan de l'aperçu :
  couché, le ciel sous le titre n'a pas la place d'un trou de la taille
  d'aujourd'hui avec sa planète et son nom, et le trou rapetisse plutôt que
  de passer sous le titre ou de cacher la planète.
- La fiche couchée à 844 × 390 s'arrête sous la plus grande taille que son
  disque seul permettrait (77 px au lieu de 85) : la planète et son nom
  doivent tenir à gauche de la vitre avec lui.

## `src/app/shared/space-scene/rules/planets/planet-focus.rules.ts`

- Au téléphone (`isSparse`, D35), un nom ne s'écrit que pour la planète qui
  compte : celle que le doigt désigne au repos, celle du gros plan, celle de
  l'approche. Les numéros de l'index ne s'écrivent que pour la rangée
  choisie ou désignée. Les boutons des autres planètes restent.

## `src/app/shared/space-scene/rules/planets/label-placement.rules.ts`

- Au téléphone, un nom se mesure aux panneaux boîte contre boîte (de centre
  à centre), comme entre deux noms : mesuré de bord gauche à bord gauche, un
  nom à gauche de la vitre couchée la croisait tant qu'il n'était pas à la
  moitié de sa largeur, et la fiche couchée n'en écrivait aucun. Le bureau et
  la tablette gardent l'ancienne mesure (D31).
- Quand ses deux flancs sont pris, un nom du téléphone se pose sous sa
  planète, puis au-dessus, centré ou décalé vers l'extérieur, sans trait de
  rappel.
