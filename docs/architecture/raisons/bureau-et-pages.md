# Raisons : le bureau, le profil, les pages et la racine

Le pourquoi des choix de `features/desktop/`, `features/profile/`, `pages/`,
de la racine `src/app/app.*` et de `src/integration/`, sorti du code (D10).

## `features/desktop/models/desktop-ids.model.ts`

- Les ids que le balisage se renvoie (la cible du lien d'évitement, le titre
  de l'accueil, le panneau que pilotent les repères de la règle) s'écrivent
  une seule fois, pour qu'une référence et sa cible ne puissent pas diverger.

## `features/desktop/models/desktop.model.ts`

- `DesktopView` est brute exprès : savoir si le slug d'une fiche nomme un
  projet regarde le catalogue, et se décide là où le bureau et les projets se
  rencontrent (la page), jamais ici.
- `DESKTOP_WINDOWS` suit l'ordre dans lequel la page dispose les fenêtres.

## `features/desktop/ports/desktop-texts.port.ts`

- `object.select` nomme une planète de l'index, qui sélectionne sa ligne ;
  `object.preview` une planète de l'accueil, qui ouvre son aperçu.
- `object.parts` donne la constellation de chaque partie d'« À propos », dans
  l'ordre des parties.

## `features/desktop/rules/view.rules.ts`

- Un pas en arrière recule d'un cran, jamais plus : sélection → vue
  d'ensemble, fiche → index, index et « À propos » → accueil (Échap
  seulement), aperçu → fermé. C'est la seule règle que lisent à la fois
  l'effet et le bouton du vide.
- Échap va plus loin qu'un clic dans le vide : depuis l'index ou « À propos »
  il ramène à l'accueil, et depuis une adresse inconnue à la liste. Le vide,
  qui ne s'affiche que par-dessus quelque chose à fermer, ferme cela et rien
  de plus : il ne remonte jamais d'un niveau. C'est le comportement de la
  maquette, gardé exprès.
- L'adresse des vues parentes appartient à la composition, pas à la règle.

## `features/desktop/services/featured-tour.service.ts`

- Le rideau : une fois arrivé le reste de l'accueil, chaque repère de la
  règle s'allume avec sa planète, un par un, puis tout se pose. C'est le seul
  moment où le lien repère-planète est montré plutôt qu'attendu.
- Il cède la place au lecteur pour de bon : au premier survol de sa part, en
  quittant l'accueil, ou avec un aperçu ouvert.
- Il attend 4 200 ms après l'arrivée du reste, puis chaque repère reste
  allumé 900 ms.
- Fourni par le bureau : un par bureau, qui disparaît avec lui.

## `features/desktop/services/home-reveal.service.ts`

- En arrivant sur l'accueil, l'objet traverse seul : les pages, le titre, la
  règle, le rail de contact et les planètes viennent au premier geste, et de
  toute façon à la fin de la traversée (`--arrival-at`, lu dans le CSS, qui
  joue le même minutage sans script). Rien d'important n'attend une action.
- Partout ailleurs, ou avec le mouvement réduit, tout est là d'un coup : seule
  la traversée d'arrivée est attendue, comme dans la maquette. Le rappel
  d'arrivée ne court que lorsqu'un reste retenu est lâché, jamais quand il
  était montré d'emblée.
- `timed` au prérendu, où le CSS seul fait entrer le reste.
- Quitter l'accueil est un signe de présence : cela lâche le reste retenu.
- Fourni par le bureau : un par bureau, qui disparaît avec lui.

## `features/desktop/components/home-title/`

- Le titre de l'accueil, en haut à gauche : le nom, et le métier comme titre
  de la page. Il arrive avec le reste de l'accueil.
- Retenu par sa seule opacité : il ne prend pas le pointeur, et il garde le
  focus d'arrivée.

## `features/desktop/components/intro-card/`

