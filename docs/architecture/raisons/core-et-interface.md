# Raisons : `core/`, `shared/ui/`, `shared/windows/` et les styles globaux

Le pourquoi des choix de ces zones, sorti du code (D10) : chaque section
nomme l'unité qu'elle concerne.

## `src/app/core/helpers/angle.helper.ts`

- `nearestTurn` ramène un azimut à moins d'un demi-tour de la référence :
  la caméra prend toujours le chemin le plus court.
- `onCurrentTurn` remet une cible sur le tour où se trouve la caméra. Chaque
  aperçu déroule l'azimut d'un quart de tour de plus ; sans cela, revenir à
  un cadrage fixe ferait rattraper à la caméra tous les tours accumulés.

## `src/app/core/helpers/easing.helper.ts`

- `halfLifeStep` donne la part de la distance restante parcourue en `dt`
  secondes, pour un mouvement qui divise ce qui reste par deux toutes les
  `halfLife` secondes. Jamais un coefficient d'interpolation fixe : le
  mouvement dépendrait alors de la fréquence d'images.

## `src/app/core/helpers/format.helper.ts`

- `twoDigits` écrit un compte ou un rang sur deux chiffres, comme
  l'instrument les imprime partout (« 07 fiches », « 03 / 07 ») : les
  colonnes s'alignent et se comparent d'un coup d'œil.

## `src/app/core/helpers/random.helper.ts`

- `gaussian` tire des écarts normaux par la méthode polaire de Box-Muller :
  les étalements radiaux suivent une gaussienne, pour qu'aucune orbite ne se
  lise comme une ligne.

## `src/app/core/models/lang.model.ts`

- La langue d'une adresse (D4) : `/en` et tout ce qui est dessous est en
  anglais, toute autre adresse en français, à la racine. L'adresse est la
  seule source de la langue, pour que chaque page soit prérendue, indexée et
  partagée dans la sienne.

## `src/app/core/rules/draft.rules.ts`

- Les textes anglais écrits sans la relecture de l'auteur sont marqués
  `draft(…)` là où ils sont, et comptés ici. Relire un texte, c'est retirer
  son appel à `draft(` ; le spec qui les compte demande alors le nouveau
  compte.
- Un texte qui prend des valeurs (un compte, un titre) est une fonction, et
  se marque de la même façon.
- L'enregistrement se fait au chargement du module : le compte couvre ce
  qu'un spec importe, le catalogue anglais et les fichiers de projets.

## `src/app/core/rules/localize.rules.ts`

- Un `Text` est une chaîne simple quand il se lit de même dans les deux
  langues (un nom, une pile technique), une paire `Localized` sinon (D5).
- Une paire est un objet aux seules clés `fr` et `en`. Aucun autre objet du
  contenu n'a cette forme ; un objet qui a d'autres clés est du contenu, et
  `localize.rules.spec.ts` le garde.

## `src/app/core/services/errors/console-error-handler.service.ts`

- Le seul canal où arrive chaque échec : celui d'Angular, et celui de
  ngx-statewise (un dispatch mal routé, un effet qui avait promis une action
  et n'en produit aucune, la cause qu'un effet signale avant de rendre son
  `failure`). La bibliothèque remet l'échec d'un dispatch lancé sans attendre
  au handler d'Angular ; un dispatch attendu rejette à la place.
- Il écrit dans la console, dans tous les builds : le site n'a aucun service
  d'erreurs où envoyer, et la console est l'endroit où l'échec d'une page
  déployée se lit encore.
- Les échecs ne sont pas un état, car aucune vue ne les affiche. Le jour où
  une vue le fera, l'état se range derrière cette classe, et rien de ce qui
  signale n'a à changer.

## `src/app/core/services/head/document-head.service.ts`

- Le seul écrivain du `<head>` : le titre de l'onglet, la description, la
  carte de partage et les liens vers les autres langues de la page. Un seul
  écrivain, pour que l'onglet et la carte ne puissent pas se contredire, et
  que le résultat ne dépende jamais de celui de deux écrivains qui a parlé en
  dernier.
- Il écrit par `Title` et `Meta` d'Angular, et par le document pour les
  liens : tous marchent aussi sur le document du serveur, donc chaque page
  prérendue porte son propre `<head>`.
- `SITE_NAME` est ajouté à chaque titre, pour qu'un onglet dise à qui est le
  site.
- `SITE_URL` sert aux liens absolus : un canonical ou un `hreflang` doit
  nommer l'adresse complète, pas un chemin.
