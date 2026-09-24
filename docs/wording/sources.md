# Sources des faits du wording

Tout fait écrit dans `fr.md` doit se retrouver ici. Ce qui n'y est pas est marqué
`[à confirmer]` dans `fr.md`, jamais deviné.

## Pierre-Marie (réponses du 23/09/2026 et CV de septembre 2026)

- Archéologue sur des chantiers de fouilles programmés, 2016 – 2021. Licence
  d'archéologie, université Toulouse-Jean Jaurès, 2020.
- Quitte l'archéologie pour des raisons financières (« métier passion, mais faut
  bien manger »).
- Très curieux, aime apprendre ; « une force et une faiblesse » : peur de
  s'ennuyer, difficulté à choisir.
- PC depuis l'enfance, beaucoup de jeu, aime bidouiller. Premier code : mods
  pour Skyrim, Crusader Kings 2 et 3, RimWorld. Sa femme, développeuse, lui a
  proposé d'essayer.
- « Je ne suis pas moi parce que j'étais archéo, j'ai été archéo parce que je
  suis moi » : l'archéologie ne doit pas être le centre.
- Reconversion en autoformation 2021 – 2023. Apple Foundation Program
  (+ Extended), Simplon, 2023. Titre DWWM, AFPA, RNCP 5, 2024, félicitations du
  jury.
- Stage Numerilis SAS, Paris, 09/2024 – 12/2024 : refonte de Bk-ONE, Java Swing,
  Java pur sans framework. Extraction des responsabilités en classes,
  suppression des duplications entre écrans, mutualisation des composants
  d'interface, centralisation et automatisation des flux XML, contrôles
  d'intégrité sur des données bancaires à caractère personnel. Une de ses
  propositions a été retenue dans le progiciel (lettre de motivation).
- Projets personnels à temps plein entre deux contrats, 01/2025 – 09/2025 :
  ngx-statewise, template .NET.
- Alternance Skyted, Toulouse, depuis 10/2025. Titre CDA, Simplon, RNCP 6,
  bac+3, 10/2025 – 04/2027. Rythme 3 semaines entreprise / 1 semaine formation.
  Scrum avec les équipes acoustique et firmware. Départ du référent technique en
  cours de contrat, équipe réduite à deux alternants, livraisons maintenues.
- Fait du front, du back, du mobile, du desktop Windows/Linux/macOS. Ne veut
  pas passer pour « moyen en tout ».
- Cherche : une alternance de reprise, ou une alternance pour un bac+5 après le
  titre, objectif architecte logiciel. Ouvert à un CDI ou à des missions
  freelance. Disponible immédiatement, Toulouse, télétravail accepté.
- Français et anglais bilingue, anglais langue maternelle.
- Passion : l'espace (le design du site en vient).
- CV, ligne « Notions » : MySQL, MongoDB, React, Node.js, Swift, Java.
- Lettre de motivation (phrases validées par lui) : « La conception est la
  partie du métier qui m'intéresse le plus, et c'est aussi celle où j'ai le
  plus à apprendre » ; « Ce que je cherche maintenant, c'est une équipe où
  quelqu'un relit mon code. J'ai beaucoup appris en travaillant seul, mais j'ai
  fait le tour de ce que ça m'apporte. » ; Bk-ONE : « une de mes propositions a
  été retenue dans le progiciel », « un produit qui part chez des clients ».
- **Ne pas publier** : la situation financière de Skyted (redressement,
  liquidation, salaires). Règle déjà fixée pour CV et LinkedIn.

## Projets

- **Skyted Companion** : application desktop du prochain casque, conçue et
  développée seul. .NET Avalonia, C#, Windows, macOS, Linux. Clean
  Architecture, MVVM limité à la présentation, modèle de domaine, design
  system, installeurs par plateforme, EF Core. Bluetooth Classic et BLE portés
  sur les trois systèmes derrière une interface unique résolue par injection de
  dépendances. « Le passage de Skyted App sur PC, Linux et Mac. »
- **Socle .NET commun Skyted** : monorepo .NET 10, Domain / Application /
  Infrastructure / Presentation, Clean Architecture, DDD, CQRS sans MediatR,
  xUnit, NSubstitute, Shouldly, CI GitHub Actions sur les trois systèmes.
  Pipeline audio temps réel partagé avec Voice.
