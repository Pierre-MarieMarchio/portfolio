# Passation — Portfolio « la station », Pierre-Marie Marchio

## À lire en premier

Les fichiers de `maquette/` sont des **références de design écrites en HTML**. Ce sont des prototypes qui montrent l'aspect et le comportement voulus — **pas du code à copier en production**. Le travail consiste à **recréer ces écrans dans une application Angular**, avec les conventions et les bibliothèques de ce projet‑là.

Une exception, et une seule : le **fichier `objet-canvas.md`** décrit un rendu `<canvas>` en JavaScript pur. Celui‑là se **porte tel quel**, la logique n'a rien de spécifique à HTML — elle vit très bien dans un service Angular ou une directive. C'est le seul endroit où recopier la logique est la bonne décision.

**Fidélité : haute (hifi).** Couleurs, typographie, espacements, états et animations sont définitifs. Reproduis‑les au pixel. Les seules choses non arrêtées sont les **contenus manquants** listés en fin de document.

---

## 1. Ce qu'est ce site

Un portfolio personnel pour Pierre‑Marie Marchio, concepteur développeur d'applications. Lecteurs visés : recruteur, manager technique, client potentiel.

**Le parti pris, en une phrase :** un trou noir en `<canvas>`, les projets en orbite autour de lui, et par‑dessus une **interface d'application à fenêtres** — barre de titre, épingler / replier / fermer, fenêtres déplaçables, sélecteur segmenté, pied qui fait avancer la lecture.

Trois règles qui gouvernent tout le reste :

1. **On ne change jamais d'écran.** L'objet 3D reste monté en permanence ; c'est la **caméra** qui se déplace d'une vue à l'autre. La page n'est jamais rechargée, jamais remplacée — seule l'adresse change, et le cadrage avec elle.
2. **Rien n'est affirmé sans preuve.** Chaque projet porte un champ « preuve » et un « niveau d'accès » (ouvrable par vous / vérifiable mais code privé / sur récit seulement). C'est la colonne la plus importante du relevé.
3. **Une action = un mot, un glyphe, une place.** Si deux endroits font la même chose, ils le disent avec les mêmes mots.

---

## 2. Routes

Routage par **fragment** (`location.hash`), pas par chemin. À conserver tel quel : l'objet ne doit jamais être démonté.

| Adresse | Vue | Fenêtre ouverte |
|---|---|---|
| `#accueil` (ou vide) | Accueil : objet, titre, règle des projets en orbite | aucune, ou l'aperçu |
| `#/projets` | Le relevé : tableau des 7 projets | `panneau-index` |
| `#/projet/<slug>` | Fiche d'un projet | `panneau-fiche` |
| `#a-propos` | À propos, en 4 volets | `panneau-apropos` |
| toute autre | Adresse inconnue | `panneau-404` |

Slugs : `skyted-voice`, `skyted-app`, `ngx-statewise`, `template-dotnet`, `bkone`, `skyted-companion`, `speakey`.

**En Angular** : un `Router` avec `useHash: true` fonctionne, mais le composant de l'objet doit vivre **au‑dessus** du `router-outlet` (dans le composant racine) pour ne jamais être détruit. Le mode courant se lit depuis le `Router` et se passe au service de rendu.

---

## 3. Jetons de design

### Couleurs (mode nuit uniquement — un trou noir sur fond clair ne tient pas)

| Jeton | Valeur | Emploi |
|---|---|---|
| `--paper` | `oklch(0.165 0.014 265)` | fond de page |
| `--paper-2` | `oklch(0.205 0.016 265)` | fond des figures |
| `--ink` | `oklch(0.93 0.008 250)` | texte principal — 15,6:1 |
| `--ink-2` | `oklch(0.74 0.014 255)` | texte secondaire — 8,3:1 |
| `--line` | `oklch(0.33 0.018 260)` | **filet uniquement, jamais une encre** — 1,57:1 |
| `--accent` | `oklch(0.76 0.12 230)` | « ici » : liens, sélection, planètes — 9,2:1 |
| `--sig` | `oklch(0.82 0.14 74)` | **états uniquement** : compteurs, « à renseigner » — 10,8:1 |
| `--vitre` | `color-mix(in oklab, oklch(0.175 0.014 265) 72%, transparent)` | fond des fenêtres |
| `--vitre-2` | `color-mix(in oklab, oklch(0.30 0.02 262) 30%, transparent)` | survol, onglet actif |

Deux encres et rien d'autre : **l'accent dit « ici », le signal dit « état »**, le reste est du gris. `--sig` ne sert jamais à décorer. `--line` ne porte jamais de texte (à 1,57:1 il serait illisible).

