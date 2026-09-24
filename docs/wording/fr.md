# Wording FR : proposition v4

Document de travail, à relire avant toute intégration dans le code. Les faits
viennent de `sources.md`. Ce qui manque est marqué **[à confirmer]**. La v2
intégrait deux relectures indépendantes (section 7). La v3 intègre tes réponses
et la cohérence avec le portfolio de ta collègue (section 8).

## 1. Les principes, et pourquoi

**Qui lit, et ce qu'il cherche.** Un RH qui trie des profils d'alternants, un
lead dev ou un CTO qui juge le niveau, un dirigeant de PME ou un client
freelance. Les trois veulent savoir vite qui tu es, ce que tu sais faire, si
c'est vrai, et comment te joindre. Chaque texte répond à une de ces quatre
questions, sinon il sort.

**Ce que je retire, et pourquoi.**

- **Le système de « preuve »** (colonne « Ce qu'on peut vérifier », niveaux
  « Ouvrable par vous / Sur récit seulement », chapitres « Ce qui n'est pas
  démontré »). C'était une précaution d'IA : ne rien affirmer. Pour un lecteur
  humain, sept fiches qui finissent par ce que tu n'as pas prouvé, c'est sept
  fois la même excuse. Le lien vers Google Play ou le dépôt fait la preuve, et
  le statut dit s'il y en a un.
- **Le vocabulaire de la métaphore** : « relevé », « fiches », « corps en
  orbite », « approches », « l'objet ». L'espace reste dans le visuel, avec un
  seul clin d'œil dans le texte (« Projets en orbite ») et un sur la page 404.
- **L'archéologie comme fil rouge.** Tu as été archéologue parce que tu es toi,
  pas l'inverse. Elle devient une ligne du parcours et une phrase du profil.
- **Le volet « Méthode ».** Des phrases que n'importe quel candidat peut signer.
  Remplacé par « Et après » : ce que tu cherches, concrètement.
- **Tout ce qui est faux** (section 2).

**Le registre.**

- « Je » partout. Le lecteur est vouvoyé là où on s'adresse à lui, c'est-à-dire
  seulement dans le contact. C'est l'usage de tous les portfolios de devs
  français observés ; le tutoiement passerait mal auprès d'un RH ou d'un
  dirigeant.
- Le franglais du métier quand il est clair pour tout le monde (front, back,
  API, stack, framework, firmware). Les noms propres plutôt que le jargon :
  « Google Play » plutôt que « les stores ».
- Ni langage d'IA, ni copain forcé. Pas de tirets cadratins, pas de chute après
  deux-points, pas de « ce n'est pas X, c'est Y », pas de maximes ni de slogans
  symétriques. Pas de « galère », « bosser », « hello », ni de points
  d'exclamation. Des phrases de longueurs différentes, des mots ordinaires.
- Une information n'est dite qu'une fois par fiche. « Seul » est dans le champ
  Rôle, et nulle part ailleurs.
- Une seule confidence dans tout le site : la curiosité, dans le profil.
- Pas de chiffres pour faire sérieux. Aucun téléchargement, aucune adoption :
  tout appuyer sur des chiffres est un réflexe d'IA. Il en reste deux, parce
  qu'ils décrivent un résultat technique et non une audience : la connexion
  Bluetooth 20 % plus rapide (Skyted 320) et la couverture de tests à 100 %
  (ngx-statewise).
- La Dordogne ne s'écrit pas comme un argument. Elle est dans la façon de dire
  (« un métier qui nourrit mal son homme »). Toulouse est écrit, parce qu'un
  recruteur en a besoin.

**Ce que je garde.** Accueil, Projets, À propos, En entreprise, Personnels,
Tous les projets, Replier / Déplier / Fermer la fenêtre, Aller au contenu. Tout
changer pour tout changer serait aussi artificiel que ce qu'on corrige.

## 2. Les faits corrigés

| Projet           | Le site dit aujourd'hui                                               | En réalité                                                                                                                                        |
| ---------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skyted Voice     | .NET MAUI, publiée sur deux magasins                                  | Avalonia (une version MAUI a existé), Google Play seulement, depuis le 8 juin 2026                                                                |
| Skyted Voice     | « l'application, c'est moi », seul de bout en bout                    | ton projet, d'abord en MAUI puis en Avalonia ; une collègue a participé au développement                                                          |
| Skyted App       | Swift et Kotlin, « reprise après le départ du développeur précédent » | en binôme, sur iOS et Android : correctifs, refonte du Bluetooth pour le firmware V24, migration Firebase                                         |
| Skyted Companion | interne, en équipe, natif                                             | desktop Avalonia Windows/macOS/Linux, conçue et développée seul                                                                                   |
| Speakey          | prototype personnel, mobile, « écrit pour apprendre »                 | projet Skyted : front Angular et API .NET 10 en production, hors moteur de reconnaissance. Arrêté.                                                |
| Bk-ONE           | « flux ISO 20022 », « validation à la frontière » retenue             | Java Swing pur, refonte de l'interface et des flux XML. Ta proposition retenue : lire le XML une fois en objets, au lieu de le modifier en chaîne |
| ngx-statewise    | « updators », flux en 3 étapes                                        | 1.0 en bêta : `updater`, étape `interceptor`, site de doc FR/EN                                                                                   |
| Parcours         | années à renseigner                                                   | toutes connues (CV)                                                                                                                               |
| TrainWays        | absent                                                                | remise en production chez Skyted, en binôme, republiée sur Google Play et l'App Store en 2026                                                     |

