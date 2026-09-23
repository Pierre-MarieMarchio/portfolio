# 01 — Moteur canvas : bugs, fuites, cohérence des entrées

Rapport d'agent, en lecture seule. Périmètre : `src/app/shared/ui/object/`
(le composant et `engine/`) et `core/services/browser-environment.service.ts`.
Les chemins sont relatifs à `shared/ui/object/`. Les points `orbitRank`,
`scene.ts:312`, `object-engine.ts:596` et `:820`, les textes et l'export mort
ont été revérifiés dans le code.

## 1. Nombre de corps, `featured`, cadrage

- **[B] `engine/math.ts:37-44` : orbites calculées sur tous les corps.**
  `orbitRank` répartit les orbites selon une loi exponentielle
  (`Math.pow(1.42, k)`) normalisée sur `count`, alors que l'accueil n'affiche
  que les `featured` premiers.
  - Avec 12 corps, `spread(11)` vaut environ 47. Les 4 corps mis en avant ont
    k ≤ 0,043 : ils s'empilent près de `rMin`, et seule la répulsion de 58 px
    les sépare. Le cadrage de l'accueil est prévu pour une orbite de 6,9 qui
    n'est pas affichée, d'où un grand vide.
  - Avec 3 corps, tout est correct.
  - Correction : calculer `orbitRank(i, shown)` à l'accueil, ou une
    progression géométrique bornée qui ne dépend pas de n.
- **[I] `engine/scene.ts:312` : le plancher peut dépasser la place.**
  `Math.max(4.6, …)` peut dépasser `maxH`. Sur un téléphone d'environ 375 px,
  `maxH` vaut à peu près 4,3 : l'orbite externe sort de la marge et ses
  boutons deviennent inertes. Cela contredit le commentaire des lignes
  291-293 (« no floor above the room »). Correction : `min(6.9, maxH, maxV)`,
  puis réduire l'échelle.
- **[C] `engine/object-engine.ts:1205-1206,1264` : `featured` hors bornes.**
  Un `featured` supérieur à `count` ou inférieur ou égal à 0 est géré sans
  NaN. 3 ou 5 fonctionnent : décalage d'entrée de `i*0.42` (ligne 1213),
  libellés nommés seulement si `!cold` (ligne 1480).
- **[C] `engine/math.ts:93-126` : répulsion insuffisante à 12 corps.** Dans
  le relevé, 4 passes ne garantissent plus 58 px d'écart, et les cibles de
  48 px se chevauchent. Correction : faire varier `passes` avec n.
- **Tables de taille fixe.** `jitter[i % 7]` (`scene.ts:179`) et
  `offsets[k % 6]` (`math.ts:40`) tiennent quel que soit n. Tables fixes :
  `SHEET_APPROACHES` (`camera.ts:64`, 4 entrées ; un chapitre 5 et plus est
  ramené au dernier), `CONSTELLATIONS` et `COMETS` (4 entrées).

## 2. Fuites, boucle rAF

Tout est retiré à la destruction (`object.component.ts:179-186,266-306`) :
ResizeObserver, IntersectionObserver, `visibilitychange`, media query,
écouteurs. La boucle s'arrête quand l'onglet est masqué ou que le canvas est
hors champ (`engine:573`), et en mouvement réduit une fois stabilisée.

- **[C] `object.component.ts:307`.** `whenFontsReady` ne s'annule pas ; c'est
  sans effet grâce au garde `engine === null`.
- **[I] `object-engine.ts:583,650,682` : traversée rejouée.** Passer du
  mouvement réduit au mouvement normal rejoue la traversée. En mouvement
  réduit, `time` reste à 0, et `traveling(0, false)` réduit l'objet à un
  point. Correction : `time = TRAVELING_END` à la bascule.
- **[I] `object-engine.ts:684-686,1210-1213` : repères jamais levés.**
  `marksTime` n'avance que si `animated`. Avec une pause avant `revealed`,
  les repères restent invisibles. Constat difficilement atteignable, car le
  rail de contact est masqué pendant l'attente.
- **[C] `object-engine.ts:429-431` : pointeur jamais relâché.**
  `setPointer(null)` n'est jamais appelé, faute d'écouteur `pointerleave` ou
  `blur`.