- **Skyted Voice** : conçue, développée et publiée seul sur Google Play. .NET
  Avalonia Android, C#. Aide vocale pour personnes dysphoniques : capture au
  micro du casque, restitution en flux continu (AudioRecord, AudioTrack).
  « Refaite en Avalonia » (une version MAUI a donc existé). Blog Skyted du
  17/06/2026 : sortie Android le 8 juin 2026, gratuite, Android seulement,
  pour les voix qui portent mal (dysphonie, atteinte neurologique, laryngite,
  fatigue vocale), sortie par le haut-parleur du téléphone ou une enceinte
  Bluetooth, marche avec tout casque Bluetooth, optimisée pour le Skyted 320.
  Play : `io.skyted.skytedvoice`.
- **Skyted 320** (Android, Google Play `io.skyted.app320.android`) / **Skyted
  App** (iOS, App Store id6753917589) : application du casque. App Store :
  enregistrement pour les mises à jour firmware, batterie, compte, SoundBubble,
  rayon de confidentialité lors des appels, entraînement avec retour audio ;
  skyted.io : « It keeps your voice private, anywhere » ; v1.0 le
  20/10/2025, v3.5 en mai (firmware v24), v4.0 en août. CV : version Android
  en Kotlin Multiplatform, correctifs livrés, refonte du scan et de
  l'appairage BLE pour le firmware V24 (identification par manufacturer data
  puis services GATT, mises à jour détectées par checksum, connexion ~20 %
  plus rapide), back-end migré vers Firebase Functions v2.
- **TrainWays** : application de Skyted, Android en Kotlin et iOS en Swift,
  back-end Firebase, remise en production et republiée sur Google Play et
  l'App Store en 2026 (CV mobile).
- **Speakey** : projet Skyted. Application web de dictée (ASR), hébergement
  européen, pensée comme concurrent souverain de Wispr Flow. Front Angular
  prérendu (signals, SSR, lazy loading, design system SCSS, i18n) et API REST
  .NET 10, tout sauf le moteur ASR. En production sur VPS OVHcloud en HTTPS,
  CI/CD GitHub Actions. Aujourd'hui : seul le site tourne, sans nom de
  domaine, en IPv4. Faute de moyens, le projet ne se fera pas.
- **ngx-statewise** : npm, 0.6.4 stable, 1.0.0-beta.0 publiée le 10/09/2026
  (branche `next`). Créé le 15/04/2025. Site de doc FR/EN :
  pierre-mariemarchio.github.io/ngx-statewise. Flux action → interceptor →
  updater → effect → nouvelles actions ; l'état est écrit avant que les effets
  tournent ; `dispatchAsync` attend toute la cascade. 4,8 kB min+gzip.
  Couverture 100 %. La doc liste trois cas où ne pas l'utiliser. Ce portfolio
  l'utilise. ~275 téléchargements npm sur le dernier mois. README `next` : « An
  action says what happened. An updater applies it to state, synchronously. An
  effect does the asynchronous work. » ; manager : « the only thing your
  components talk to ». README `main` : NgRx et NGXS « require developers to
  work with higher levels of boilerplate code », ngx-statewise permet de « focus
  on business logic rather than infrastructure ». npm : « Simpler than NgRx,
  more structured than DIY. »
- **Template .NET** : README du dépôt. .NET 10, Clean Architecture,
  PostgreSQL/EF Core, Identity + JWT, refresh tokens rotatifs, refus par
  défaut, RFC 7807, options validées au démarrage, trois fonctionnalités
  d'exemple, `dotnet new`, lancement Docker Compose (section « Five minutes »),
  EF Core mappe des modèles de persistance avec test de fidélité par réflexion,
  tests d'architecture.
- **Bk-ONE** : bklink.com (lu le 23/09/2026) : « dernier né de la gamme
  BKLINK, progiciel bancaire destiné aux banques de la zone Euro », flux STP en
  réception et émission, conventions EPC, virements CREDEURO et ICP, interface
  d'administration, interfaçage avec des applications externes.

## Réponses du 23/09/2026 (deuxième série)

