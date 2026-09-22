# Découpage Angular — et l'ordre dans lequel le faire

Proposition, pas une prescription : suis les conventions de ton projet si elles divergent. Ce qui compte, ce sont les deux contraintes d'architecture du §1 — le reste est du confort.

---

## 1. Les deux contraintes qui décident du reste

**1. L'objet ne doit jamais être démonté.** Il est monté une fois dans le composant racine, **au‑dessus** du `router-outlet`. Si le routeur peut le détruire, la traversée d'ouverture rejoue à chaque navigation et l'effet « on ne change jamais d'écran » — qui est tout le parti pris — s'effondre.

**2. Le rendu ne passe pas par Angular.** Le canvas, le déplacement des fenêtres, la position des libellés et des cibles cliquables s'écrivent **directement dans le DOM**, à 60 images par seconde. Rien de tout cela ne doit déclencher une détection de changements. En pratique : `ChangeDetectionStrategy.OnPush` partout, et la boucle de rendu tourne **hors** de la zone Angular (`NgZone.runOutsideAngular`). C'est la seule chose qui rende ce site fluide.

---

## 2. Routage

```ts
provideRouter(routes, withHashLocation())
```

| Adresse | Composant |
|---|---|
| `#accueil` / vide | `AccueilComponent` |
| `#/projets` | `ReleveComponent` |
| `#/projet/:slug` | `FicheComponent` |
| `#a-propos` | `AProposComponent` |
| `**` | `IntrouvableComponent` |

Le composant racine écoute les événements du routeur et appelle `objet.setMode(...)`. Les composants de route ne rendent **que** le contenu d'une fenêtre : le châssis (barre de pages, rail de contact), l'objet et la règle d'accueil vivent dans la racine.

Attention aux **fenêtres épinglées** : une fenêtre épinglée reste montée alors qu'on a changé de route. Un `router-outlet` seul ne sait pas faire ça. Deux options, la seconde est la bonne :

- garder les quatre composants montés en permanence et piloter leur visibilité ;
- ne pas utiliser `router-outlet` pour les fenêtres : le composant racine tient un état `{ index, fiche, apropos, apercu }` de fenêtres à monter, dérivé de la route **et** des épingles, et rend les quatre conditionnellement. Le routeur ne sert alors qu'à dire l'adresse et le mode.

---

## 3. Arborescence proposée

```
src/app/
  app.component.ts                  ← objet + châssis + fenêtres. Jamais détruit.
  data/
    projets.ts                      ← projets[], faits[], fiches[], reperes, domaines
    projets.service.ts              ← lecture typée, filtre par famille, ordre
  objet/
    objet.service.ts                ← la boucle, la caméra, les modes  (port direct)
    scene.ts                        ← buildScene, place, positionNode  (port direct)
    ciel.ts                         ← étoiles, traversée, lentille     (port direct)
    constellations.ts               ← figures + tracé                  (port direct)
    objet.component.ts              ← les deux <canvas>, monte le service
  ui/
    fenetre.component.ts            ← barre de titre, épingle, repli, fermer, glisser
    segmente.component.ts           ← le sélecteur
  vues/
    accueil.component.ts            ← titre, règle des orbites, aperçu
    releve.component.ts
    fiche.component.ts
    a-propos.component.ts
    introuvable.component.ts
  chassis/
    barre-pages.component.ts
    rail-contact.component.ts
    carton-ouverture.component.ts
  styles/
    tokens.css                      ← les variables du README §3
```

### `objet.service.ts` — la seule vraie interface

```ts
mount(canvasObjet: HTMLCanvasElement, canvasCiel: HTMLCanvasElement): void
setMode(mode: 'accueil' | 'releve' | 'fiche' | 'apropos', slug?: string): void
setChapitre(i: number): void        // cadrage de fiche
setVolet(i: number): void           // constellation allumée
setApercu(index: number | null): void
setSurvol(index: number): void      // −1 = aucun
setPause(pause: boolean): void
destroy(): void
```

Tout le reste (§4 à §9 de `objet-canvas.md`) est interne. Le service ne connaît **ni** les composants **ni** le routeur : il reçoit un mode, il déplace une caméra.