## 3. Cohérence entrées ↔ moteur

- **[I] `object-engine.ts:820,823` : `focus = -1` cadre la planète 0.**
  `Math.max(0, focus)` cadre la planète 0 alors qu'aucune n'est lue. En
  pratique inatteignable aujourd'hui (la vue devient `not-found`).
- **[I] `object-engine.ts:596,690,910,832` : `preview` agit sur toutes les
  vues.** `preview >= 0` réduit le rayon de 6 % et freine la rotation à
  0,12, alors que `previewRank` (`pages/station/station.component.ts:162`) ne
  dépend pas de la vue. Correction : ouvrir seulement à l'accueil, et
  seulement pour un rang affiché :
  `view === 'home' && preview >= 0 && preview < shown`.
- **[C] `object-engine.ts:1143` : `part` borné à 3 en dur.**
  `clamp(inputs.part, 0, 3)` alors que la ligne 624 utilise
  `CONSTELLATIONS.length - 1`. Le commentaire de `object.component.ts:77` a
  la même limite.
- **[C] `engine/camera.ts:255` : garde NaN incomplète.** `isFiniteFrame` ne
  vérifie ni `i`, ni `x`, ni `y`.
- **[C] `object.component.ts:239,396` : deux viewports de repli.** L'un fait
  1280×800, l'autre 1200×800.
- **[C] `object.component.ts:251-253` : couleurs lues une fois.** `--ink` et
  `--accent` ne sont lus qu'au démarrage, alors que la spec (§10.1) prévoit
  de suivre un changement.

## 4. Textes visibles en dur (FR/EN)

- `object.component.ts:129` : `Sélectionner ${number} — ${body.title} dans le relevé`.
- `object.component.ts:130` : `Aperçu du projet ${body.title}`.
- `engine/constellations.ts:134-139` : `PART_LABELS`, dessinés à la ligne 240
  et réutilisés dans `engine/comets.ts:452`.
- `toUpperCase()` (`constellations.ts:240`, `comets.ts:466`) : doit devenir
  `toLocaleUpperCase(lang)`.

Correction : les libellés arrivent en entrées.

## 5. Code mort, doublons, commentaires faux

- **[I] `engine/math.ts:34-35`, `index.ts:1` : invariant non tenu.** Le
  commentaire dit « the home rule reads this same function », mais personne
  n'importe l'export. L'invariant « un repère ne diverge pas de sa planète »
  n'est pas tenu.
- **[C] `engine/sky.ts:33,147-148` : commentaire faux.** Il dit « A quarter
  of the slide », alors que `TRAIL_SIDEWAYS` vaut 0,5.
- **[C] `engine/scene.ts:217` : champ mort.** `Grain.z` est écrit et jamais
  lu.
- **[C] `object-engine.ts:325` : getter de test.** `running` ne sert qu'aux
  tests.
- **[C] Doublons.**
  - La projection est écrite 4 fois : `engine:855-859,1229-1231,1281-1283` et
    `comets:351-353`.
  - `lively` est écrit 2 fois : `engine:1257-1261,1374-1375`.
  - `opening()` est réécrit dans `comets.ts:319`.
- **[C] `engine/math.ts:7` : constante approchée.** `TAU = 6.2832` ; préférer
  `2 * Math.PI`.
- **[C] `object.component.html:18` : réécriture non commentée.** Le moteur
  réécrit `aria-hidden="true"`, sans que le gabarit le dise.

## 6. Concepts de feature dans `shared/ui` [I]

- **Requêtes sur tout le document.** `document.querySelectorAll('[data-panel]')`
  et `'[data-object-line]'` (`object.component.ts:353,389-392`), avec les
  rôles `head`, `rule`, `sheet` et `preview`.
- **Noms de pages.** `ObjectView = 'home'|'index'|'sheet'|'about'|'not-found'`
  (`engine:42`).
- **Contenu de page.** `PART_LABELS` et les constellations de « À propos ».
- **Vocabulaire de page.** « relevé » et « projet » dans les libellés
  accessibles.

Correction :

- mesures des panneaux en entrée, ou via un service de mise en page ;
- modes neutres à la place des vues ;
- libellés et textes accessibles en entrées.
