# L'objet — spécification du rendu `<canvas>`

Cette partie se **porte telle quelle**. C'est du JavaScript de rendu : aucune dépendance au DOM au‑delà de deux éléments `<canvas>`, aucune bibliothèque. Le code de référence est dans la classe `Component` de `maquette/Portfolio v5-A - la station.dc.html` — méthodes `buildScene`, `place`, `positionNode`, `positionComete`, `loop`, `draw`, `drawCiel`, `drawConstellations`.

Aucune bibliothèque 3D : tout est en 2D, projeté à la main. C'est ce qui permet de tenir 60 images par seconde avec plusieurs milliers de points sur une machine modeste.

---

## 1. Les deux calques

```html
<canvas ciel>   <!-- derrière : champ d'étoiles, traversée, constellations -->
<canvas objet>  <!-- devant : disque, anneau de photons, planètes, comètes -->
```

Deux calques **et pas un seul** : sans cette séparation, les étoiles se voyaient à travers le trou noir et l'ombre cessait d'être une ombre. Le ciel est peint en premier, l'objet par‑dessus, et le ciel est **coupé** à l'intérieur de 1,02 rayon d'objet (voir §6).

Résolution : `devicePixelRatio` plafonné à 2. Redimensionnement par `ResizeObserver`. La boucle s'arrête quand le canvas sort du viewport (`IntersectionObserver`, seuil 0,01) et quand l'onglet est masqué.

---

## 2. La caméra

Un seul jeu de six nombres décrit un cadrage :

| Nom | Sens |
|---|---|
| `x`, `y` | place du centre de l'objet dans le cadre, en fraction |
| `s` | l'échelle — la distance de la caméra |
| `i` | le roulis |
| `ev` | l'élévation au‑dessus du plan du disque (0 = par la tranche, 1 = de haut) |
| `az` | l'azimut autour de l'axe de l'objet |

**Le disque étant de révolution, tourner autour de lui revient à décaler d'un même angle toutes les orbites : c'est un déplacement de caméra, jamais une rotation propre de l'objet.**

Cadrages par vue :

| Vue | i | s | x | y | ev | az |
|---|---|---|---|---|---|---|
| Accueil | −0,33 | 0,48 | 0,53 | 0,40 | 0,18 | 0 |
| Relevé | −0,10 | 0,30 | 0,30 | 0,50 | 0,86 | −0,30 |
| À propos | −0,95 | 0,34 | 0,20 | 0,50 | 0,06 | 0,62 |
| Fiche | calculé, voir §4 |

**Une seule échelle d'approche, du plus loin au plus près, sans exception :** relevé 0,30 · à propos 0,34 · accueil ≈0,48 · aperçu 0,74 · fiche 0,72 → 1,05. La fiche porte le plus d'information, c'est là que l'instrument s'approche le plus.

Interpolation : **demi‑vie de 0,55 s**, `k = 1 − 0.5^(dt/0.55)`. Le mouvement prend son temps et s'arrête sans à‑coup. Jamais de `lerp` à coefficient fixe — le résultat dépendrait de la fréquence d'images.

Chaque terme est gardé fini à chaque image : **un seul `NaN` dans la caméra efface tout le dessin et rien ne le répare.**

### Déroulé de l'azimut

Chaque aperçu déroule l'azimut d'un quart de tour de plus. Sans remise sur le tour courant (`tours = round((azim − cible) / 2π)`), revenir à un cadrage constant obligerait la caméra à rattraper toutes les révolutions accumulées.

---

## 3. La traversée d'ouverture (0 → 9,2 s)

Un seul calcul par image, lu par l'objet **et** par le ciel : les deux doivent bouger d'accord, sinon la profondeur se défait.

**On anime la DISTANCE, pas la taille.** Un objet qui vient de loin ne grandit pas régulièrement : son diamètre apparent vaut l'inverse de sa distance. La distance va de **58 rayons à 1** entre 4,2 s et 8,8 s, en `easeInOutCubic`, et la taille s'en déduit (`croit = 1/dist`). Un freinage appliqué à la taille ferait grossir vite puis lentement — exactement l'inverse d'une approche, d'où l'impression d'une image qui apparaît devant nous. Ici l'objet reste un point pendant des secondes, puis se déploie en fin de course.

