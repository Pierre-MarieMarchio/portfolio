# 05 — Moteur canvas : structure et clean code

Rapport d'agent, en lecture seule. Périmètre : `shared/ui/object/` (le
composant, `engine/` et les specs), avec `docs/maquette/objet-canvas.md`
comme spécification. Les bugs sont dans le rapport 01 ; ce rapport-ci ne
traite que de la structure.

Points revérifiés dans le code :

- `70 * dpr` écrit deux fois (`object-engine.ts:916`, `sky.ts:126`) ;
- `fitOrbits` appelé dans `drawPlanets` (`object-engine.ts:1220`) ;
- `draw` commence à la ligne 881 et `drawPlanets` à la ligne 1152.

## Constats

**1. [I] ObjectEngine est une god class.** La classe occupe
`object-engine.ts:198-1681`, soit 1 480 lignes, avec une quarantaine de
champs mutables (l. 199-306). Ses responsabilités :

- entrées et nœuds DOM : 329-405 ;
- canvas, zones, pointeur : 407-443, 862-879 ;
- tourne-disque (saisir, tourner, lâcher, rotors, Kepler) : 453-556, 741-787 ;
- boucle et condition d'arrêt : 559-586, 704-732 ;
- caméra (lissage, garde NaN, cadre d'accueil) : 588-703, 789-860 ;
- matière, grain par grain, avec la physique de répulsion : 881-1102 ;
- traces d'orbite : 1245-1315 ;
- planètes, halos et anneaux : 1327-1423 ;
- placement des libellés : 1424-1546 ;
- écritures d'accessibilité sur les boutons : 1564-1593 ;
- libellés et lignes de la règle : 1595-1638 ;
- ciel et constellations : 1640-1680.

**Ce que la spec impose.** Elle impose les algorithmes, les valeurs et les
règles de performance du §10 : pas de requête DOM dans la boucle, mesurer
avant d'écrire, `fillRect`, n'écrire un style que s'il change, arrêter la
boucle, ralentir sur l'incrément. Elle n'impose ni une classe unique, ni la
découpe des méthodes, ni les noms. La maquette avait déjà 8 méthodes
séparées, et le code s'écarte déjà de son texte (§9, le couple). « Porter
tel quel » ne bloque donc pas un refactor.

**2. [I] Méthodes trop longues.**

- `drawPlanets` (1152-1557) : environ 405 lignes, dont 40 de paramètres. La
  recherche d'emplacement des libellés (1509-1526) empile 6 niveaux, et trois
  closures sont recréées pour chaque planète à chaque image.
- `draw` (881-1150) : environ 270 lignes, dont une boucle de 140 lignes sur
  les grains et un ternaire à 5 branches (1084-1093).
- `Sky.draw` (`sky.ts:105-369`) : environ 265 lignes.
- `tick` (588-733) : environ 145 lignes.
- `comets.ts:82-230` : environ 150 lignes.
- Plus courts mais longs : `buildScene` (`scene.ts:57-163`),
  `constellations.ts:148-243`, et `boot` (`object.component.ts:229-309`).

**3. [I] Nombres magiques.** `object-engine.ts` contient environ 240
littéraux numériques pour 10 constantes nommées ; le moteur entier en compte
environ 700.

- **Portée du curseur.** `70 * dpr` est écrit dans `object-engine.ts:916` et
  dans `sky.ts:126`, alors que la spec exige une seule valeur.
- **Coupe de l'ombre.** 1,02 dans `sky.ts:258` et `object-engine.ts:1028,1288`,
  1,05 dans `constellations.ts:180`, 1,18 dans `comets.ts:116`.
- **0,42.** 23 occurrences, pour au moins 4 sens différents.
- **`0.018 / 0.022`.** Copié entre `object-engine.ts:904` et `sky.ts:135`.
- **Seuils.** 0,02, 0,002 et 0,0002 sont répétés sans nom.

**4. [I] Duplications.**

- La projection roulis-aplatissement : `object-engine.ts:859,981,1230,1282`
  et `comets.ts:109,132` ; l'inverse est à 546.
- `flatten = 0.88 + 0.34*elev` : lignes 856 et 905.
- `opening` : `camera.ts:86` et `comets.ts:76`.
- `Math.min(w/6.6, h/3.2)` : `camera.ts:129,184,240`, alors que
  `referenceRadius` existe.
- `phase * v * 0.42` : `scene.ts:203,278`, `camera.ts:203,236`,
  `object-engine.ts:1278` et `comets.ts:51`.
- `halfLifeStep` réimplémenté : `object-engine.ts:745,750,759` et `sky.ts:169`.
- Le halo radial : `object-engine.ts:1390`, `comets.ts:193`,
  `constellations.ts:215`.
- La police du canvas : `comets.ts:219` et `constellations.ts:237`.
- Trois `writeX` quasi identiques (1564-1638), qu'un `StyleWriter` générique
  remplacerait.

**5. [I] Couplages temporels et effets de bord cachés.**

- **Orbites lues avant d'être calculées.** `fitOrbits`, appelé dans
  `drawPlanets` (1220), modifie `orbit.rb` et `orbit.v`. Mais `target()`,
  `sheetFrame`, `previewFrame` et `shareOrbitsTurn` (780) lisent ces valeurs
  avant le dessin, donc celles de l'image précédente. À la première image,
  ils lisent `rb = 1.6` (`scene.ts:177`).
- **`draw()` fait plus que dessiner.** Il écrit `this.disk`, `this.hole` et
  `this.settling`. Il intègre la physique des grains (`p.dx *= 0.88`, 997),
  avec un facteur fixe par image, contraire à la spec §2. Il écrit
  l'accessibilité dans le DOM.
- **Écrire puis lire.** `resize()` appelle `draw()` en synchrone (416), puis
  le composant lit la mise en page (`object.component.ts:267-270`). C'est
  contraire au §10.2.
- **`idle` en retard d'une image.** Il est mis à jour après `phase`
  (692 → 697).
- **`traveling()` met en cache.** Il a l'air d'un accesseur mais met en
  cache (580), et il porte le même nom que la fonction importée.
- **`camSum` fragile.** Il additionne des grandeurs hétérogènes (789), si
  bien que deux variations opposées peuvent s'annuler.
- **`Grain` mélangé.** Il mêle champs `readonly` et champs d'état écrits
  pendant l'image (`scene.ts:27-31`).

**6. [I] Séparation entre pur et dessin, et tests.**

- Testés : `math`, `camera`, `traveling`, `Sky`, le tourne-disque et le
  composant.
- Non testés, bien que purs : `buildScene`, `placeGrain`, `positionOrbit`,
  `fitOrbits` et `positionComet`.
- Non testables en l'état : le placement des libellés, `veil`, et la règle
  « couvert ou hors cadre, donc inerte », pourtant critique pour
  l'accessibilité.
- `object-engine.spec.ts:106` lit l'état privé du moteur
  (`engine as unknown as HandView`) : il faut extraire un `Turntable`.

**7. [I] object.component.ts.** Le composant fait tout à la fois :

- entrées vers l'instantané du moteur ;
- textes d'accessibilité ;
- démarrage et couleurs ;
- taille des canvas ;
- mesure de tout le document ;
- geste global (`pointerdown` en capture, `body.style.cursor`) ;
- double tap.

Ses `querySelectorAll` (353, 390) appellent `getComputedStyle` deux fois
par panneau, à chaque rendu et à chaque `transitionend` de la page.

Correction :

- directives `appObjectPanel="sheet"` et `appObjectLine [rank]`, inscrites
  dans un `ObjectLayoutRegistry` ;
- une classe `HandGesture` ;
- une fonction pure `canvasPixels(rect, dpr, budget)`.

**8. [C à I] Nommage.**

- `Traveling` est un franglais (de « travelling »).
- Abréviations : `Zone{l,r,t,b,o}`, `Orbit.k/rb/v`, `Grain.w` (une vitesse
  angulaire, alors que `w` désigne la largeur partout ailleurs),
  `gr2/ph2/ph3`, `e`, `t`, `kc`, `km`, `fo`, `fR`, `fZ`, `att`, `vn`, `l1`,
  `nx2`, `d2c`, `livelyL`, `Rb`, `sc`.
- Collisions de noms : `about`, `home`, `lit`, `measure`, `visible`.
- Les champs de `Frame` (`i/s/ev/az`) suivent la spec : acceptable s'ils
  sont documentés.

## Décomposition cible

```
object/
  object.component.ts          entrées/sorties, modèle du gabarit, démarrage
  object-layout.registry.ts    panneaux et lignes inscrits, mesurés d'un bloc
  object-panel.directive.ts    [appObjectPanel]="role"
  object-line.directive.ts     [appObjectLine] + rank
  hand-gesture.ts              pointerdown/move/up, curseur, seuil de glissé
  canvas-size.ts               pur : dpr plafonné et budget de pixels
  engine/
    object-engine.ts           façade (API inchangée) + boucle, ~250 l.
    constants.ts               POINTER_REACH, SHADOW_CUT, PHASE_RATE, seuils…
    projection.ts              DiskPose, project(), flatten(), inShadow()
    camera-rig.ts              état caméra, lissage, garde NaN, frameFor(view)
    turntable.ts               rotors, prise, trace de la main, Kepler, pointUnder
    panels.ts                  Zone, zonesFrom, veil, covers
    layers/matter.ts           boucle des grains + grainAlpha/Color/Size purs
    layers/orbit-traces.ts     84 échantillons, 7 niveaux de profondeur
    layers/planets.ts          computePlanets (pur) + drawPlanet
    labels.ts                  placeLabel() / indexLabel() purs, testés
    dom-writer.ts              StyleWriter générique
    draw-kit.ts                drawHalo, police canvas
    sky.ts, constellations.ts, comets.ts, traveling.ts, scene.ts, math.ts   (inchangés)
```

## Avis

Tout refaire maintenant ne vaut pas le coup :

- le code marche, il est très commenté et bien couvert par les specs ;
- aucun test ne protège le rendu visuel ;
- la boucle des grains est un chemin critique : extraire des closures ou des
  objets par grain peut coûter des images par seconde.

Ordre proposé :

1. un test « golden » : un contexte canvas enregistreur, une graine fixe et
   des instants fixes, dont on hache les appels `fillRect` et `arc` ;
2. `constants.ts` et `projection.ts`, ce qui corrige aussi l'écart des 70 px ;
3. extraire `Turntable`, ce qui supprime la lecture forcée de l'état privé
   dans le spec ;
4. extraire `labels.ts` et `dom-writer.ts`, et tester la logique
   d'accessibilité ;
5. passer le composant aux directives et au registre.

La boucle des grains de `draw` reste telle quelle.