## 3. Les changements de structure

Chacun touche au code (clés, types ou gabarits), donc une PR après celles de
l'étape 4. Par ordre d'intérêt :

1. **Une ligne de situation sur l'accueil**, sous le métier (nouvelle clé
   `home.status`). Aujourd'hui, un recruteur qui arrive ne sait pas que tu
   cherches.
2. **« Et après » remplace « Méthode »** et passe en dernier : Profil,
   Compétences, Parcours, Et après. On réutilise les clés de `method` et on
   ajoute une ligne de contact (`method.contact`), le seul appel à écrire du
   site.
3. **Un lien vers ton CV en PDF**, le Full Stack .NET / Angular, dans le rail de
   contact (libellé « CV », aria « Télécharger mon CV en PDF »). C'est le bon
   choix : c'est celui qui colle au titre de l'accueil. Le fichier irait dans
   `public/`. Attention, il contient ton numéro de téléphone : sur un site
   public, il sera lisible par les robots : on publie une version sans le
   numéro.
4. **Retirer la ligne de niveau de preuve** dans le relevé et l'aperçu
   (`proofLevels`). La colonne devient « Statut » et affiche `facts.proof`.
5. **Ajouter la période** de chaque projet (`facts.period`). « Quand ? » est la
   deuxième question d'un recruteur après « quoi ? ».
6. **Speakey passe en « En entreprise », et TrainWays arrive** (6 en
   entreprise, 2 personnels, 8 projets).
7. **Nouvel ordre des projets**, section 5.
8. **Supprimer `path.missing`**, qui ne sert plus.

Une fiche peut remplacer le titre par défaut d'un chapitre quand il ne colle
pas. Le code le permet déjà.

## 4. Le texte de l'interface

### 4.1 Commun (`shared`)

| Clé                            | Avant                                                     | Après                                                |
| ------------------------------ | --------------------------------------------------------- | ---------------------------------------------------- |
| window.pin                     | Épingler : garder la fenêtre ouverte en changeant de page | Garder cette fenêtre ouverte en changeant de page    |
| window.unpin                   | Détacher : la fenêtre se refermera en changeant de page   | Laisser cette fenêtre se fermer en changeant de page |
| window.fold / unfold / close   | Replier / Déplier / Fermer la fenêtre                     | inchangé                                             |
| segmented.label                | Sélection                                                 | inchangé                                             |
| pageBar.languages / navigation | Langue du site / Navigation principale                    | inchangé                                             |
| contactRail.label              | Me contacter                                              | inchangé                                             |
| contactRail.pause              | Mettre l'animation de l'objet en pause                    | Mettre l'animation en pause                          |
| contactRail.resume             | Reprendre l'animation de l'objet                          | Relancer l'animation                                 |

### 4.2 Projets (`projects`)

| Clé                                | Avant                                                                   | Après                                                           |
| ---------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| defaultChapterTitles               | Pourquoi ? · Qu'ai-je fait ? · Quel arbitrage ? · Qu'est-ce qui tient ? | Le besoin · Ce que j'ai fait · Un choix technique · Aujourd'hui |
| index.heading                      | Projets · le relevé                                                     | Projets                                                         |
| index.label                        | Fenêtre : relevé des projets                                            | Liste des projets                                               |
| index.title(n)                     | Projets — le relevé des n réalisations                                  | Les n projets                                                   |
| index.count(n)                     | n fiches                                                                | n projets                                                       |
| families.label                     | Familles de projets                                                     | Filtrer les projets                                             |
| families.all                       | Tout / Voir tous les projets                                            | Tous / Afficher tous les projets                                |
| families.professional              | En entreprise / Ne voir que les réalisations faites en entreprise       | En entreprise / Afficher les projets faits en entreprise        |
| families.personal                  | Personnels / Ne voir que les projets personnels                         | Personnels / Afficher les projets personnels                    |
| index.summary                      | p en entreprise · q personnels                                          | inchangé                                                        |
| index.columns                      | Réf · Projet · Ce qu'on peut vérifier · Rôle tenu                       | N° · Projet · Statut · Mon rôle                                 |
| index.read                         | lu                                                                      | consulté                                                        |
| index.openSheet, preview.openSheet | Ouvrir la fiche →                                                       | Voir le projet →                                                |
| preview.label                      | Fenêtre : aperçu du projet                                              | Aperçu du projet                                                |
| preview.bodies                     | Corps en orbite                                                         | Projets mis en avant                                            |
| preview.body(n, t)                 | Aperçu n — t                                                            | Projet n : t                                                    |
| preview.terms                      | Preuve · Rôle · Pile                                                    | Statut · Rôle · Stack                                           |
| sheet.label                        | Fenêtre : fiche de projet                                               | Détail du projet                                                |
| sheet.approaches                   | Approches de la fiche                                                   | Parties                                                         |
| sheet.approach(n, t)               | Approche n — t                                                          | Partie n : t                                                    |
| sheet.terms                        | Accès · Rôle · Technique · Contexte                                     | Statut · Rôle · Stack · Contexte (+ Période)                    |
| sheet.nextApproach(t)              | Suite : t →                                                             | inchangé                                                        |
| sheet.nextProject(s)               | Suivant : s →                                                           | inchangé                                                        |
| rule.heading                       | Projets en orbite                                                       | inchangé                                                        |
| rule.all                           | Tous les projets →                                                      | inchangé                                                        |