Quatre mouvements se superposent, de durées différentes : l'élévation (5,4 → 8,8 s), l'azimut avec un léger dépassement (6,0 → 8,8 s), le roulis et le recentrage en sinusoïde (5,6 → 8,8 s).

**La dérive.** Trois oscillations lentes, de périodes premières entre elles (0,23 · 0,41 · 0,13 Hz), s'ajoutent aux quatre mouvements et s'éteignent avec eux. Sans elles, les courbes sont justes et le résultat reste une machine.

**L'émergence de la matière** suit toute la durée de l'approche : `mat = smoothstep(3,8 → 8,0 s)^1,8`. La puissance écrase le début — à 5 s la matière est à 5 %, à 6 s 25 %, à 7 s 74 %, pleine à 8 s. C'est réglé ainsi parce qu'à cinquante rayons les points se concentrent sur quelques pixels **sans que leur taille de tracé diminue** : ils s'additionnent, et un objet lointain à pleine lumière brille plus que son arrivée.

---

## 4. Le disque

### Construction (une fois)

Une **réserve** de points, pas la scène finale : 1,9 fois le nombre affiché au repos (défaut 3800, modulé par l'aire de la fenêtre, plancher 0,42). Reconstruire la scène à chaque changement d'échelle redistribuerait tous les points au hasard — la matière sauterait. Ici les points existent déjà, ils **s'allument**.

Six familles :

| Fam | Part | Rôle |
|---|---|---|
| 0 | 13 % | sphère parcourue — donne le volume sans cerner l'objet d'un trait |
| 1 / 2 | 58 % | arcs lentillés — l'image secondaire du disque, rabattue par‑dessus et par‑dessous l'ombre |
| 3 | 30 % | la bande avant, le disque lui‑même |
| 4 | reste | voile diffus |
| 5 | 16 % | **anneau de photons** — le liseré que la lumière trace en frôlant l'horizon |

Les écarts radiaux suivent une **gaussienne** (Box‑Muller) : aucune orbite ne se lit. Le croissant supérieur porte l'essentiel de la lumière — trois points sur quatre y sont versés, et la densité s'effondre vite en s'éloignant de l'anneau.

L'anneau de photons est un **cercle parfait**, très mince, dense, à 0,958 rayon, décalé vers la droite de l'écart exact au rayon de l'ombre : le bord droit se confond avec celui de l'ombre, l'excentrement se lit à gauche — c'est de ce côté que la lumière est rabattue. Il ne s'aplatit **jamais** avec le disque : c'est lui qui donne le bord net de l'ombre.

Le disque s'éteint vers **2,4 rayons**. Ce nombre gouverne tout le reste : rien d'autre ne doit vivre en deçà.

### Densité dynamique

En s'approchant, la même matière s'étale sur plus de pixels et le grain se clairsème. On puise alors davantage dans la réserve, proportionnellement au rapprochement — la densité **apparente** reste constante.

Le tirage est **déterministe** : `(i * 7919) % 1000 < part * 1000`. Un point allumé le reste tant qu'on ne recule pas. Un tirage aléatoire ferait scintiller la population entière.

### Lumière

- **Effet Doppler** : le côté gauche vient vers nous (plus clair et bleui), le droit s'éloigne (plus sombre et rougi). L'éclat donne la vitesse, la couleur donne le sens. Cinq paliers seulement, deux rampes réutilisées (`rampeCoeur`, `rampeMat`) — un dégradé par point coûterait plus en changements de `fillStyle` que le dessin lui‑même.
- **Rien ne brille dans l'ombre** : les arcs lentillés s'y éteignent aussi, et c'est ce qui donne au disque noir son bord franc et détache le liseré.
- Le bord externe ne s'éteint pas complètement (plancher 0,52) : sinon le disque se termine dans le noir et les planètes qui le survolent n'ont plus de fond lisible.
- **Le texte passe avant la matière.** Les rectangles des panneaux et du titre sont relevés à chaque image ; les points qui tombent derrière sont atténués à 13 %, avec un fondu de 22 px pour éviter un trou net.

Les points sont dessinés en `fillRect` de 2,15 à 2,8 px, jamais en `arc` : c'est la différence entre 60 et 25 images par seconde.

---

## 5. Les planètes

Un corps par projet, **hors du disque**, sur des orbites coplanaires (`inc = 0` — la moindre inclinaison élargit l'ellipse et casse l'impression de coplanarité).

- **Espacement à la Titius‑Bode** : chaque orbite s'éloigne d'un facteur 1,42 plus un décalage propre. Des anneaux équidistants font une cible de tir ; un vrai système respire. **La règle de l'accueil lit la même fonction** — un repère ne peut pas diverger de sa planète.
- **Angle d'or** (2,39996 rad) entre les corps : ils ne se rangent jamais en couronne régulière et ne reviennent jamais au même alignement.
- **Kepler** : `v ∝ (1,3 / r)^1,5`. Plus loin, plus lent.
- Les rayons sont **calés sur la place réellement disponible** (`rMin ≥ 4,1`, `rMax ≤ 6,9`, bornés par la largeur libre à gauche du panneau et par la bande verticale mesurée), jamais sur des constantes. Un plancher au‑dessus de la place disponible ferait sortir l'orbite externe du cadre.
- **Invariant non négociable** : l'orbite externe tient dans la bande libre **et** reste hors du disque. Quand la bande se resserre, ce n'est pas l'orbite qui rentre dans le disque — c'est le système qui **se couche** : la caméra descend vers le plan et le roulis s'annule, jusqu'à voir les orbites presque par la tranche. Leur étendue verticale s'effondre, l'horizontale reste entière, rien ne se superpose.
- **Répulsion à l'écran** : après le calcul des positions et avant le dessin, quatre passes garantissent un écart minimal de 58 px. Deux orbites peuvent se croiser en projection ; deux points ne se confondent jamais.
- **Traces d'orbite** : échantillonnées sur 84 points et tracées **segment par segment** (relier deux points non consécutifs tirerait une corde au travers de l'ellipse), en sept paliers de profondeur pour que l'orbite s'assombrisse en passant derrière et revienne sans rupture. Seule l'ombre interrompt vraiment le trait.
- **Entrée échelonnée** : le corps `i` se lève 0,42 s après le précédent, en 0,7 s. La ligne de la règle et sa planète sont le **même événement**, une seule horloge les gouverne.
- **Cibles cliquables** : un `<button>` DOM de 48×48 px positionné par `transform` à chaque image. Un point couvert par un panneau ou hors cadre est éteint, rendu inerte (`pointer-events: none`), sorti de l'ordre de tabulation et marqué `aria-hidden` — **aucune cible invisible ne reste cliquable**.
- **Libellés** : éléments DOM positionnés par `transform`. Le côté est choisi vers l'extérieur du cadre, le coude est proportionnel au rayon de l'objet, et la position finale est cherchée sur cinq crans verticaux puis sur l'autre flanc avant de renoncer — un libellé permanent ne se sacrifie pas à son voisin. Les rectangles des panneaux sont posés d'avance parmi les emplacements pris.