- La langue de la page lui est donnée, pas lue : le routeur nomme la page
  par ce service, qui ne peut pas interroger un service qui interroge le
  routeur. Elle choisit le canonical et la locale de la carte.
- Une page sans description perd celle de la page précédente au lieu d'en
  hériter : une description périmée est pire que pas de description.
- Les liens sont le canonical (l'adresse dans la langue du lecteur), un
  `hreflang` par langue, et `x-default`, qui est la française, à la racine.
  Ils sont réécrits en entier à chaque page : des liens restés de la page
  précédente enverraient un moteur de recherche vers la mauvaise.

## `src/app/core/strategies/route-head.strategy.ts`

- Chaque route se nomme par `title`, et peut se décrire par
  `data.description` et donner ses adresses dans les autres langues par
  `data.alternates`. La stratégie en fait le `<head>` du document, en un seul
  endroit, pour qu'aucune page n'ait à penser à appeler un service depuis son
  constructeur.
- Un titre qui dépend du contenu (le nom d'un projet) est le travail d'un
  resolver de route : le routeur remet à la stratégie la chaîne résolue comme
  une autre, et `DocumentHeadService` reste le seul écrivain du `<head>`.

## `src/app/shared/ui/components/segmented/`

- Le même geste et le même dessin partout (les pages, les familles de
  projets, les chapitres d'une fiche, les parties d'« à propos »). L'appelant
  ne donne que le sens (`value`, `label`, `count`, `active`) et apprend quelle
  valeur a été choisie ; quel élément devient actif reste sa décision.
- L'élément dit ce qu'est un choix, rien de son allure : l'allure se décide
  une fois, dans le composant, pour que deux sélecteurs ne divergent jamais.
- `value` est ce que le clic rend : l'appelant connaît ses propres clés, et
  n'a jamais à retrouver l'élément par son libellé ou son identité.
- `count` arrive déjà formaté : la maquette le complète à deux chiffres
  (« 07 »).
- La liste est un bloc qui passe à la ligne en entier : sa bordure grandit
  avec ses rangées, et une deuxième rangée ne déborde jamais sur ce qui suit.
  La liste de la maquette, dimensionnée sur sa ligne, laissait « Personnels »
  déborder sur les en-têtes de colonnes à 924px.
- Le compte inactif s'écrit en `--ink-2`, pas en `--line` (voir
  `_tokens.scss`) : il reste lisible, et seule la teinte marque l'actif.

## `src/app/shared/ui/components/social-links/`

- Le rail arrive avec le reste de la page d'accueil (voir `Entrance`) : seul,
  à la fin de la traversée, sans script ; retenu jusqu'à ce que le lecteur
  soit là, avec un script ; puis montant à partir de ce moment.
- Chaque lien fait 44px (`--target`), la cible tactile, jamais moins.
- Les icônes sont des Material Design Icons, sur leur grille de 24, dessinées
  dans la couleur du lien.
- Un lien `external` s'ouvre dans un nouvel onglet : un profil ailleurs, pas
  un client de messagerie.

## `src/app/shared/ui/data/social-icons.data.ts`

- Material Design Icons (Pictogrammers, Apache 2.0), sur leur grille de 24 :
  le jeu communautaire dessiné sur la grille de Material, qui a les marques
  que les Material Symbols de Google omettent. Les quatre viennent du même jeu
  pour partager une graisse : `email-outline`, `linkedin`, `github`,
  `file-document-outline` (le CV).

## `src/app/shared/ui/models/entrance.model.ts`

- Où se tient le reste de la page d'accueil pendant la traversée
  d'ouverture : les pages, le titre, la règle et le rail de contact attendent
  le lecteur, comme dans la maquette, mais restent dans le document dès la
  première image, pour le prérendu.
- `timed` : pas encore de script (le prérendu, ou aucun). Le CSS seul le fait
  entrer à `--arrival-at`, la fin de la traversée.
- `held` : le script a pris la main et le retient jusqu'au premier geste, ou
  la fin de la traversée.
- `shown` : là, montant depuis le moment où il a été laissé entrer.

## `src/app/shared/ui/ports/shared-texts.port.ts`

- Les mots que disent les composants partagés eux-mêmes, quelle que soit la
  page qui les utilise. Ils ne connaissent aucune langue : la racine de
  composition répond à ce jeton avec le catalogue du lecteur, et tout texte
  qu'un appelant passe reste le sien.
- Pas de valeur par défaut : une composition qui l'oublie échoue
  bruyamment, pas en français.

## `src/app/shared/ui/services/view-focus.service.ts`

- Le focus se pose, quand le lecteur arrive sur une vue, sur le titre de
  cette vue. Chaque titre s'inscrit (`appViewHeading`) ; le bureau réclame
  celui qui est dans le conteneur de la vue.
- La réclamation tient jusqu'à ce que ce titre soit là, car une fenêtre se
  monte au rendu qui suit la navigation ; elle abandonne après 2500 ms
  (`CLAIM_DEADLINE_MS`) : un titre qui n'est jamais venu n'est pas attendu.
- Le conteneur est redemandé à chaque fois : il peut ne pas exister encore
  lui non plus, quand la vue le monte avec son titre. Une nouvelle
  réclamation remplace la précédente.
- Des ensembles simples, pas un état : rien ici n'est rendu.

## `src/app/shared/ui/directives/view-heading.directive.ts`

- Le titre s'inscrit une fois rendu, pour être déjà dans son conteneur ; et
  seulement dans un navigateur, là où il y a un focus à déplacer.

## `src/app/shared/windows/components/window/`

- La barre de titre est une poignée pour le pointeur seul, qui ne prend pas
  le focus : replier a son propre bouton, et déplacer n'a pas d'équivalent au
  clavier dans la maquette.
- L'ouverture joue sur `translate`, pas `transform` : `transform` appartient
  au glissement, et une animation en `fill-mode: both` écraserait la
  position que le lecteur a choisie.
- Les boutons de la barre font 34×32, sous la cible de 44px à dessein : ils
  sont secondaires, et doublés par le clavier.
- Les bandes que la maquette répétait dans chaque appelant (outils, pied)
  sont dessinées une fois, ici. Une bande vide ne dessine rien.
- Seul le corps défile, et arriver en bas ne fait jamais défiler la page
  derrière. Sa marge intérieure diffère selon la vue : l'appelant la pose
  (`--window-body-padding`).

## `src/styles.scss`

- Les styles globaux seulement, chacun dans son partiel sous
  `src/assets/styles/` : les jetons de la maquette, les polices, les
  défauts des éléments, l'entrée partagée, et les quelques utilitaires que
  toutes les pages partagent. Ce que les composants partagent au-delà est un
  mixin (`src/assets/styles/mixins/`), trouvé par le chemin d'inclusion posé
  dans `angular.json`.

## `src/assets/styles/_base.scss`

- Les défauts des éléments de la maquette : ce que toutes les vues
  partagent avant qu'un composant dise quoi que ce soit.
- `:focus-visible` est plus large que le `:where(a, button, [tabindex])` de
  la maquette : le contrat est un focus visible partout, et un contrôle que
  la maquette n'avait pas (un champ, un `summary`) ne doit pas arriver sans.

## `src/assets/styles/_fonts.scss`

- Les deux familles sont livrées avec le site plutôt que chargées d'un CDN :
  le contenu doit s'afficher sans aucun tiers joignable.
- Les fichiers par graisse déclarent chaque sous-ensemble avec son
  `unicode-range`, comme la feuille Google Fonts de la maquette : le
  navigateur ne télécharge que les sous-ensembles que le texte utilise.
- IBM Plex Mono porte toute l'interface (libellés, navigation, données,
  compteurs) ; Instrument Sans, le texte courant seulement.