Le premier chapitre s'appelle « Le besoin », pas « Le contexte », parce que le
champ « Contexte » (Skyted, Numerilis, Personnel) existe déjà. « Un choix
technique » est au singulier exprès : une vraie décision expliquée vaut mieux
qu'une liste.

### 4.3 Bureau (`desktop`)

| Clé                     | Avant                                                             | Après                                           |
| ----------------------- | ----------------------------------------------------------------- | ----------------------------------------------- |
| object.select(n, t)     | Sélectionner n — t dans le relevé                                 | Afficher t dans la liste                        |
| object.preview(t)       | Aperçu du projet t                                                | inchangé                                        |
| object.parts            | Profil · Compétences · Méthode · Parcours                         | Profil · Compétences · Parcours · Et après      |
| home.void               | Refermer et revenir à la vue d'ensemble                           | Fermer les fenêtres                             |
| home.name               | Pierre-Marie Marchio                                              | inchangé                                        |
| home.trade              | Concepteur développeur d'applications                             | **Développeur .NET et Angular**                 |
| home.status (nouveau)   |                                                                   | **Je cherche le prochain projet à construire.** |
| home.brand              | Portfolio                                                         | inchangé                                        |
| notFound.heading, label | Adresse inconnue / Fenêtre : adresse inconnue                     | Page introuvable                                |
| notFound.title          | Cette réalisation n'existe pas.                                   | Rien en orbite à cette adresse.                 |
| notFound.sentence(n)    | L'adresse demandée ne correspond à aucune des n fiches du relevé. | Aucun des n projets ne correspond à ce lien.    |
| notFound.back           | Tous les projets →                                                | inchangé                                        |

**Pourquoi « Développeur .NET et Angular ».** Tu fais du front, du back, du
desktop et du mobile. Tout lister, c'est le « il fait tout, donc rien de bien »
que tu crains. Or presque tout passe par deux technos : Angular pour le web,
.NET pour le back, le desktop (Avalonia) et même le mobile (Voice). Le titre dit
la vérité sans énumérer, les projets montrent l'étendue. « Concepteur
développeur d'applications » reste en toutes lettres dans le profil, là où un
RH cherche le titre préparé. Le titre tient sur une ligne dès que l'écran le
permet.

**Pourquoi « le prochain projet à construire ».** « Je cherche une alternance à
Toulouse… » sonnait comme une petite annonce et réduisait la recherche à
l'alternance. « Disponible », « ouvert », « à l'écoute de nouvelles
opportunités » ou « de nouvelles solutions » : c'est le vocabulaire de
LinkedIn, que n'importe quel candidat peut signer. « Projet » a le sens de
« selon le projet », à la fin de « Et après », qui donne le détail. Le prochain
projet est celui qui manque à ceux qui tournent sur l'accueil. « Construire »
dit la conception sans la nommer. Pas de ville : elle est dans le profil et
dans la description Google.

### 4.4 À propos (`profile.about`)

| Clé      | Avant              | Après                 |
| -------- | ------------------ | --------------------- |
| heading  | À propos           | inchangé              |
| label    | Fenêtre : à propos | À propos              |
| parts    | Parties du profil  | Rubriques             |
| title(p) | À propos — p       | À propos : p          |
| goTo(p)  | Aller à : p        | Aller à la rubrique p |
| next(p)  | Suite : p →        | inchangé              |
| back     | Tous les projets → | Voir les projets →    |

**Profil**

- _Accroche_ : Mes premières lignes de code, je les ai écrites pour modder
  Skyrim et Crusader Kings.
- _Faits_ :
  - Poste : Développeur en alternance chez Skyted, depuis octobre 2025
  - Formation : Concepteur développeur d'applications (bac+3), Simplon,
    jusqu'en avril 2027
  - Rythme : 3 semaines en entreprise, 1 semaine en formation
  - Lieu : Toulouse, ou en télétravail
  - Langues : Bilingue français-anglais
