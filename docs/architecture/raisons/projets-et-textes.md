# Raisons : projets, liens communs et textes

Le pourquoi des unités de `features/projects/`, `features/common/` et
`i18n/`, sorti du code (D10).

## `features/projects/models/project-catalog.model.ts`

- Le dépôt lit tout ce que la feature livre en une fois : une seule couture
  pour une future source distante, un seul cycle de chargement, et le prérendu
  lit le même.
- Le catalogue porte les deux langues ; le manager le lit dans celle du
  lecteur, donc changer de langue ne recharge rien.
- `projects` est dans l'ordre du rang, qui est la distance au centre dans la
  maquette.

## `features/projects/models/project.model.ts`

- Un `Text` est une simple chaîne quand il se lit pareil dans les deux
  langues, une paire sinon (D5).
- Le `slug` est à la fois le segment d'adresse et l'identité : deux projets
  n'en partagent jamais un.
- `short` est le nom là où la place manque : libellé de planète, repère de la
  page d'accueil.
- Il n'y a plus de niveau de preuve : le statut (`proof`) et les liens de la
  fiche disent déjà si le lecteur peut ouvrir quelque chose.
- La période (`period`) est la deuxième question d'un recruteur après
  « quoi ? ».
- Les faits (`FactsSource`) sont la source unique de ce qui se vérifie :
  la règle d'accueil, l'index, l'aperçu et la fiche lisent tous cette table,
  et une fiche ne les répète jamais.
- Chaque partie d'un `ProjectEntry` est requise : un projet sans ses faits ou
  sans sa fiche ne compile pas.

## `features/projects/models/project-detail.model.ts`

- Une fiche s'écrit avec des `Text` (les deux langues côte à côte, D5) et se
  lit dans la langue du lecteur : la même forme, `Resolved`.
- Une figure est un schéma de lecture porté par son chapitre avec sa légende,
  jamais une capture d'écran présentée comme preuve.
- Un chapitre sans titre prend le titre par défaut de sa position.
- La liste d'identité du premier chapitre (accès, rôle, stack, contexte) est
  lue dans les faits : une seconde table dans la fiche dériverait de la
  première. Le titre de la fiche est celui du projet.

## `features/projects/ports/projects-texts.port.ts`

- Ce port porte les mots autour des projets (index, aperçu, fiche, règle) ;
  ce qu'un projet dit de lui-même est dans son propre fichier (D5). Un compte
  ou un titre arrive déjà formaté.
- `defaultChapterTitles` donne le titre d'un chapitre sans titre, par
  position. Une fiche peut porter moins de chapitres et nommer les siens :
  trois chapitres écrits valent mieux que quatre dont un vide.
- `PROJECTS_TEXTS` n'a pas de valeur par défaut : une composition qui
  l'oublie échoue bruyamment.

## `features/projects/services/projects-repository.service.ts`

- Le contenu est livré avec le site, donc la réponse est synchrone ; elle
  reste un `Observable`, parce que c'est la couture où une source distante se
  brancherait, et que l'effet la lit déjà ainsi.
- Une seule lecture répond tout le catalogue : une fiche n'est jamais là
  sans son projet.

## `features/projects/states/projects/projects.effect.ts`

- La lecture est remise en `Observable` : le moteur s'y abonne lui-même, et
  abandonner une exécution désabonne la lecture au lieu d'ignorer sa réponse.
- La cause d'un échec va à l'`ErrorHandler`, l'état n'apprend que l'échec :
  la raison sert à qui débogue, le drapeau sert à la page.

## `features/projects/states/projects/projects.manager.ts`

- Les projets mis en avant se dérivent du rang : aucun drapeau, pour que la
  sélection ne puisse pas s'en écarter.
- Un catalogue distant auquel manquent des faits ne dessine pas de ligne
  vide, et n'en décale aucune : les autres gardent leur numéro.
- Les deux langues sont dans l'état ; celle du lecteur est une dérivation
  (D5).
- `find` se dérive de la liste : un rechargement qui a renommé un projet se
  voit aussitôt.
- Un seul cycle pour tout le catalogue : rien ne se montre avant les projets.

## `features/projects/states/projects/projects.state.ts`

- L'état ne garde que ce qui ne se dérive pas : le catalogue tel que le dépôt
  l'a répondu, dans les deux langues. Tout le reste (projets dans la langue
  du lecteur, mis en avant, recherche par slug, comptes par famille) est
  calculé par le manager.

## `features/projects/states/projects/projects.updater.ts`

- `requestStatus` efface l'erreur de la tentative précédente à chaque
  `request`, la ligne qu'un flux écrit à la main oublie.
- Le succès écrit le catalogue entier d'un coup : projets, faits et fiches ne
  divergent jamais sur le chargement dont ils viennent.

## `features/projects/states/projects/projects.updater.spec.ts`

- Aucun effet n'est enregistré : un `dispatch` n'exécute que l'updater. On
  teste la machine à états, pas le dépôt derrière elle.

## `features/projects/data/projects.data.spec.ts`

- Que chaque chaîne corresponde à l'export se vérifie en comparant à l'export
  lui-même, qu'une spec ne lit pas ; la spec tient ce dont le reste du site
  dépend.
- Rien n'y nomme ni ne compte un projet : ajouter un projet, c'est écrire son
  fichier, sans toucher à une spec.

## `features/projects/components/featured-bar/`

- L'axe de la règle est un rang d'importance : les repères sont également
  espacés et tous les titres sont sur la même ligne.
- Survoler un repère éclaire sa planète, et l'inverse : les deux lisent le
  même `hovered`. Sans survol, la ligne sous la règle montre le dernier corps
  lu par l'aperçu (`reading`).