## `src/assets/styles/_motion.scss`

- La seule entrée que toutes les vues partagent, définie une fois : un
  composant qui anime avec `rise` sans définir ses propres keyframes trouve
  celles-ci.

## `src/assets/styles/_tokens.scss`

- Les jetons de « la station », en propriétés CSS, pour que les composants
  et le canvas les lisent à l'exécution.
- Mode nuit seulement : un trou noir sur un fond clair ne tient pas. Les
  valeurs sont celles du `applyTheme()` de l'export, pas de son `:root`, qui
  porte encore la palette claire que le thème de nuit écrase.
- `--accent`, `--sig` : deux encres et rien d'autre. L'accent dit « ici », le
  signal dit « état » ; tout le reste est gris.
- `--line` est un filet, jamais une encre : à 1,57:1, un texte écrit avec est
  illisible.
- `--vitre` : 72 % est le voile le plus léger sous lequel un paragraphe posé
  sur de la matière en mouvement se lit encore.
- `--m1` à `--p3` : une seule échelle, en pixels. Les `em` imbriqués se
  composaient : un compteur à 0,92em dans un bouton à 0,66em sortait à
  9,7px. Le plancher est 11px, strict. En mono, par rôle : `m1` libellé en
  capitales, `m2` commande, `m3` donnée, `m4` glyphe. En texte courant :
  `p1` secondaire, `p2` corps, `p3` emphase.