- _Texte_ :

  > Il y a toujours eu un PC à la maison, et je voulais savoir ce qu'il y
  > avait dedans. Mais je suis curieux de tout, et j'ai mis du temps à
  > choisir. J'ai d'abord été archéologue, cinq ans sur des chantiers de
  > fouilles. Un beau métier, qui nourrit mal son homme. Pendant tout ce
  > temps, je n'ai pas arrêté les mods.
  >
  > En 2021, j'ai choisi le développement. Je suis aujourd'hui en
  > alternance chez Skyted, où je touche à tout : front Angular, API .NET,
  > applications desktop et mobiles reliées en Bluetooth à un casque. Ma
  > curiosité y trouve son compte. Pour ne pas m'éparpiller, je fais passer
  > presque tout par .NET et Angular, jusqu'à une application Android écrite
  > en C#.
  >
  > Ce qui m'intéresse le plus, c'est la conception, la façon de découper un
  > code pour qu'on puisse encore le faire évoluer dans deux ans. C'est aussi
  > là que j'ai le plus à apprendre.

  Ta femme n'apparaît plus. La phrase sur le départ du référent technique non
  plus : elle est vraie et figure sur ton CV, mais sur un site public elle peut
  se lire comme une critique de Skyted. Elle a sa place en entretien.

  « J'ai choisi le développement » remplace « j'ai décidé d'en faire mon
  métier » : le « en » renvoyait trop loin, on pouvait lire l'archéologie, et
  « métier » venait juste avant. Le verbe répond à « j'ai mis du temps à
  choisir ».

  « Je voulais savoir » remplace « j'ai toujours eu […] l'envie » : un seul
  verbe portait un PC et une envie, et le « Mais » qui suit n'avait rien à
  contredire. Les mods, faits avant et pendant l'archéologie, relient
  l'accroche à 2021 ; la phrase vient après « nourrit mal son homme », sinon
  « un beau métier » semblait parler des mods.

  La curiosité, force et faiblesse, ce sont tes mots : « y trouve son compte »
  pour la force, « pour ne pas m'éparpiller » pour la réponse au « moyen en
  tout ». Le fait qui le prouve est Voice, passée en Avalonia pour partager le
  code.

  Une phrase sur l'espace a fermé le profil un temps. Elle est sortie : elle ne
  disait rien du développeur, et le décor parle seul. Le profil finit de
  nouveau sur ce qui reste à apprendre, qui ouvre « Et après ».

**Compétences**

- _Titre_ : Compétences. _Intertitre_ : Ce que je pratique
- _Domaines_ :
  - Web : Angular (signals, SSR, i18n), TypeScript, SCSS
  - Back : C#, .NET 10, ASP.NET Core, EF Core, PostgreSQL, Firebase
  - Desktop : Avalonia, sur Windows, macOS et Linux
  - Mobile : Kotlin Multiplatform, Swift, Avalonia
  - Bluetooth et audio : Bluetooth Classic et BLE, audio temps réel
  - Architecture : Clean Architecture, DDD, CQRS, tests d'architecture
  - Mise en production : GitHub Actions, Docker, VPS OVHcloud
- _Texte_ :

  > Je travaille tous les jours en C# et en Angular, avec Avalonia pour le
  > desktop. J'ai aussi livré du Kotlin en entreprise. Java, Swift et React, je
  > les ai pratiqués de moins près.

  C'est la réponse au « moyen en tout » : dire soi-même où on est fort. La
  phrase d'annonce (« Je ne mets pas tout au même niveau ») sort, l'ordre des
  phrases le montre déjà. La
  ligne « Métier : flux bancaires, compensation européenne » sort, un stage de
  trois mois ne fait pas une compétence métier.

  « Kotlin Multiplatform » dit déjà Kotlin. « Avalonia » tout court : tu l'as
  utilisé sur toutes les plateformes, et « Avalonia Android » le réduisait.

  « Outillage » devient « Mise en production », les mots de la fiche Speakey :
  Git sort, tout le monde s'en sert ; GitHub Actions, Docker et un VPS disent
  qu'on sait mettre en ligne soi-même. « Architecture » reste telle quelle,
  même si elle dépend du projet : la ligne dit ce que tu connais, pas ce que
  tu appliques partout, et c'est la trace, dans les compétences, de la
  conception du profil et du bac+5 d'« Et après ». Le template .NET et
  Companion la montrent.

**Parcours** (intertitre : Étapes)

| Année       | Étape                                                                |
| ----------- | -------------------------------------------------------------------- |
| 2025 –      | Alternance chez Skyted, titre Concepteur développeur d'applications  |
| 2025        | Projets open source : ngx-statewise et un template d'API .NET        |
| 2024        | Stage chez Numerilis, à Paris : refonte de l'application Java Bk-ONE |
| 2024        | Titre Développeur web et web mobile, AFPA, félicitations du jury     |
| 2023        | Apple Foundation Program, Simplon                                    |
| 2021 – 2023 | Autoformation au développement                                       |
| 2020        | Licence d'archéologie, université Toulouse-Jean Jaurès               |
| 2016 – 2021 | Archéologue sur des chantiers de fouilles                            |