Une seule dépendance sortante, à ne pas oublier : le service relit à chaque rendu les rectangles des panneaux de texte (`[data-slot]`, le titre d'accueil, la règle, le rail) pour atténuer la matière derrière eux. Expose une méthode `indexerPanneaux()` que le composant racine appelle après chaque changement de vue — **pas une requête DOM par image** (voir §10 de `objet-canvas.md`).

### `fenetre.component.ts`

```ts
@Input() titre: string
@Input() meta = ''
@Input() taille: 's' | 'm' | 'l' = 'm'
@Input() marge = 26          // place laissée libre sous la fenêtre
@Input() ancrage: 'haut' | 'bas' = 'haut'
@Input() epinglee = false
@Output() epingler = new EventEmitter<void>()
@Output() fermer = new EventEmitter<void>()
// contenu projeté : <ng-content select="[barre-outils]"> / [corps] / [pied]
```

Le repli et le déplacement sont **internes** (état local + écriture DOM). L'épingle est **remontée au parent** : c'est l'application qui décide de garder une fenêtre montée d'une page à l'autre, pas la fenêtre.

---

## 4. L'ordre dans lequel le faire

Chaque étape donne quelque chose de montrable. Ne saute pas l'étape 1.

1. **Les jetons et les polices.** `tokens.css`, les deux familles Google Fonts, les resets. Vérifie tout de suite qu'aucun texte ne passe sous 11 px.
2. **`Fenetre` et `Segmente`, à vide.** Ce sont eux la grammaire ; tout le reste s'y pose. Quatre gestes, les trois tailles, le glisser borné.
3. **Les données.** `projets.ts` recopié tel quel depuis la maquette. Une seule source de vérité : `faits[]`.
4. **Le relevé et la fiche, sans l'objet**, sur fond `--paper` uni. Le site doit être entièrement lisible et navigable à ce stade — clavier compris.
5. **L'objet.** Port direct de `objet-canvas.md`. Fais‑le en une fois : le disque, le ciel, les planètes et la caméra sont un seul système, les découper revient à le déboguer quatre fois.
6. **L'accueil** : la règle des orbites (elle lit la même fonction de position que les planètes), l'aperçu, le survol croisé règle ↔ planète.
7. **À propos** et ses constellations.
8. **Le carton d'ouverture**, en dernier. C'est un vernis : il ne doit rien retenir.

---

## 5. Les pièges, dans l'ordre où tu vas les rencontrer

- **La zone Angular.** Si la boucle tourne dedans, une détection de changements se déclenche 60 fois par seconde et le site rame sans raison visible. `runOutsideAngular`, et `run()` uniquement pour les rares changements d'état réels (ouverture d'un aperçu).
- **Le focus après navigation.** Les fenêtres se montent en différé. Viser le `<h1>` une seule fois échoue : il faut **réclamer** le focus et le poser à la première image où la cible existe, avec une échéance (2,5 s) pour ne pas boucler. En Angular : un `afterNextRender` ne suffit pas si la fenêtre est chargée paresseusement — garde la boucle de réclamation.
- **Un seul `<h1>` par vue.** Avec les épingles, plusieurs fenêtres sont montées ensemble : c'est la **route** qui désigne le bon titre, pas une référence partagée.
- **`em` imbriqués.** L'échelle est en pixels pour cette raison précise : un compteur en `0.92em` dans un bouton en `0.66em` tombait à 9,7 px réels. N'y reviens pas.
- **Les épingles orphelines.** Fermer doit fermer **et** désépingler, depuis n'importe quelle route. Sinon une épingle reste armée sans fenêtre pour porter son `✕`, et la fenêtre resurgit sans que personne l'ait demandé.
- **Le glissé et le clic.** Faire tourner l'objet déclenche un `click` au relâchement : au‑delà de 6 px de déplacement, il faut l'avaler, sinon le geste referme l'aperçu.
- **`z-index` à égalité.** Trois étages nets (objet 0–3, fenêtres 5–8, châssis 20). À valeur égale, c'est l'ordre du DOM qui tranche — donc le hasard.
- **`overscroll-behavior: contain`** sur tous les corps de fenêtre : sans lui, arriver en bas d'une fenêtre fait défiler la page derrière.

---

## 6. Accessibilité — le contrat à tenir

Il est déjà tenu dans la maquette ; ne le perds pas dans le portage.

- Contrastes mesurés : `--ink` 15,6:1 · `--ink-2` 8,3:1 · `--sig` 10,8:1 · `--accent` 9,2:1. `--line` à 1,57:1 est un **filet**, jamais une encre.
- Aucun texte sous **11 px**.
- Cibles tactiles à **44 px** dans le rail de contact et les liens du relevé.
- `Échap` remonte d'un cran depuis chaque vue, sans exception.
- Focus visible partout : `outline: 2px solid var(--accent); outline-offset: 3px`.
- Lien d'évitement vers `<main id="contenu">` en tête de document. Tout le contenu réel vit **dans** `<main>`.
- Les planètes sont des `<button>` avec un nom accessible ; couvertes ou hors cadre, elles sortent de l'ordre de tabulation et passent en `aria-hidden`.
- Le canvas est `aria-hidden` : **aucune information ne vit uniquement dedans.**
- `prefers-reduced-motion` : carton supprimé, objet posé à son état final, transitions coupées, lentille et rotation à la main désactivées.

---

## 7. Ce qu'il ne faut pas « améliorer » en portant

Ces choix ont l'air arbitraires et ne le sont pas. Ils sont tous justifiés dans `objet-canvas.md` ; si tu veux les changer, lis d'abord la raison.

- Animer la **distance** et non la taille (§3).
- Le tirage **déterministe** de la densité (§4).
- La **réserve** de points plutôt qu'une reconstruction de scène (§4).
- L'interpolation par **demi‑vie** et non par coefficient fixe (§2).
- Le ralentissement appliqué à l'**incrément** et jamais au temps cumulé (§10).
- Deux **calques** de canvas et la coupe du ciel à 1,02 rayon (§1, §6).
- L'ouverture de fenêtre animée sur `translate` et non `transform` (README §4.1).