Les fenêtres sont translucides avec `backdrop-filter: blur(11px) saturate(1.08)`.

### Typographie

Deux familles, chargées depuis Google Fonts :

- **IBM Plex Mono** (400, 500) — *toute* l'interface : étiquettes, navigation, données, compteurs, titres de fenêtre.
- **Instrument Sans** (400, 500, 600, italique 400) — le texte courant uniquement.

Échelle **en pixels**, pas en `em` : les `em` s'empilaient et un compteur tombait à 9,7 px réels. **Plancher 11 px, strict.**

| Jeton | Valeur | Rôle |
|---|---|---|
| `--m1` | 11px | étiquette mono majuscule (colonnes, `<dt>`, pieds, compteurs) |
| `--m2` | 12px | commande mono (navigation, segmenté, boutons de pied, titres de fenêtre) |
| `--m3` | 13px | donnée mono (preuve, pile, numéros, libellés de planète) |
| `--m4` | 14px | glyphe mono (✕, +, –, ●, ○) |
| `--g` | 16px | glyphe du rail de contact (`@`) |
| `--p1` | 14px | texte secondaire |
| `--p2` | 15px | texte courant |
| `--p3` | 16px | texte appuyé |
| `--h0` | `clamp(26px, 4.4vw, 56px)` | carton d'ouverture |
| `--h1` | `clamp(21px, 2.5vw, 34px)` | titre d'accueil (mono, poids 500) |
| `--h2` | `clamp(19px, 2.1vw, 27px)` | titre de fiche et de 404 (sans, poids 600) |

Trois interlettrages, un par rôle : `--ls-caps: 0.14em` (majuscules), `--ls-title: 0.18em` (titres mono), `--ls-mono: 0.04em` (donnée mono). Les titres en Instrument Sans portent un interlettrage **négatif** : `-0.022em` à `-0.03em`.

`body { font-size: clamp(16px, 1.05vw, 17.5px); line-height: 1.6; text-wrap: pretty }`

### Espacements et divers