Le plus récent en haut, comme sur un CV.

**Et après** (remplace Méthode ; intertitre : Ce que je cherche)

1. Une alternance pour terminer mon titre, jusqu'en avril 2027.
2. Ensuite, un bac+5 en alternance, pour aller vers l'architecture logicielle.
3. Une équipe où quelqu'un relit mon code. J'ai beaucoup appris en travaillant
   seul, mais j'ai fait le tour de ce que ça m'apporte.
4. Je reste ouvert à un CDI ou à une mission freelance, selon le projet.

_Contact_ : Pour en parler, écrivez-moi à pierremariemarchio.pro@gmail.com.

La phrase 3 est celle de ta lettre de motivation. Elle admet une limite, et
c'est pour ça qu'on la croit. Rien n'est dit de la situation de Skyted :
« terminer mon titre » suffit, comme sur ton CV.

### 4.5 Contact et en-têtes (`profile.contact`, `pages`)

| Clé                                            | Avant                                                                     | Après                                                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| contact.email                                  | M'écrire à pierremariemarchio.pro@gmail.com                               | inchangé                                                                                                                      |
| contact.linkedin / github                      | Profil LinkedIn / Dépôts GitHub de Pierre-Marie Marchio                   | inchangé                                                                                                                      |
| titre « Email » (`contact.data.ts`)            | Email                                                                     | E-mail                                                                                                                        |
| heads.home.description                         | Portfolio de Pierre-Marie Marchio, concepteur développeur d'applications. | Pierre-Marie Marchio, développeur .NET et Angular à Toulouse, en recherche d'alternance. Ses projets web, desktop et mobiles. |
| heads.index.description                        | Les projets de Pierre-Marie Marchio.                                      | Les projets de Pierre-Marie Marchio, en entreprise et personnels, avec ce qu'il y a fait.                                     |
| heads.about.description                        | Qui est Pierre-Marie Marchio.                                             | Parcours, compétences et recherche d'alternance de Pierre-Marie Marchio, développeur à Toulouse.                              |
| heads.notFound.title                           | Adresse inconnue                                                          | Page introuvable                                                                                                              |
| autres titres, skipLink, navigation, languages |                                                                           | inchangé                                                                                                                      |

Les descriptions sont à la troisième personne : c'est ce que Google et
LinkedIn affichent, hors du site.

## 5. Les projets

**Ordre proposé** : Skyted Companion, Skyted Voice, ngx-statewise, Template
.NET, puis Speakey, Skyted 320, TrainWays, Bk-ONE.

Les quatre premiers sont sur l'accueil. Chacun montre une facette (desktop et
Bluetooth, mobile publié, front open source, back open source). Deux s'ouvrent
en un clic, et ce qui ne s'ouvre pas en un clic ne se voit pas. Speakey vient
juste après : c'est ton meilleur projet full-stack, mais il n'a pas de lien.
Les projets faits à deux (Skyted 320, TrainWays) viennent ensuite. On voit ainsi
d'abord ce que tu as porté toi-même, sans rien retirer à ta collègue.

Chaque fiche a deux à quatre parties de deux ou trois phrases. Au-delà,
personne ne lit.

Période des projets Skyted : **2025 – 2026**, le temps de ton alternance.

### 5.1 Skyted Companion

- tag : en cours
- sujet : L'application desktop du prochain casque Skyted, pour Windows, macOS
  et Linux, écrite en .NET avec Avalonia.
- résumé : application desktop, trois systèmes
- statut : En développement · code privé · rôle : Seul, de la conception au
  code · stack : .NET · Avalonia · Bluetooth · contexte : Skyted · période :
  2025 – 2026
- chapô : La version ordinateur de l'application qui pilote les casques
  Skyted.
- **Le besoin** : L'application du casque existait sur téléphone. Pour le
  prochain modèle, il la fallait aussi sur ordinateur, et sur les trois
  systèmes.
- **Ce que j'ai fait** : Le modèle de domaine, l'interface et son design
  system, la persistance avec EF Core, et un installeur pour chaque système.
  L'application s'appuie sur le monorepo .NET de Skyted, qu'elle partage avec
  Skyted Voice.
- **Un choix technique** : Le Bluetooth ne se programme pas de la même façon
  sur Windows, macOS et Linux, ni en Bluetooth Classic ni en BLE. J'ai mis les
  trois implémentations derrière une seule interface, choisie au démarrage par
  injection de dépendances. Le reste de l'application ignore sur quel système
  elle tourne.
- **Aujourd'hui** : Elle est toujours en développement. La connexion
  Bluetooth Classic et BLE est stable sous Windows, et la prochaine étape est
  l'intégration du SoundBubble.

« La prochaine étape est », au présent : officiellement le projet continue, et
le changement de priorités n'a rien à faire sur le site. « Stable sous
Windows » dit aussi, sans le souligner, que macOS et Linux ne le sont pas
encore. C'est honnête sans être une excuse.

### 5.2 Skyted Voice