- `--ls-caps`, `--ls-title`, `--ls-mono` : un espacement de lettres par rôle
  (capitales, titres mono, données mono). Les grands titres gardent
  l'espacement de l'export, un par titre : ils se dessinent un par un, ils ne
  se lisent pas sur une échelle.
- `--gutter` : la marge latérale de la page. Le chrome, la règle et les
  fenêtres s'y tiennent, pour s'aligner à toutes les largeurs.
- `--target` : la cible tactile, jamais moins. `--target-compact` sert aux
  contrôles secondaires que le clavier double (les onglets du sélecteur, la
  navigation).
- `--radius`, `--radius-control` : des coins presque carrés, un instrument et
  pas une application grand public. Les figures prennent `--radius` ; les
  contrôles, et l'anneau de focus tracé autour, le plus serré.
- `--glass-blur`, `--glass-blur-window` : le verre du chrome (la navigation,
  le rail de contact), et celui des fenêtres, que l'export dessine un peu
  plus lourd.
- `--t-duration`, `--t` : une durée, et la courbe qui va avec. Le survol d'un
  onglet ou d'un contrôle de fenêtre prend la durée seule, comme dans
  l'export.
- `--arrival-at` : la fin de la traversée d'ouverture. Le reste de la page
  d'accueil arrive alors, de lui-même, quand aucun geste ne l'a fait venir
  plus tôt (voir `Entrance`).
- `--intro-duration` : la durée de la carte d'ouverture, qui s'efface d'elle-même
  à ce moment.
- `--z-*` : des étages de profondeur, espacés pour que deux couches ne
  puissent jamais être à égalité ; à `z-index` égal, l'ordre du DOM décide,
  ce qui est du hasard. Les fenêtres prennent de 5 à 8, la dernière touchée
  devant ; le lien d'évitement est au-dessus de tout.

## `src/assets/styles/_utilities.scss`

- Les quelques classes que toutes les vues partagent, écrites une fois. Tout
  le reste est un mixin, inclus là où il sert : une classe ici est globale,
  et gagnerait ou perdrait contre les règles d'un composant par spécificité
  plutôt que par intention.
- `.visually-hidden` : hors de vue, toujours lu, tant qu'il ne tient pas le
  focus et qu'on ne clique pas dessus.
- `.landing` : le titre où se pose le focus d'une vue qui n'en a pas de
  visible. Caché même avec le focus, à la différence du lien d'évitement.
- `.skip-link` : atteint au clavier, il s'affiche par-dessus la page, comme
  le `.skip:focus` de l'export, au lieu de tomber dans le flux et de pousser
  la scène vers le bas.

## `src/assets/styles/mixins/_arrival.scss`

- Le reste de la page d'accueil (le titre, la règle, le rail de contact)
  arrive à la fin de la traversée d'ouverture (voir `Entrance`). Sans script,
  le CSS fait monter chaque partie seule à `--arrival-at` (`on-its-own`) ;
  avec un script, le bureau les retient (`held`) jusqu'à ce que le lecteur
  soit là, puis les laisse monter à partir de ce moment (`shown`), chacune
  avec son propre délai.
- `held($hide)` : `$hide` retire aussi l'élément du chemin du lecteur ; le
  titre garde sa place, pour le focus d'arrivée.

## `src/assets/styles/mixins/_controls.scss`

- Chaque mixin porte ce que les contrôles et les surfaces partagés ont en
  commun ; ce qu'un composant fait autrement reste dans son composant.
- `marker` : un carré qui marque un titre ou un point, plein, jamais tracé.
- `lit` : la face d'un contrôle survolé ou actif, la même pour les onglets
  et les boutons à glyphe.
- `next-link` : le lien qui mène plus loin (« Fiche complète → », « Projet
  suivant → »), un `<a>` ou un `<button>`, souligné par l'accent et assez
  haut pour le toucher. Un bouton perd d'abord sa propre face, et prend
  l'encre d'accent qu'un lien a déjà.

## `src/assets/styles/mixins/_facts.scss`

- Une liste de faits (`dl`) : une rangée par fait, le terme dans sa propre
  colonne, la valeur prenant le reste. Chaque liste pose la marge de ses
  rangées et la largeur de son terme, comme le fait l'export.

## `src/assets/styles/mixins/_motion.scss`

- `reduced` est l'endroit où un lecteur qui a demandé moins de mouvement
  l'obtient : chaque composant écrit ses exceptions sous cette seule
  requête.

## `src/assets/styles/mixins/_type.scss`

- Les voix mono de l'interface. Le texte courant est la police du corps et
  n'a pas besoin de mixin.