- La carte d'ouverture, une fois par visite, par-dessus tout. Rien ne
  l'attend : le contenu est dans le document dès la première image, et la
  carte s'efface d'elle-même en CSS, même sans JavaScript. Le script ne fait
  que la retirer au premier geste. Elle est cachée entièrement quand le
  lecteur a demandé moins de mouvement.
- Le minutage : le mot se pose (0 → 2,6 s), la règle s'ouvre, le métier vient
  dessous (1,5 → 3 s), le temps de lire, puis la page monte lentement
  (jusqu'à 5,6 s, `--intro-duration`) sur l'objet qui se rassemble.
- Dans le spec, jsdom n'a pas de `matchMedia` : chaque montage le remplace
  par une réponse fixe, le mouvement réduit mis à part.
- La feuille globale n'y est pas chargée : `--intro-duration`, d'où la carte
  lit sa durée, est posé à la main comme dans `_tokens.scss`.
- Seuls `setTimeout` et `clearTimeout` y sont simulés : l'ordonnanceur sans
  zone d'Angular passe par des microtâches, et `fixture.whenStable()`
  continue de fonctionner dessous.

## `features/desktop/components/not-found-window/`

- Une adresse qui ne mène nulle part, dans la plus petite fenêtre : elle le
  dit et ramène à l'index. Jamais d'impasse.
- Le nombre de projets est compté, pas écrit : un projet ajouté change la
  phrase de lui-même.

## `features/desktop/components/desktop-scene/`

- Dans le spec, jsdom n'a pas de canvas : un contexte 2D qui accepte tout
  appel et se renvoie lui-même laisse tourner le moteur. Son dessin n'y est
  pas testé.
- Les lignes de la règle de l'accueil s'inscrivent avant le montage, comme
  le fait la règle (`ruleLines`).
- Au montage, aucune planète de l'accueil n'est encore placée : elles
  montent après la traversée, et restent hors d'atteinte jusque-là.

## `features/desktop/states/desktop/`

- Le spec de l'updater n'enregistre aucun effet : un dispatch ne fait tourner
  que l'updater, car c'est la machine à états qui est testée, pas la
  navigation derrière.
- Le changement de langue arrive sur la même vue : le lecteur n'a pas bougé,
  rien ne se remet à zéro.
- Fermer l'aperçu oublie ce qui est ouvert, pas ce qui a été lu.
- Le spec de l'effet remplace le `Router` par un faux qui enregistre où
  l'effet envoie le lecteur, sans naviguer : ce qui compte est l'URL demandée.

## `features/profile/components/about-window/`

- Quatre parties, dans l'ordre des questions d'un recruteur : qui est la
  personne, ce qu'elle sait faire, d'où elle vient, ce qu'elle cherche.
  La partie `method` s'affiche « Et après » et finit sur l'adresse e-mail,
  lue dans `CONTACT_EMAIL` : une seule source pour elle et pour le rail.
- « À propos » se lit une partie à la fois, comme les approches d'une fiche :
  le même sélecteur en haut, le même pied qui fait avancer la lecture. Le
  lecteur apprend la fenêtre une fois.
- La partie montrée compte depuis 0 ; le bureau la tient, les constellations
  la lisent. Hors bornes, elle se lit comme la première.
- Un titre est monté quelle que soit la partie : sans lui, trois vues sur
  quatre n'avaient pas de niveau un, et le focus d'arrivée n'avait pas de
  cible.
- `.facts .data` n'est pas une répétition de `.data` : sans elle, un
  `dd.data` des faits prendrait la taille courante de `.facts dd`, plus
  spécifique que `.data`.
- `.missing` est un état, donc l'encre du signal : les années manquent et le
  disent.
- Le bouton pressé ne suit que l'entrée `part` : un clic émet la partie
  demandée, il ne bascule rien de lui-même.

## `pages/desktop/`

- Le bureau est le seul écran que le lecteur ne quitte jamais. L'objet, la
  barre des pages, le rail de contact et les fenêtres y vivent, au-dessus du
  routeur, qui ne dit que l'adresse. Chaque fenêtre se montre à son adresse,
  ou partout une fois épinglée.
- La scène vient en premier, derrière tout : son ciel est sous le vide, ses
  planètes au-dessus. Chaque ancre de mise en page qui suit est un texte
  devant lequel la matière s'efface.
- Une fiche est un zoom de l'index : « Projets » reste allumé dessus.
- La règle cède la place à l'aperçu : une lecture à la fois.
- La même page existe dans chaque langue : changer de langue est une
  navigation (D3).
- Sur l'index, une planète sélectionne sa ligne et un second clic la lâche ;
  sur l'accueil, une planète vedette ouvre ou ferme l'aperçu, les seules que
  l'accueil montre.
- Le focus ne bouge qu'après le premier rendu dans un navigateur : avant, la
  vue peut encore changer pendant que la première adresse se pose, et ce
  n'est pas une navigation. Jamais au serveur, où il n'y a pas de focus.
- Le vide recule d'un cran : il est sous tout, et hors de l'ordre de
  tabulation, puisque Échap fait la même chose au clavier.
- Les emplacements placent les fenêtres ; les fenêtres prennent le pointeur,
  les emplacements le laissent passer jusqu'à l'objet. Leur profondeur est un
  rang au-dessus de `--z-window` : celui de la feuille de style par défaut
  (l'aperçu au-dessus de la fiche, au-dessus du reste), puis celui de la pile
  des fenêtres (`--stack`) dès qu'une fenêtre est touchée.
- Dans le spec, jsdom n'a pas de `matchMedia` : sans lui la station lit le
  mouvement réduit, comme au prérendu. Une réponse fixe suffit.
- jsdom n'a pas de contexte 2D : l'objet prend son repli sans canvas, ce dont
  ces specs ont besoin, sans que jsdom journalise « not implemented ».
- La feuille globale n'est pas chargée : la durée de la traversée, que
  l'arrivée lit dans le CSS (`--arrival-at`), est posée à la main comme dans
  `_tokens.scss`.
- Une route attrape-tout : les effets du pas en arrière naviguent par le vrai
  routeur, et elle l'empêche d'échouer sur une adresse que le spec ne déclare
  pas.
- Seuls `setTimeout` et `clearTimeout` sont simulés : l'ordonnanceur sans
  zone passe par des microtâches.

## `pages/resolvers/page-head.resolver.ts`

- La route résout le nom ; la stratégie l'écrit, seule.

## `pages/workbench/`

- Un banc de développement pour la fenêtre et le sélecteur partagés, tant que
  les pages qui s'en servent n'en montrent pas tous les états. Ses lignes sont
  des gabarits neutres : le banc exerce la grammaire, il ne porte aucun
  contenu du site.
- Il est disposé comme les emplacements de fenêtre de la maquette, pour que
  les plafonds rencontrent la même place que sur les vraies pages.
- Les trois familles de l'index servent à voir un sélecteur qui passe à la
  ligne à 924 px.

## `app.component.*`

- Monte le bureau une fois, au-dessus du routeur : ce qui doit survivre à une
  navigation (l'objet, le chrome, une fenêtre épinglée) vit dedans.
- La sortie du routeur ne rend que des marqueurs, et vient en premier : un
  marqueur déclare sa vue quand la sortie l'active, avant que le bureau
  en dessous soit vérifié.

## `app.config.ts`

- La racine de composition : le seul endroit où la bibliothèque se configure,
  où les ports se branchent et où l'état initial se charge.
- Sans zone : pas de polyfill `zone.js`, et la détection de changements ne
  tourne que lorsqu'un signal lu par un gabarit change (ou qu'un événement lié
  dans un gabarit se déclenche). C'est le défaut d'Angular ; c'est écrit
  quand même, pour qu'un `zone.js` ajouté par accident ne puisse pas
  rebasculer l'application sans que cette ligne le dise.
  `src/integration/zoneless.spec.ts` le tient.
- `ErrorHandler` est le seul canal que toute erreur atteint, celles de la
  bibliothèque comprises.
- Les paramètres de route arrivent en entrées de composant, au lieu d'être lus
  dans `ActivatedRoute`.
- Les transitions de vue sautent le premier rendu : une page prérendue est
  déjà là, et l'animer à l'entrée déferait l'intérêt du prérendu.
- L'hydratation adopte le balisage prérendu au lieu de le jeter pour rendre la
  même chose. Le rejeu des événements est actif par défaut : un clic fait
  avant l'arrivée du JavaScript est rejoué ensuite.
- Le chargement des projets est attendu, pour que le HTML prérendu les
  contienne déjà : le contenu au-dessus de la ligne de flottaison doit exister
  sans JavaScript.

## `app.routes.ts`

- Le banc des composants partagés n'existe qu'en développement. La condition
  lit `ngDevMode` lui-même plutôt que `isDevMode()` : le build de production
  le définit à `false`, le minifieur retire donc la branche et le chunk du
  banc avec elle, là où un appel de fonction garderait les deux.
- L'anglais d'abord : `**` attraperait aussi `/en/…`.

## `app.routes.server.ts`

- Tout est prérendu : un portfolio est du contenu, et un hébergeur statique
  le sert sans serveur Node à faire tourner. Une route qui aurait un jour
  besoin d'un rendu à la requête prendrait `RenderMode.Server` ici, et
  `outputMode` dans `angular.json` passerait à `server`.
- Une page par projet et par langue, lue dans le même dépôt que les pages :
  un projet ajouté aux données est prérendu dans les deux langues sans
  toucher ce fichier.

## `src/integration/drafts.spec.ts`

- Le compte attendu est celui des textes anglais encore à relire, mis à jour
  à chaque relecture : un compte qui bouge sans qu'on l'ait changé trahit un
  texte marqué ou relu par erreur.

## `src/integration/featured-count.spec.ts`

- Le mécanisme testé : le nombre de projets mis en avant est une seule valeur
  (`FEATURED`), et l'accueil la suit partout, quelle que soit la taille du
  catalogue. Le spec la fournit par le jeton que lit le manager, à trois et à
  cinq, sur trois et douze projets en tout.

## `src/integration/i18n.spec.ts`

- Le mécanisme testé : l'adresse dit la langue (D3, D4), et changer de langue
  est une navigation vers la même vue à son autre adresse. Les vraies routes,
  les vrais catalogues chargés en morceaux, la vraie station.
- Le critère d'acceptation : changer de langue ne perd rien de ce que le
  lecteur a disposé.
- Aucun texte n'est écrit dans un gabarit : chaque mot visible et chaque nom
  accessible d'une page anglaise est anglais. Le français s'y reconnaît à ses
  accents, qu'aucun texte anglais du site ne porte.

## `src/integration/prerender-safety.spec.ts`

- Le mécanisme testé : les services qui touchent le navigateur sont inertes
  au prérendu. La plateforme serveur est simulée par `PLATFORM_ID`, tandis
  que jsdom fournit toujours `matchMedia`, un document et une mise en page :
  une méthode qui oublierait sa garde les atteindrait, et la suite le verrait.
- Une fenêtre qui se déplace ou se mesure doit aussi se rendre au serveur.
- L'objet change le curseur : jamais au prérendu.
- Le minutage de la chorégraphie se lit dans le CSS, jamais au serveur.

## `src/integration/zoneless.spec.ts`

- Le mécanisme testé : l'application tourne sans zone.js, donc une vue se met
  à jour parce qu'un signal qu'elle lit a changé, et pour aucune autre raison.
- La zone vérifiée est celle que fournit la racine de composition, pas celle
  que TestBed donne par défaut.
- Sans zone pour remarquer l'écriture, seul le signal peut planifier le rendu.