- tag : publiée
- sujet : Une application Android gratuite qui amplifie la voix, pour les
  personnes qui ont du mal à se faire entendre.
- résumé : amplification de la voix, Android
- statut : Sur Google Play · rôle : Conception, développement et publication · stack
  : .NET · Avalonia · audio temps réel · contexte : Skyted · période : 2025 –
  2026
- chapô : Pour ceux dont la voix porte mal, qu'elle soit fatiguée ou abîmée.
- **Le besoin** : On parle normalement dans le micro d'un casque Bluetooth, et
  le téléphone restitue la voix plus fort, par son haut-parleur ou une
  enceinte. Elle marche avec n'importe quel casque Bluetooth, et mieux avec le
  Skyted 320.
- **Ce que j'ai fait** : La chaîne audio capte le micro du casque et renvoie
  le son en continu vers la sortie du téléphone, avec AudioRecord et
  AudioTrack. Une collègue a participé au développement, et j'ai assuré la
  publication sur Google Play.
- **Un choix technique** : Je l'avais d'abord écrite en .NET MAUI. Je l'ai
  passée en Avalonia, comme Companion, pour que les applications de Skyted
  partagent leur code au lieu d'utiliser chacune un framework différent. À
  terme, la refonte de l'application mobile, sur iOS et Android, doit pouvoir
  repartir de Companion.
- **Aujourd'hui** : Elle est sur Google Play depuis le 8 juin 2026.
- liens : Google Play (`io.skyted.skytedvoice`) et l'article de lancement sur
  skyted.io

**Cohérence avec ta collègue.** Son site dit qu'elle a participé au
développement, et c'est ce que dit la fiche. « Seul » disparaît du rôle, mais la
conception, la version MAUI, le passage en Avalonia et la publication restent à
ton nom. « À deux » en ferait un projet porté à parts égales, ce que tu ne
décris pas. **Ton CV dit encore « conçue, développée et publiée seul »** : à
aligner, sinon c'est lui qui contredira son site.

### 5.3 ngx-statewise

Inchangé depuis la v2.

- tag : open source
- sujet : Une bibliothèque de gestion d'état pour Angular, construite sur les
  signals, qui demande moins de code d'infrastructure que NgRx.
- résumé : gestion d'état Angular
- statut : Sur npm · code public · rôle : Seul · stack : Angular · signals ·
  TypeScript · contexte : Personnel · période : depuis 2025
- chapô : Publiée sur npm, avec un site de documentation en français et en
  anglais.
- **Le besoin** : Avec NgRx ou NGXS, on écrit beaucoup de code d'infrastructure
  avant d'arriver à la première règle métier. ngx-statewise s'appuie sur les
  signals d'Angular pour en écrire moins.
- **Ce que j'ai fait** : La bibliothèque, sa documentation et son site, depuis
  avril 2025. Elle est couverte à 100 % par ses tests.
  - actions : ce qui s'est passé
  - interceptors : peuvent refuser une action avant qu'elle touche l'état
  - updaters : appliquent l'action à l'état, de façon synchrone
  - effects : le travail asynchrone, qui renvoie l'action suivante
  - managers : la seule chose à laquelle parlent les composants
- **Un choix technique** : L'état est écrit avant que les effets tournent. Un
  effet travaille donc toujours sur l'état à jour, et le comportement reste
  prévisible. En contrepartie, on ne lance pas d'effet sans passer par une
  action. La documentation dit aussi dans quels cas mieux vaut prendre autre
  chose.
  - figure : action → interceptor → updater → effect, boucle « nouvelles
    actions » ; légende : Le flux décrit dans la documentation.
- **Aujourd'hui** : La 0.6 est la version stable, la 1.0 est en bêta depuis
  septembre 2026. Ce portfolio l'utilise.
- liens : site de documentation (version française), dépôt GitHub

### 5.4 Template Clean Architecture .NET

Inchangé depuis la v2.

- tag : open source
- sujet : Un point de départ pour une API .NET 10 : Clean Architecture,
  PostgreSQL, authentification JWT complète, erreurs au format RFC 7807.
- résumé : socle d'API .NET 10
- statut : Code public sur GitHub · rôle : Seul · stack : .NET 10 · EF Core ·
  PostgreSQL · contexte : Personnel · période : depuis 2025
- chapô : De quoi démarrer une API .NET avec l'authentification, les couches
  et la CI déjà en place.
- **Le besoin** : Toute nouvelle API demande la même mise en place : les
  couches, la base, l'authentification, le format des erreurs, la CI. Ce dépôt
  la fournit déjà faite.
- **Ce que j'ai fait** : Le code, trois fonctionnalités d'exemple et une
  documentation par sujet. On peut le cloner tel quel, ou générer un projet à
  son nom avec `dotnet new`.
  - refus par défaut : un endpoint est protégé sauf s'il dit le contraire
  - RFC 7807 : la même forme d'erreur partout, avec un code stable
  - configuration vérifiée au démarrage : une erreur de réglage arrête l'API
    tout de suite
  - tests d'architecture : un projet mal placé fait échouer le build