### Le cadrage d'une fiche

Quatre approches, une par chapitre. Chaque chapitre dit ce qu'on voit **de plus** en étant plus près : 01 l'orbite entière, d'où vient ce corps — 02 la caméra descend dans le plan, le corps passe devant la bande — 03 au plus près, le grain et le liseré — 04 on recule d'un cran et on remonte, sa place dans le système.

Le trou noir se tient à gauche, le corps lu sort à sa **droite**, dans la bande restée libre entre l'objet et le panneau. Deux invariants : il reste à 2,9 rayons au minimum de l'empreinte du disque, et il ne passe jamais sous le texte. **Si les deux ne tiennent pas ensemble, c'est l'approche qui cède, pas la lisibilité.** Le bord gauche du panneau est mesuré dans le DOM, pas deviné.

---

## 6. Le ciel

Densité : une étoile pour 3600 px² divisés par le `dpr`. Non uniforme : quatre amas, beaucoup de poussière, de rares étoiles nettes (6 %).

**Le ciel suit la caméra** — sans cela, l'œil attribue le mouvement à l'objet. L'azimut fait défiler le champ latéralement, l'élévation le fait monter, le rapprochement l'écarte du centre. Chaque étoile bouge selon sa profondeur : les plus grosses sont les plus proches, elles se déplacent le plus.