`--s1: 6px` · `--s2: 12px` · `--s3: 20px` · `--s4: 32px` — et rien d'autre.
`--radius: 3px` (rayons quasi nuls : c'est un instrument, pas une application grand public).
`--t: 180ms cubic-bezier(.2,.6,.2,1)` — la transition de toute l'interface.

**Cibles tactiles : 44 px minimum**, jamais en dessous (boutons du rail de contact, liens du relevé). Les boutons de la barre de titre font 34×32 px — assumé, ils sont secondaires et doublés par le clavier.

### Profondeur (z-index)

Trois étages, **et aucune égalité possible** — à z‑index égal, c'est l'ordre du DOM qui tranche, donc le hasard :

- **0–3** : l'objet, le titre d'accueil, la règle des orbites
- **5–8** : les fenêtres (la dernière touchée passe devant)
- **20** : le châssis fixe (barre de pages, rail de contact)
- **45** : le carton d'ouverture

---

## 4. Les composants

### 4.1 `Fenetre` — la grammaire de toutes les vues

Source : `maquette/Fenetre.dc.html`. **Quatre gestes, toujours au même endroit, dans le même ordre.**

**Anatomie, identique pour les quatre fenêtres :**

```
┌──────────────────────────────────────────────────┐
│ ▪  TITRE                    meta  ○  –  ✕        │  barre de titre — se saisit
├──────────────────────────────────────────────────┤
│  [ sélecteur segmenté ]                          │  barre d'outils — 7px 12px
├──────────────────────────────────────────────────┤
│                                                  │
│  corps — défile, overscroll-behavior: contain    │  flex:1 1 auto; min-height:0
│                                                  │
├──────────────────────────────────────────────────┤
│  position courante          Suite : … →          │  pied — var(--s2) 12px
└──────────────────────────────────────────────────┘
```

- **Barre de titre** : carré d'accent 7×7 px, titre en `--m2` majuscules `--ls-title`, espace élastique, compteur en `--sig` (`--m1`), puis les trois boutons.
- **Épingler** — `○` détaché / `●` épinglé (en `--sig`). Garde la fenêtre montée en changeant de page. **L'épingle appartient à l'application, pas à la fenêtre** : c'est elle qui décide de garder le composant monté.
- **Replier** — `–` / `+`. Ne garde que l'en‑tête et rend la vue à l'objet. Double‑clic sur la barre de titre : même effet.
- **Fermer** — `✕`. Ferme **et** retire l'épingle, **et** remonte d'un cran dans le parcours (fiche → relevé, relevé → accueil). Jamais de cul‑de‑sac, jamais d'épingle orpheline.
- **Déplacer** : glisser la barre de titre. Le déplacement s'écrit dans le DOM (`transform`) et **pas dans l'état** — une fenêtre qu'on traîne ne doit pas relancer le rendu de son contenu à chaque image. La barre de titre reste toujours rattrapable (bornes : 150 px visibles horizontalement, 12 px en haut, 60 px du bas).
- **On ne saisit pas la fenêtre par ses boutons** (`e.target.closest('button,a')` → on ignore), sinon un clic sur « fermer » devient un micro‑déplacement et l'action se perd.
- **Ouverture** : `@keyframes` sur `translate`, pas sur `transform` — `transform` appartient au déplacement à la souris, une animation en `fill-mode: both` écraserait la position choisie par l'utilisateur. 560 ms.

**Tailles** — la fenêtre prend la hauteur de son contenu jusqu'à un plafond : `s` 300 px · `m` 470 px · `l` 920 px. Le plafond réel est le **minimum** entre ce nombre et la place libre, calculée depuis le bord bas de la fenêtre si elle est ancrée en bas. Une propriété `marge` dit la place à laisser libre en dessous (là où vit le rail de contact) : sans elle, une fenêtre descend sous le rail et cache son propre pied.

Attribution actuelle : relevé `l` · fiche `l` · à propos `l` · aperçu `m` (ancré en bas) · 404 `s`.

### 4.2 `Segmente` — le sélecteur

Source : `maquette/Segmente.dc.html`. Le **même geste et le même dessin partout** : pages, familles de projets, approches d'une fiche, volets de l'à‑propos. L'appelant ne fournit que du sens (libellé, compte, actif, clic) ; l'aspect est décidé une seule fois, pour que deux sélecteurs ne divergent jamais.

`<ul role="group">` de boutons, bordure 1 px `--line`, `gap: 2px`, `padding: 2px`. Chaque bouton : `min-height: 34px`, `padding: 5px 11px`, `--m2` majuscules `--ls-caps`, `aria-pressed`. Actif : fond `--vitre-2`, encre `--ink`. Le compteur optionnel est en `--m1`, `--sig` s'il est actif, `--ink-2` sinon.

### 4.3 Le relevé (`#/projets`)

Grille de 4 colonnes : `3.4ch minmax(0,1.5fr) minmax(0,1.15fr) minmax(0,1fr)` — **Réf · Projet · Ce qu'on peut vérifier · Rôle tenu**. En‑tête de colonnes en `--m1` majuscules `--ls-title`.

Chaque ligne est un `<button>` (`min-height: 44px`, `border-left: 1px solid transparent`). Au survol et à la sélection : encre `--accent`, bordure gauche `--accent`, `padding-left: var(--s2)`, fond `color-mix(in oklab, var(--accent) 8%, transparent)`. **Le même jeu d'états partout.**

Sélectionner ouvre la ligne d'un cran : le sujet du projet, « Ouvrir la fiche → », et le lien externe s'il existe. Second clic, `Échap` ou clic dans le vide : on referme.

Filtre par famille (Tout / En entreprise / Personnels) : ce n'est **pas** une catégorie inventée, c'est le champ « contexte » que la fiche affiche déjà. **Filtrer n'est pas retrier** — l'ordre ne change jamais.

Un projet déjà lu porte la mention `lu` en `--accent`.

### 4.4 La fiche (`#/projet/<slug>`)

Quatre approches, une à la fois, choisies dans le segmenté du haut ; le pied dit où l'on est et propose « Suite : <titre> → ». Au dernier chapitre, il propose « Suivant : <projet> → ». **Une seule chose commande à la fois** : le défilement ne pilote rien (c'était la source d'ambiguïté de la version précédente).

Titres par défaut : *Pourquoi ? · Qu'ai‑je fait ? · Quel arbitrage ? · Qu'est‑ce qui tient ?* — une fiche peut en nommer d'autres. Le chapitre 1 affiche en plus la liste d'identité (Accès, Rôle, Technique, Contexte), lue depuis la table `faits`, **pas depuis la fiche** : une seule source de vérité.

Deux figures existent, ce sont des **schémas de lecture, jamais des captures présentées comme des preuves** : un flux `action → updator → effect ↻` (ngx‑statewise) et une arborescence de couches (template .NET).

### 4.5 L'accueil

- **Titre** en haut à gauche, mono, `--h1`, `max-width: min(27ch, 44vw)`.
- **Barre de pages** en haut à droite (sélecteur de langue FR / EN + Accueil / Projets / À propos). L'anglais n'est pas écrit : le bouton affiche « textes anglais à venir » via `role="status"`.
- **La règle des projets en orbite**, en bas : une ligne horizontale, un repère par projet mis en avant, titre en dessous. Elle lit **la même fonction de position** que les orbites du canvas — un repère ne peut pas diverger de sa planète. Survoler un repère allume sa planète, et réciproquement.
- **Le rail de contact**, fixe en bas à droite : e‑mail, LinkedIn, GitHub (44×44 px chacun) et le bouton pause de l'animation.
- **L'aperçu** : cliquer un repère ou une planète ouvre une petite fenêtre ancrée en bas à droite, avec résumé, preuve, rôle, pile, et « Ouvrir la fiche → ».

### 4.6 Le carton d'ouverture

Se joue une fois, 5,6 s, par‑dessus tout (z 45, `pointer-events: none`). Trois temps : le nom se pose en resserrant son interlettrage de 0,78em à 0,3em (2,6 s) → un filet d'accent s'ouvre → le métier vient dessous. **Rien ne l'attend** : le contenu est dans le document dès la première image, et le moindre geste le retire. Masqué entièrement si `prefers-reduced-motion`.

---

## 5. Comportements à ne pas perdre

- **Clavier.** `Échap` remonte d'un cran, depuis **chaque** vue : sélection → vue d'ensemble, fiche et 404 → relevé, relevé et à propos → accueil, aperçu → fermé. Le focus va au `<h1>` de la vue à l'arrivée — et comme les fenêtres se montent en différé, il faut le **réclamer** et le poser à la première image où la cible existe, pas le viser une seule fois. Focus visible : `outline: 2px solid var(--accent); outline-offset: 3px`.
- **Un seul `<h1>` par vue**, et il dit de quoi parle la vue. Plusieurs peuvent être montés en même temps (fenêtres épinglées) : c'est la **route** qui désigne le bon.
- **Clic dans le vide** : remonte d'un cran, jamais plus d'un. Un **glissé n'est pas un clic** (au‑delà de 6 px, le clic est avalé) — sans ça, faire tourner l'objet refermait l'aperçu.
- **Mémoire de lecture.** La position de défilement de chaque fenêtre est retenue et restituée en revenant. Les projets déjà lus restent marqués.
- **Ordre des fenêtres.** La dernière ouverte ou touchée passe devant (`pointerdown` en capture sur `[data-slot]`). L'empilement est écrit dans le DOM, le rendu n'a pas à connaître l'ordre.
- **`prefers-reduced-motion`** : le carton disparaît, l'objet est posé à son état final, les transitions sont coupées, la lentille et la rotation à la main sont désactivées.
- **Onglet masqué** : `visibilitychange` arrête la boucle d'animation.

---

## 6. Les données

Sept projets, dans un ordre qui **est** la distance au centre : du plus représentatif au plus lointain. `01..07` se lit sur le disque comme dans le tableau.

```
ordre : skyted-voice · skyted-app · ngx-statewise · template-dotnet · bkone · skyted-companion · speakey
```

Les quatre premiers sont les **vedettes** : ce sont eux qui portent l'accueil (deux applications publiées, deux dépôts publics — quatre choses qu'on peut ouvrir soi‑même). Les trois autres n'existent qu'à l'échelle du relevé. La limite tenable sur le disque est **six** : au‑delà, le sommaire cesse de se lire d'un coup d'œil.