- **Un choix technique** : EF Core ne mappe pas les entités du domaine mais des
  modèles de persistance, et un mapper fait la conversion. Ça coûte une classe
  de plus par entité. En échange, le domaine ne dépend pas de l'ORM, et un test
  échoue dès qu'une propriété se perd dans la conversion.
  - figure des couches : inchangée
- **Aujourd'hui** : Le dépôt est public et se lance avec Docker Compose.

### 5.5 Speakey

- tag : arrêté
- famille : En entreprise (au lieu de Personnels)
- sujet : Le site et l'API d'un outil de dictée vocale hébergé en Europe,
  chez Skyted.
- résumé : dictée vocale, web
- statut : Pas de lien public · rôle : Tout, sauf le moteur de reconnaissance
  · stack : Angular · .NET 10 · OVHcloud · contexte : Skyted · période : 2025 –
  2026
- chapô : Tout le logiciel autour du moteur de reconnaissance de la parole,
  jusqu'à la mise en production.
- **Le besoin** : Skyted voulait un outil de dictée vocale dont les données
  restent en Europe. Le moteur de reconnaissance devait venir ensuite.
- **Ce que j'ai fait** : Le front en Angular (signals, prérendu, i18n, design
  system en SCSS), l'API REST en .NET 10, et la mise en production sur un VPS
  OVHcloud en HTTPS, avec une CI/CD GitHub Actions.
- **Aujourd'hui** : Le projet s'est arrêté avant l'arrivée du moteur.

Aucun concurrent n'est nommé.

### 5.6 Application Skyted 320

- titre : Application Skyted 320 ; nom court : Skyted 320. Elle s'appelle
  Skyted 320 sur Google Play et Skyted App sur l'App Store. Le slug
  `skyted-app` ne bouge pas.
- tag : publiée
- sujet : L'application mobile du casque Skyted 320 : appairage, mises à jour,
  entraînement à parler bas et portée de la voix en temps réel.
- résumé : application du casque, iOS et Android
- statut : Sur Google Play et l'App Store · rôle : En binôme : correctifs,
  Bluetooth, back-end · stack : Kotlin · Swift · BLE · Firebase · contexte :
  Skyted · période : 2025 – 2026
- chapô : L'application qui accompagne le casque, pour l'appairer, le mettre à
  jour et apprendre à parler bas.
- **Le besoin** : Le Skyted 320 garde les appels confidentiels. L'application
  gère l'appareil (batterie, compte, mises à jour du firmware) et montre en
  temps réel jusqu'où la voix porte.
- **Ce que j'ai fait** : Des correctifs sur les versions iOS et Android, et la
  migration du back-end vers Firebase Functions v2.
- **Le Bluetooth, refait** (titre propre à la fiche) : Pour le firmware V24,
  j'ai refait le scan et l'appairage. L'application reconnaît le casque par
  ses données constructeur, puis par ses services GATT, et repère les mises à
  jour grâce à un checksum. La connexion est environ 20 % plus rapide.
- **Aujourd'hui** : Elle est sur Google Play et sur l'App Store.
- liens : Google Play, App Store

« En binôme » dans le rôle, parce que la recommandation de votre directeur, sur
le site de ta collègue, lui attribue une part importante de l'évolution de cette
application. Ta part (le Bluetooth V24, la migration Firebase) reste précise et
à ton nom. Aucun des deux sites ne revendique ce que l'autre a fait.

### 5.7 TrainWays (nouveau)

- slug : `trainways` · famille : En entreprise · tag : publiée
- sujet : Une application Android et iOS qui montre, avant un trajet en train, où le
  réseau passe et où il coupe.
- résumé : réseau en train, Android et iOS
- statut : Sur Google Play et l'App Store · rôle : En binôme : back-end, mise à jour, publication · stack :
  Kotlin · Swift · Firebase · contexte : Skyted · période : 2026
- chapô : Pour savoir à l'avance à quel moment du trajet on pourra passer un
  appel.
- **Le besoin** : On choisit son train, par son numéro ou par ses gares, et
  l'application affiche les horaires, les zones couvertes et les zones sans
  réseau du trajet.
- **Ce que j'ai fait** : J'ai refait le back-end, mis l'application à jour et
  repris les développements prévus, puis je l'ai republiée sur Google Play et
  l'App Store. L'année est dans le champ Période.
- liens : Google Play (`com.skyted.trainways`), App Store (`id6739769823`)

Deux parties seulement : c'est un plus petit projet, la fiche le reflète.

### 5.8 Bk-ONE

- tag : stage
- sujet : Un progiciel bancaire de la gamme BKLINK, pour les banques de la zone
  euro. J'ai participé à la refonte de son application Java.
- résumé : progiciel bancaire, Java
- statut : Vendu à des banques · code privé · rôle : Stagiaire, refonte du code
  · stack : Java · Swing · XML · contexte : Numerilis · période : 2024
- chapô : Une application Swing ancienne, sans framework, qui gère des flux de
  virements.