**Parallaxe** : pendant l'arrivée, le ciel s'écarte bien plus que l'objet ne grossit. C'est ce **rapport** — et non l'échelle — qui dit qu'on avance.

### La traversée

La vitesse part de **zéro** (le ciel est immobile pendant qu'on lit le titre), monte, puis s'éteint : `u = clamp((t − 3,5) / 4,4)`, `vitesse = 6u(1−u)²`. L'écartement est son intégrale, donc **monotone** — aucune étoile ne change jamais de sens. Ce qui s'éteint, c'est la vitesse, donc la longueur des traînées.

L'étoile s'éloigne du point de fuite et ne revient jamais vers lui ; celle qui sort du cadre est recyclée près du centre, sur un disque de rayon aléatoire (0,02 à 0,28 du cadre) — un disque trop serré ferait un nœud au point de fuite. Un modulo transformerait l'éloignement radial en translation et l'étoile traverserait le cadre en diagonale : c'est ce qui donnait des étoiles rentrant par les coins.

À l'arrêt, le champ est **remis à plat une fois pour toutes** : l'éloignement radial n'est pas réversible, et sans cette remise le ciel resterait vide pour toute la visite.

**La traînée est le déplacement réellement parcouru depuis l'image précédente, étiré ×9** — elle ne peut donc pas partir dans une direction que l'étoile n'a pas prise. Un saut de recyclage n'est pas un déplacement : il ne laisse pas de trace. Le déplacement est lissé (0,55 / 0,45) pour que la longueur ne sautille pas.

### La coupe de l'ombre

**Rien ne traverse l'ombre.** Une étoile à moins de **1,02 rayon** du centre n'est pas dessinée. Fondu court jusqu'à 1,22 rayon : une coupe franche se lirait comme un défaut de rendu. Le liseré de photons est à 0,958 rayon ; on coupe juste au‑delà pour que le bord reste net sans manger l'anneau.

### La lentille gravitationnelle du curseur

Le curseur est une masse : il défléchit la lumière qui passe près de lui. **Ce n'est pas une répulsion** — c'est la déviation d'une lentille, en 1/d.

- Empreinte : **70 px**, identique à celle de la répulsion du disque. Deux rayons différents pour un même curseur feraient deux curseurs.
- Rayon d'Einstein : **19 px** — c'est l'échelle de la déviation, pas sa portée.
- Déviation `θE² / max(d, θE/2)`, **bornée à 26 px** : sans plafond, une étoile passant pile sur le curseur partirait à cinquante pixels.
- **Conservation du flux** : ce qui s'écarte s'éclaire. Amplification `1 + 1,6 (θE / (d + 0,7 θE))²`, grossissement plafonné à 2,1×, éclat à 2,5×.
- Appliquée **au dessin seulement**, jamais à la position mémorisée — sinon elle créerait de fausses traînées.

---

## 7. Les constellations (vue À propos)

Une figure par volet du texte. **Une constellation n'est pas un corps : c'est une figure qu'on trace entre des étoiles qui n'ont rien à voir entre elles** — exactement ce qu'est chacun de ces volets. Elle est au fond du ciel : plus loin que tout, hors du plan du disque, et elle ne tourne pas avec lui — elle dérive avec les fixes.

Quatre figures **réelles**, aux **positions réelles** de leurs étoiles, chacune choisie pour sa silhouette :

| Volet | Figure | Pourquoi |
|---|---|---|
| Profil | **Orion** | la figure la plus reconnue du ciel, et la seule qui dessine quelqu'un |
| Compétences | **la Couronne boréale** | un arc net de sept étoiles — un ensemble qui se tient |
| Méthode | **le Cocher** | la seule figure **fermée** : un pentagone. Une méthode est un cadre clos |
| Parcours | **le Dragon** | une longue chaîne sinueuse, de la tête à la queue |

Une personne, un arc, un polygone, une ligne qui serpente : c'est la variété de **formes** qui fait lire quatre figures et non quatre amas.

Le troisième nombre de chaque point est l'**éclat réel** de l'étoile : une constellation se lit à sa hiérarchie, pas à des points tous pareils.

**Les quatre sont au ciel en même temps**, chacune à sa place, à 20 % d'éclat ; seule celle du volet ouvert s'allume à plein et se **nomme**. On désigne une figure dans un ciel, on ne l'invoque pas — et un ciel dont trois figures disparaissent n'est plus un ciel. Fondu croisé au rythme de la caméra. Coupées par l'ombre comme le reste.

Aucune ne reprend une figure de fiction : ce sont des faits vérifiables, comme le reste du site.

---

## 8. Les comètes (variante de la vue À propos)

Variante accessible par la propriété `astresApropos` (`constellations` | `cometes`). Conservée comme alternative ; les constellations sont le choix par défaut.

Quatre comètes, hors du plan du disque et franchement au‑delà des orbites de planètes (périastre 4,8 à 6,6 rayons, apoastre 12 à 18) : **ce ne sont pas des corps du système, ce sont des visiteurs.** L'inclinaison alterne de part et d'autre.

**Kepler résolu par Newton** (4 itérations sur `E − e·sin E = M`) : c'est ce qui donne la lenteur au loin et l'accélération au passage. Sans cela, une comète n'est qu'une planète sur une ellipse. Vitesse encore ralentie de moitié — une comète se regarde passer.

**Deux queues, parce qu'une comète en a deux et que la différence se voit** : la queue de plasma, fine et bleue, part exactement à l'opposé de l'objet ; la queue de poussière, large, pâle et incurvée, reste en retard sur la trajectoire (direction = radiale − 0,62 × direction de déplacement). Chacune est un chemin rempli d'un dégradé, pas un trait.

Nommées, comme les planètes le sont sur l'accueil.

---

## 9. Faire tourner l'objet à la main (accueil)

Un secret : **rien ne l'annonce**, ni curseur `grab`, ni indice. On saisit le vide autour du disque et on pousse.

- C'est la composante **tangentielle** du geste — le produit vectoriel entre le rayon et le déplacement — qui devient un couple. Pousser dans le sens de la rotation l'accélère, à contresens la freine puis l'inverse.
- Le bras de levier est borné sous un rayon d'objet : sinon un geste près du centre envoie tout en toupie.
- **Le moment cinétique est conservé au relâchement** : demi‑vie de 9 s. On lâche, l'objet emporte la poussée et revient à son régime propre si lentement qu'on ne voit jamais où il s'est arrêté.
- C'est le seul geste du site qui agisse sur l'**objet** et non sur la caméra, et il n'existe que sur l'accueil, là où l'objet est le sujet.
- Tout ce qui a déjà un geste garde le sien : fenêtres, châssis, règle, points cliquables du disque. Un glissé au‑delà de 6 px avale le clic suivant.

---

## 10. Les règles de performance

Elles ne sont pas négociables : c'est ce qui fait tenir 60 images par seconde.

1. **Aucune interrogation du document dans la boucle.** Ni `getComputedStyle`, ni `querySelectorAll`, ni `getElementById`. Les couleurs sont relues au changement de thème, les nœuds indexés au rendu. Chacune de ces lectures forçait un recalcul de mise en page par image, et le coût montait avec le nombre de fenêtres ouvertes.
2. **Mesurer avant d'écrire.** Tous les `getBoundingClientRect` d'une image se font avant la première écriture de style. L'ordre inverse provoque un aller‑retour de mise en page par élément.
3. **`fillRect`, jamais `arc`**, pour les milliers de points du disque.
4. **`fillStyle` et `globalAlpha` changés seulement quand la valeur change** — cinq couleurs réutilisées, pas un dégradé par point.
5. **La boucle s'arrête d'elle‑même** quand plus rien ne bouge : `anime || camBouge || enTraveling || openT ≠ cible || entree < 1 || relache || spinV`.
6. **Le ralentissement s'applique à l'incrément, jamais au temps cumulé** — multiplier le cumul ferait sauter l'angle de plusieurs tours d'un coup.
7. **Le déplacement d'une fenêtre s'écrit dans le DOM, pas dans l'état.** Une fenêtre qu'on traîne ne relance pas le rendu de son contenu à chaque image.

---

## 11. Repli

Si le contexte 2D n'est pas disponible, un disque en `background-image: radial-gradient` avec un masque annulaire remplace l'objet, et les points actifs sont retirés. Le site reste entièrement utilisable : **aucune information ne vit uniquement dans le canvas.**