Deux structures, et une seule source de vérité pour chaque fait :

- `projets[]` — `slug`, `titre`, `court`, `tag`, `famille` (`Professionnel` | `Personnel`), `sujet`, `resume`.
- `faits[slug]` — `preuve`, `preuveNiv` (`consultable` | `indirect` | `aucun`), `role`, `techno`, `contexte`. **C'est cette table que lisent la règle, le relevé, l'aperçu et la fiche.** Une seconde table existait dans les fiches et divergeait déjà : elle a été supprimée. Ne la réintroduis pas.
- `fiches[slug]` — `titre`, `chapo`, `liens[]`, `chapitres[]` (chaque chapitre : `titre?`, `paragraphes[]`, `puces[]?`, `figure?`).

Le niveau d'accès se dit en mots, parce que c'est la question que pose un recruteur : *Ouvrable par vous · Vérifiable, code privé · Sur récit seulement*.

**En Angular** : ces trois structures forment un service de données unique, typé, sans appel réseau. C'est du contenu, pas de la donnée dynamique.

---

## 7. L'objet en `<canvas>`

Documenté en détail dans **`objet-canvas.md`**. C'est la seule partie à **porter telle quelle** : deux calques `<canvas>` (le ciel derrière, l'objet devant), une boucle `requestAnimationFrame`, aucun DOM.