- **Companion** : officiellement toujours en développement. La connexion
  Bluetooth Classic et BLE est totalement stable sous Windows. L'étape suivante
  était l'intégration du SoundBubble (arrêtée par un changement de priorités :
  ne pas l'écrire).
- **Voice, MAUI → Avalonia** : pour partager le code et éviter des frameworks
  différents partout ; à terme, la refonte de l'application mobile (iOS et
  Android) devait réutiliser Companion.
- **Skyted 320** : il a travaillé sur iOS et Android.
- **Speakey** : ne pas nommer Wispr Flow, par respect ou obligation, comme pour
  la situation de Skyted.
- **Bk-ONE, la proposition retenue** : le XML était lu en entier dans une
  chaîne de caractères, et chaque partie était lue et modifiée dans cette
  chaîne. Il a proposé des objets : lire une fois, puis modifier des objets par
  des méthodes. Il a fallu revoir pas mal de code, mais le code est devenu
  beaucoup plus robuste. (Son ton : « la révolution non ! ».)
- **TrainWays** : à ajouter ; mis en production avec sa collègue.
- **Sa femme** : ne pas la mentionner, c'est personnel.
- **CV à publier** : le Full Stack .NET / Angular.
- **Périodes** des projets Skyted : le long de l'alternance (depuis 10/2025).

## TrainWays (Google Play lu le 23/09/2026, App Store lu le 24/09/2026)

« Anticipez la couverture réseau de votre trajet en train. » Carte de
connectivité des trains ; choix du train par numéro ou par gares de départ et
d'arrivée ; heures de départ et d'arrivée, zones de connexion et d'absence de
réseau, créneaux pour les appels. Mise à jour du 28 juillet 2026. App Store :
« Trainways », éditeur Skyted, iPhone, version 3.0 du 27 juillet,
id6739769823.

## Cohérence avec le portfolio de sa collègue (fatouniasse.com, lu le 23/09/2026)

Ne pas contredire, ne pas reprendre son style :

- Alternante chez Skyted depuis novembre 2025, d'abord mobile Android/iOS.
- « Développement de Skyted Voice (C#/.NET) » / en anglais « Built Skyted
  Voice ». **Conflit possible** avec « Voice conçue, développée et publiée
  seul ».
- « Contribution à Skyted-Apps, monorepo .NET/MAUI » : le monorepo n'est pas
  présenté comme l'œuvre d'une seule personne.
- Recommandation du directeur : après le départ de son tuteur technique, elle a
  pris en charge une part importante de l'évolution de l'application Skyted
  (analyse, développement, tests, correctifs, mises en production).
- Ne mentionne ni TrainWays, ni Speakey, ni Companion.

## Réponses du 23/09/2026 (troisième série)

- **Voice** : la première version était en MAUI (la sienne). Sa collègue y a
  participé ; il lui a proposé de l'indiquer sur son CV. Il envisage de
  présenter le projet comme fait « à deux ».
- **TrainWays** : il a refait le back-end, mis l'application à jour et continué
  les développements prévus sur les applications.
- **CV en ligne** : une version sans numéro de téléphone.
- **Chiffres** : aucun chiffre de téléchargement. « C'est très IA de vouloir
  tout appuyer par des chiffres. »

## Réponses du 24/09/2026

- **TrainWays** : le back-end est sur Firebase ; l'application est aussi sur
  l'App Store.
- **Mods** : avant et pendant les années d'archéologie.
- **Profil** : ajouter la curiosité au travail. L'espace, ajouté puis retiré :
  « ça sert à rien ». L'anglais langue
  maternelle n'est pas expliqué, « Bilingue » suffit.
- **Accueil** : ni ville ni « alternance » sous le titre, rien qui fasse
  LinkedIn (« disponible », « ouvert », « à l'écoute de nouvelles
  opportunités »). Retenu : « Je cherche le prochain projet à construire. »
- **Référencement** : les descriptions Google gardent Toulouse et
  l'alternance.
- **Compétences** : Mobile plus court. Architecture et outillage jugés « un peu
  too much » : Git sort, l'outillage devient « Mise en production » ;
  l'architecture reste, avec sa raison dans `fr.md`.