- La ceinture commence à 2 % de la piste. L'écart entre deux repères est
  celui de l'export, quatre repères sur 56 % ; davantage de repères gardent
  l'écart et élargissent la ceinture jusqu'à 94 %, moins de repères gardent la
  ceinture de l'export.
- Le nom d'un repère prend environ 130 px de mono. En dessous, les noms de
  deux voisins se chevauchaient et un clic tombait sur le mauvais projet :
  les noms s'effacent et les numéros restent, comme sur un écran étroit. Les
  planètes portent les noms et chaque repère garde son nom accessible
  complet. La media query tient sans script, la mesure (`data-crowded`) tient
  pour n'importe quel nombre de repères.
- La règle arrive avec le reste de la page d'accueil (voir `Arrival`) : seule
  à la fin de la traversée sans script, retenue jusqu'à ce que le lecteur soit
  là avec un script, puis montante à partir de ce moment.
- Une fenêtre basse garde les repères et les titres et rend le reste : la
  barre de page mène déjà à tous les projets.
- Dans la spec, jsdom ne met rien en page : la piste répond la largeur qu'on
  lui donne. La sérialisation du style (jsdom compris) retire le « .0 » final
  des nombres entiers, d'où `2%` et non `2.0%`.

## `features/projects/components/project-list/`

- L'index met en tête la colonne de ce qu'un lecteur peut vérifier.
- Sélectionner une ligne l'ouvre d'un cran (sujet, fiche, lien sortant). La
  sélection appartient au bureau, parce qu'Échap et un clic dans le vide la
  ferment aussi ; un second clic sur la ligne ouverte la ferme.
- La famille affichée est tenue par le bureau : dans la maquette, le filtre
  survit à un aller-retour vers une fiche, comme la sélection.
- Filtrer ne retrie pas : l'ordre du rang ne change jamais.
- Survol et sélection se disent de la même façon : un seul jeu d'états.
- Dans le spec, chaque projet a des faits distincts, pour qu'une ligne se
  reconnaisse à son propre texte.

## `features/projects/components/project-preview/`

- L'aperçu montre ce qu'un recruteur demande d'abord (statut, rôle, stack) et
  le chemin vers la fiche.
- Il ne montre qu'un projet mis en avant : un projet hors de la sélection se
  lirait « 05 / 04 ».
- Le badge nomme ce que montre la fenêtre, pas le dernier corps survolé.
- L'aperçu n'a pas d'état : il ne montre que ce que dit son entrée `slug`.

## `features/projects/components/project-chapter/`

- `overflow-wrap: anywhere` est ce que voulait dire le `word-break:
break-word` déprécié : couper un nom long seulement là où il déborderait.

## `features/projects/components/project-detail/`

- La maquette posait les liens côte à côte sans rien entre eux ; ici ils
  passent à la ligne avec un écart.
- L'identité du projet vient de la table des faits, jamais de la prose de la
  fiche.

## `i18n/data/paths.data.ts`

- C'est la table unique des adresses du site (D4) : le français à la racine,
  l'anglais sous `/en`. Routes, liens, sélecteur de langue et alternates de
  l'en-tête la lisent, donc une adresse se renomme ici et nulle part ailleurs.
  L'adresse d'une fiche est celle-ci suivie de son slug.

## `i18n/rules/paths.rules.ts`

- `translatePath` fait passer une adresse qu'aucune vue ne réclame sous
  `/en` ou hors de `/en` sans la changer : l'adresse inconnue reste inconnue
  dans l'autre langue.

## `i18n/models/catalog.model.ts`

- `fr.data.ts` et `en.data.ts` implémentent chacun le `Catalog` entier : une
  clé absente de l'un ne compile pas (D3). Chaque couche lit sa propre
  tranche par son propre jeton, jamais le tout.
- `PagesTexts` n'est lu que par `pages/` et la racine de composition.
- `heads.sheet` est le mot de la fiche avant que son projet soit connu, ou
  quand il n'y en a pas.
- Chaque langue est nommée dans sa propre langue, comme la barre de page les
  propose.

## `i18n/services/catalog-loader.service.ts`

- Le catalogue de chaque langue est un chunk à part : seul celui qu'on lit
  se charge.
- L'initialiseur de l'application charge la langue de la première adresse
  avant le premier rendu, et chaque route charge la sienne avant de
  s'activer (`loadCatalog`) : `current` n'est jamais demandé pour un
  catalogue absent.

## `i18n/providers/i18n.provider.ts`

- Le site bilingue est câblé ici (D3) : la tranche de chaque couche répond
  dans la langue du lecteur, les liens aussi, et le catalogue de la première
  adresse est chargé avant le premier rendu.

## `features/projects/data/projects.data.ts`

L'ordre de la liste est le rang : la distance au centre de l'objet, et l'ordre
de lecture partout ailleurs. Filtrer ne réordonne jamais. Les `FEATURED`
premiers sont mis en avant. Chaque projet est un fichier sous `projects/`
(identité, faits, fiche) : en ajouter un, c'est écrire ce fichier et le nommer
ici (`docs/contenu.md`). C'est du contenu livré avec le site ; seul le
repository le lit, une source distante pourrait donc le remplacer sans
qu'aucun autre fichier ne le sache.

## `i18n/data/fr.data.ts`, `en.data.ts` et leurs tranches `*-profile.data.ts`

Le texte vient de `docs/wording/fr.md`, et chaque fait de
`docs/wording/sources.md`. La tranche de la page À propos vit à part (D22).
L'anglais, rédigé sans relecture, est marqué `draft(…)` texte par texte ;
`src/integration/drafts.spec.ts` compte ceux qui restent.