En Angular : un service qui expose `setMode(mode, slug?)`, `setSurvol(i)`, `setPause(bool)` et une méthode de montage sur deux `<canvas>`. Le composant racine le monte une fois. **Il ne doit jamais être détruit par le routeur.**

---

## 8. Ce qui manque — à fournir par Pierre‑Marie, à ne pas inventer

Ces champs portent aujourd'hui du texte de remplissage explicite. Ils doivent être remplis avant mise en ligne, jamais devinés :

- **Parcours** : les cinq années (aujourd'hui `— — — —`), l'intitulé et l'établissement de formation.
- **Profil** : ville et mobilité, type de contrat recherché.
- La **période de création** des deux projets personnels.
- La **technique de Bk‑ONE** (la pile actuelle est une hypothèse).
- Des **matériaux montrables** pour Companion et Voice : aucune capture aujourd'hui.
- L'**intitulé de métier exact**.
- Les **textes anglais** : le sélecteur FR / EN est branché, les textes n'existent pas.
- Six passages en *lorem ipsum* dans l'à‑propos (volets Profil, Compétences, Méthode).

Quatre phrases sont par ailleurs signalées comme sans fait vérifiable, à réécrire ou à couper : « vérifiable en trois clics » (trois n'est pas compté), « chaque ligne renvoie à un projet du relevé… » (redit ce que la mise en page montre), « tenir un projet jusqu'à la mise en production… » (dit deux fois, dans Méthode et dans la fiche Speakey), et « sortie sur Android le 8 juin » (un jour sans année).

---

## 9. Les fichiers

| Fichier | Contenu |
|---|---|
| `maquette/Portfolio v5-A - la station.dc.html` | La maquette entière : gabarit, données, routage, objet en canvas |
| `maquette/Fenetre.dc.html` | Le composant fenêtre |
| `maquette/Segmente.dc.html` | Le composant sélecteur segmenté |
| `objet-canvas.md` | Spécification du rendu 3D, à porter tel quel |
| `angular.md` | Découpage Angular proposé, et l'ordre dans lequel le faire |
| `captures/` | 23 captures, une par vue et par état (voir ci‑dessous) |

Les trois `.dc.html` s'ouvrent directement dans un navigateur. **Ouvre‑les avant de lire le code** : la moitié des décisions se voient et ne se racontent pas.

### Les captures

Prises à **924 × 540 px** — une fenêtre basse, volontairement : c'est le cas le plus serré, celui où les fenêtres touchent leur plafond et où le rail de contact est le plus près des pieds de fenêtre. Sur un écran courant tout respire davantage.

| Fichier | Vue · état |
|---|---|
| `01-accueil` | accueil, objet arrivé, règle des orbites |
| `02-accueil-survol-repere` | survol d'un repère : la planète correspondante s'allume |
| `03-accueil-apercu-skyted-voice` | aperçu ouvert depuis la règle — la caméra vise la planète |
| `04-accueil-apercu-ngx-statewise` | aperçu, changé de corps par le segmenté |
| `05-accueil-apercu-replie` | l'aperçu replié : seule la barre de titre reste |
| `06-accueil-langue-en` | clic sur EN : « textes anglais à venir » |
| `07-releve` | le relevé des 7 projets — la caméra monte au‑dessus du plan |
| `08-releve-selection` | une ligne sélectionnée, ouverte d'un cran |
| `09-releve-filtre-entreprise` | filtre « En entreprise » |
| `10-releve-filtre-personnels` | filtre « Personnels » |
| `11` → `14` `-fiche-voice-…` | les quatre approches d'une fiche — la caméra s'approche à chacune |
| `15-fiche-ngx-statewise-figure-flux` | figure « flux » |
| `16-fiche-template-dotnet-figure-couches` | figure « couches » |
| `17-fiche-bkone` | fiche d'un projet à code privé |
| `18-fiche-speakey-deux-chapitres` | fiche courte : deux approches seulement |
| `19` → `22` `-apropos-…` | les quatre volets, chacun avec sa constellation allumée |
| `23-adresse-inconnue-404` | adresse invalide |

**Ce que les captures ne montrent pas, et qu'il faut regarder en vrai dans la maquette** : le carton d'ouverture et la traversée (0 → 9 s, rechargement complet), les mouvements de caméra entre deux vues, la lentille du curseur sur les étoiles, la rotation à la main (glisser dans le vide sur l'accueil), le glisser d'une fenêtre, et le fondu croisé des constellations. Tout ce qui bouge se juge en mouvement.
