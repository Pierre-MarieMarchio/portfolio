# 07 — Moteur : ce qui contraint son découpage

Relevé du 23 septembre 2026 sur `main` (`60718da`), pour les étapes 2 (golden
étendu) et 7 (moteur) de `docs/audit/phase-3.md`. Faits seulement ; le
découpage cible est dans `docs/architecture/organisation.md`.

## Ce que le golden fige

- Il enregistre la **séquence** des appels et des affectations sur les deux
  contextes (un Proxy, `object-engine.golden.spec.ts:50-77`), pas les
  pixels. Une écriture d'état redondante ajoutée ou retirée, un
  `save()`/`restore()` de plus, changent l'empreinte même si l'image ne bouge
  pas.
- Il appelle `new ObjectEngine(host, ctx, skyCtx, options, area)` et l'API
  publique (`setNodes`, `setLines`, `setInputs`, `setLayout`, `resize`,
  `setVisible`, `setPointer`, `grab`, `turn`, `release`). Changer cette
  surface oblige à toucher le golden : prévoir un adaptateur de test, ou
  accepter une modification unique et justifiée du golden.
- Les deux contextes écrivent dans le même journal, dans cet ordre : matière,
  orbites, planètes et traits d'étiquette, comètes, ciel, constellations.
  Réordonner les couches change l'empreinte.

## État implicite du contexte

- Le trait d'étiquette ne pose ni `strokeStyle` ni `lineWidth` : il hérite de
  l'anneau de sa planète ou de l'anneau de sélection.
- Les traces d'orbite ne posent pas `lineCap` : en mode comètes, elles
  héritent du `'round'` de l'image précédente.
- `textBaseline` n'est jamais remis à zéro.
- Les caches `alphaNow`/`colorNow` sont locaux à un `draw()` ; promus en champ,
  ils sauteraient la première écriture de l'image suivante (vrai bug de
  rendu).
- Par planète, dans l'ordre : bouton, corps, placement du nom (qui **mute**
  les places prises), étiquette, trait. Séparer planètes et étiquettes en deux
  passes change l'ordre et le rendu.

## État partagé et couplages temporels

- `fitOrbits` tourne deux fois par image (`tick` puis `draw`), `home` lissé
  entre les deux ; `resize()` appelle `draw()` hors de `tick`.
- `draw()` écrit `hole`, `disk` (relus par le ciel et `pointUnder`),
  `settling` (relu par le `tick` suivant) et la vitesse des grains (une
  physique dans le dessin).
- `options.rnd` est consommé par `buildScene`, puis par `Sky.build` au premier
  `draw`, puis par le recyclage des étoiles : changer l'ordre de construction
  décale la graine et toutes les empreintes.
- Des specs lisent l'état privé par son nom (`engine-fixes.spec.ts` lit
  `time`, `orbits`, et **remplace `target` sur l'instance** : si `target`
  déménage, ce test passe en silence ; `object-engine.spec.ts` lit `orbits`,
  `turntable`, `disk` ; `sky.spec.ts` lit `stars`).

## Allocations

- La boucle des grains (jusqu'à 7 220 itérations par image) n'alloue rien :
  à garder. Un objet de contexte par grain coûterait 7 220 allocations par
  image ; un contexte d'image réutilisé, aucune.
- Ailleurs, le code alloue déjà à chaque image : environ 85 points par orbite
  affichée pour les traces, des closures (`veil`, `rising`, `tail`), des
  retours d'objets (`sheetFrame`, `positionComet`, `{ panX, panY }`).

## `Math.hypot`

Pas garanti identique au bit près à `Math.sqrt(x*x+y*y)`. Les seuils
(`dist < 1.02`, `d2c < 0.9`, `< SHADOW_EDGE`, `alpha < 0.012`) peuvent
basculer : remplacer une occurrence à la fois, golden relancé. Deux
occurrences sont par grain ; coût relatif non mesuré.

## Trous du golden (à couvrir à l'étape 2)

`aboutBodies: 'comets'` jamais exercé (`comets.ts` non couvert) ; `dpr = 1`
seulement ; un seul viewport (1280×800) ; `skyCtx` jamais nul ;
`measureLabels()` jamais appelé ; `aria-hidden` et `tabIndex` hors
empreinte ; DOM relevé en fin de scène seulement ; `paused`,
`setVisible(false)` jamais vrais ; un seul `setLayout` ; `count` ≤ 7 ;
aperçu au rang 2 seulement, fiche au chapitre 1 seulement.

## Coutures naturelles de `object-engine.ts`

- `tick` : ouverture et entrée 518-531, cadrage 535-542, cibles 543-554, garde
  NaN 557-565, survol 568-578, lissage de `home` 584-592, caméra 593-604,
  horloges 606-619, `idle` 622-628, décision de dessin 630-642,
  replanification 643-658.
- `draw` : préparation 764-804, voile 811-830, grains (position 853-866,
  répulsion 867-885, alpha 886-954, taille et couleur 955-983), planètes
  986-1007, comètes 1009-1029, ciel 1032.
- `drawPlanets` : lignes de la règle 1093-1099, positions 1103-1121, traces
  1127-1195, zones 1199-1211, boucle par planète 1222-1375, remise à zéro
  1378-1385.
- `writeButton`, `writeLabel`, `writeLine` (1393-1467) : trois variantes de
  « n'écrire que ce qui change ».
- `Sky.draw` : préparation 113-178, aplatissement 185-201, boucle des étoiles
  (flux, proximité du trou, traîne, lentille, remplissage) 215-368.