- **Le besoin** : Bk-ONE traite des flux d'opérations bancaires en réception
  et en émission, selon les règles européennes de paiement (conventions EPC,
  virements CREDEURO et ICP).
- **Ce que j'ai fait** : La refonte de l'interface : sortir les
  responsabilités dans des classes à part, supprimer le code dupliqué d'un
  écran à l'autre, mutualiser les composants. J'ai aussi centralisé et
  automatisé le traitement des flux XML, avec des contrôles d'intégrité sur des
  données bancaires personnelles.
- **Une proposition retenue** (titre propre) : Le code chargeait chaque fichier
  XML en entier dans une chaîne de caractères, puis allait lire et modifier
  chaque partie directement dans cette chaîne. J'ai proposé de passer par des
  objets : on lit le fichier une fois, puis on modifie des objets avec leurs
  méthodes. Rien de révolutionnaire sur le papier, mais il a fallu reprendre
  une bonne partie du code, et le traitement est devenu nettement plus
  robuste.
- liens : bklink.com (page Bk-ONE), numerilis.com. À vérifier dans ton
  navigateur : mon outil de lecture a été redirigé vers un autre domaine en
  ouvrant la page Bk-ONE.

« Rien de révolutionnaire sur le papier » : c'est ton « la révolution non ! »,
dit sur un ton qu'un recruteur peut lire. L'autodérision porte sur ton idée à
toi, jamais sur le code de Numerilis. C'est la seule touche d'humour du site, et
elle tombe au bon endroit : sur ta preuve la plus solide, celle qui a été
retenue par un tiers.

## 6. Questions ouvertes

Plus aucune sur le contenu. Il reste à faire, au moment de l'intégration :

- une version du CV Full Stack sans numéro de téléphone, en PDF, dans
  `public/` ;
- la ligne Skyted Voice de ton CV, à aligner sur la fiche.

## 7. Ce que la relecture a changé

Deux relecteurs indépendants, qui n'avaient ni mon raisonnement ni cette
conversation, ont relu la v1 : l'un le style, l'autre les faits.

**Retenu.** « Seul » répété jusqu'à trois fois par fiche, désormais dans le
champ Rôle uniquement. Des chapôs qui redisaient le sujet. « Cadre : Skyted »,
qui se lit « cadre chez Skyted ». Le slogan « Plus simple que NgRx, plus cadrée
que du fait maison ». La phrase sur le départ du référent technique, qui
contredisait la règle de ne rien dire de Skyted. Avalonia rangé au mauvais
niveau. « Huit mois entre deux contrats », qui se lit « chômage ». « Refonte de
Bk-ONE en Java », qui laisse croire à une réécriture vers Java. La
disponibilité, remontée sur l'accueil. Le lien vers le CV. Côté faits : des
motivations que je t'avais prêtées sans source (ngx-statewise, template), ta
femme datée de 2021 sans source, Speakey dit « en pause » alors qu'il est
arrêté, et deux listes du flux ngx-statewise qui ne coïncidaient pas.

**Écarté, avec la raison.** « Je m'intéresse à beaucoup de choses, et j'ai pris
le temps de choisir » à la place de ta phrase sur la curiosité : trop lisse. La
curiosité, force et faiblesse, ce sont tes mots ; j'ai seulement retiré « un peu
trop même ». La suppression de la ligne CDI / freelance : tu as dit y être
ouvert, elle reste en dernier.

## 8. Ce que tes réponses ont changé

Tes réponses disent plus sur toi que n'importe quelle question directe. Quatre
traits en ressortent, et j'ai relu tout le texte avec eux.

- **Tu es discret par loyauté.** Pas de redressement judiciaire, pas de
  concurrent nommé, pas de patron qui change les priorités. Le site suit la
  même règle : Companion est « en développement », Speakey « s'est arrêté »,
  sans explication. Et quand un projet s'est fait à deux, le rôle le dit
  (« En binôme »), pour ne rien prendre à ta collègue.
- **Tu construis pour que ça serve encore demain.** Voice passée en Avalonia
  pour partager le code, les objets à la place des chaînes dans Bk-ONE, un
  template pour ne plus refaire la même mise en place. Les chapitres « Un choix
  technique » racontent tous des décisions de ce genre, et le profil le dit une
  seule fois : ce qui t'intéresse, c'est la conception.
- **Tu te moques de toi avant les autres.** « La révolution non ! », « oui je
  te le jure c'est une app de banque ». Le site en garde une trace, une seule
  fois, sur Bk-ONE. Deux fois, ce serait un procédé.
- **Tu dis les choses simplement.** « Faut bien manger » est devenu « un
  métier qui nourrit mal son homme » : la même idée, à ta façon, qu'un RH peut
  lire. Pour le reste, aucune émotion inventée et aucun « passionné ».

Ce que j'ai retiré parce que ce n'est pas toi : ta femme, qui relève de ta vie
privée ; le concurrent de Speakey ; toute formule qui te ferait paraître plus
seul ou plus central que tu ne l'as été.
