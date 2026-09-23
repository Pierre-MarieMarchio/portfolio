# La scène spatiale et ses outils de test

Les raisons qui ne se lisent pas dans le code de `src/app/shared/space-scene/`
et de `src/testing/`, rangées par unité (D10).

## `src/app/shared/space-scene/rules/scene-bodies.rules.ts`

- Le système de la maquette est gardé tel quel : ses sept orbites
  (`ORBIT_REFERENCE_COUNT`) sont celles de l'export.

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
