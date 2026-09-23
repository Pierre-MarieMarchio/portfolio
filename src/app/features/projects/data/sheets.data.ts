import { ProjectSheet } from '../models';

/** The sheets' prose, copied from the export text for text. */
export const SHEETS: Readonly<Record<string, ProjectSheet>> = {
  'skyted-voice': {
    title: 'Skyted Voice',
    lede: 'Une application d’amplification vocale pour celles et ceux à qui l’on demande sans cesse de répéter.',
    links: [
      {
        label: 'skyted.io',
        href: 'https://www.skyted.io/',
      },
    ],
    chapters: [
      {
        paragraphs: [
          'Se faire comprendre ne devrait pas demander une énergie que l’on n’a pas à dépenser. Pour une personne dont la voix porte peu, chaque échange ordinaire — commander un café, parler au guichet d’une pharmacie, tenir une conversation à table — devient un effort.',
          'L’application se connecte à un casque ou à des écouteurs Bluetooth déjà possédés, capte la voix en temps réel et la restitue amplifiée autour de soi. Rien à acheter pour commencer ; l’expérience est affinée avec le casque maison.',
        ],
      },
      {
        paragraphs: [
          'J’ai fait cette application de bout en bout, seul : la conception, le développement et la mise en production sur les deux magasins. Le traitement audio et le casque viennent d’ailleurs dans l’entreprise ; l’application, c’est moi.',
          'Elle est écrite en .NET MAUI : une seule base de code pour iOS et Android, ce qui m’a permis de tenir les deux plateformes seul.',
        ],
        bullets: [
          {
            term: 'captation',
            text: 'micro du casque Bluetooth, en temps réel',
          },
          {
            term: 'restitution',
            text: 'haut-parleur du téléphone, à destination de l’entourage',
          },
          {
            term: 'matériel',
            text: 'fonctionne avec l’existant, optimisé avec le casque maison',
          },
          {
            term: 'prix',
            text: 'gratuite sur les deux plateformes',
          },
        ],
      },
      {
        paragraphs: [
          'Une application audio en temps réel appelle le natif : c’est là que vivent la capture du micro, le routage vers le haut-parleur et la latence. J’ai pourtant choisi .NET MAUI, une seule base de code pour iOS et Android.',
          'Le compromis est net : la chaîne audio n’a pas pu rester en code partagé — chaque plateforme a son accès au micro du casque et à la sortie du téléphone. Tout le reste, interface, réglages, cycle de vie, s’écrit une fois. Seul sur les deux magasins, c’est ce partage qui m’a permis de livrer.',
        ],
      },
      {
        paragraphs: [
          // Flagged in the handoff (§8): a day with no year. Kept as written
          // until it is rewritten; never completed here.
          'Ce qui existe : une application publiée sur les deux magasins, téléchargeable par n’importe qui, sortie sur Android le 8 juin.',
          'Ce qui n’est pas démontré ici : nombre d’utilisateurs, retours d’usage, mesures d’intelligibilité. L’application ne change pas un diagnostic ; elle rend la conversation suivante plus facile.',
        ],
      },
    ],
  },
  'skyted-app': {
    title: 'Skyted App',
    lede: 'L’application compagnon du casque Skyted 320 : elle gère l’appareil, entraîne à parler bas, et affiche jusqu’où la voix porte réellement.',
    links: [
      {
        label: 'skyted.io',
        href: 'https://www.skyted.io/',
      },
    ],
    chapters: [
      {
        paragraphs: [
          'Un casque qui promet des appels discrets ne suffit pas : encore faut-il que la personne sache à quel volume parler. Sans retour, on surestime ou on sous-estime sa propre voix, et la promesse de confidentialité ne tient plus.',
          'L’application analyse simultanément la voix et le bruit ambiant, puis affiche deux distances : celle à partir de laquelle une personne proche pourrait comprendre, et celle à partir de laquelle la voix pourrait devenir gênante.',
        ],
      },
      {
        paragraphs: [
          'J’ai repris l’application après le départ du développeur précédent. Prendre en main une base que je n’avais pas écrite, la faire tenir, puis y ajouter des fonctionnalités et livrer plusieurs versions en production.',
          'Elle est développée en natif : Swift côté iOS, Kotlin côté Android.',
        ],
        bullets: [
          {
            term: 'appairage',
            text: 'enregistrement de l’appareil et mises à jour du micrologiciel',
          },
          {
            term: 'état',
            text: 'niveau de batterie, compte utilisateur',
          },
          {
            term: 'mesure',
            text: 'distances d’intelligibilité et de gêne, en temps réel',
          },
          {
            term: 'apprentissage',
            text: 'entraînement à la voix basse, retour audio dans le casque',
          },
        ],
      },
      {
        paragraphs: [
          'L’application existait déjà, en Swift d’un côté et en Kotlin de l’autre. La tentation, en reprenant une base qu’on n’a pas écrite, est de la réécrire dans une technologie unique.',
          'Je ne l’ai pas fait. La liaison au matériel — appairage, micrologiciel, flux audio — passe par les API Bluetooth de chaque système ; une couche partagée les aurait recouvertes d’une abstraction de plus, sur un produit déjà en vente. Le coût assumé : tout s’écrit deux fois, et chaque livraison se fait deux fois.',
        ],
      },
      {
        paragraphs: [
          'Ce qui existe : une application publiée sur les deux magasins, liée à un produit matériel commercialisé, et des livraisons successives que j’ai assurées.',
          'Ce qui n’est pas démontré ici : la précision réelle des distances affichées, l’adoption, et la part du traitement qui relève du casque plutôt que de l’application.',
        ],
      },
    ],
  },
  'ngx-statewise': {
    title: 'ngx-statewise',
    lede: 'Une alternative plus légère à NgRx et NGXS pour la gestion d’état Angular, appuyée sur les signals natifs plutôt que sur un store central.',
    links: [
      {
        label: 'github.com/Pierre-MarieMarchio/ngx-statewise',
        href: 'https://github.com/Pierre-MarieMarchio/ngx-statewise',
      },
    ],
    chapters: [
      {
        paragraphs: [
          'Les solutions établies de gestion d’état Angular sont construites autour d’un store central, d’actions distribuées et d’observables. Elles fonctionnent, mais demandent une quantité de code d’infrastructure importante avant d’écrire la moindre règle métier.',
          'J’ai voulu une approche qui s’appuie sur les signals introduits par Angular, où la réactivité de l’interface est automatique, et où l’on écrit surtout la logique.',
        ],
      },
      {
        paragraphs: [
          'Projet personnel. J’en ai défini le modèle, écrit la bibliothèque et la documentation, et je le maintiens seul. Il est publié en open source pour être relu et utilisé.',
        ],
        bullets: [
          {
            term: 'states',
            text: 'l’état, exposé en signals',
          },
          {
            term: 'actions',
            text: 'événements typés, seuls ou groupés par source',
          },
          {
            term: 'updators',
            text: 'modifient l’état, et rien d’autre',
          },
          {
            term: 'effects',
            text: 'appels réseau, navigation, et nouvelles actions',
          },
          {
            term: 'managers',
            text: 'la façade entre les composants et cette mécanique',
          },
        ],
      },
      {
        paragraphs: [
          'La bibliothèque impose un ordre : une action est d’abord distribuée, l’updator met l’état à jour, et seulement ensuite l’effet s’exécute. Tout effet travaille donc sur l’état le plus récent, ce qui rend le comportement prévisible et le débogage plus simple.',
          'Le compromis est réel et documenté dans le dépôt : impossible de déclencher un effet sans passer par une action, et les dérivations d’état très complexes demandent d’étendre les capacités de base. Pour qui vient d’un modèle Redux, cela demande un changement d’habitude.',
        ],
        figure: 'flow',
      },
      {
        paragraphs: [
          'Ce qui existe : une bibliothèque publiée, documentée concept par concept, avec ses exemples de code et une section qui expose elle-même ses limites.',
          'Ce qui n’est pas démontré : aucun usage en production mesuré, aucune adoption chiffrée, aucune comparaison de performance avec NgRx ou NGXS.',
        ],
      },
    ],
  },
  'template-dotnet': {
    title: 'Template Clean Architecture .NET',
    lede: 'Un dépôt de départ pour une API HTTP .NET 10, pour ne pas réécrire chaque fois l’authentification, le découpage en couches et la chaîne de vérification.',
    links: [
      {
        label:
          'github.com/Pierre-MarieMarchio/Template-DotNet_Clean_Architecture',
        href: 'https://github.com/Pierre-MarieMarchio/Template-DotNet_Clean_Architecture',
      },
    ],
    chapters: [
      {
        paragraphs: [
          'Démarrer une API sérieuse demande à chaque fois les mêmes semaines de mise en place : couches, persistance, authentification, format d’erreurs, intégration continue. Ce travail est refait projet après projet, rarement de la même manière.',
          'Le dépôt est ma réponse : un point de départ déjà gréé, que l’on peut cloner ou dont on peut générer un projet nommé à son tour.',
        ],
      },
      {
        paragraphs: [
          'Projet personnel. J’ai défini le découpage, écrit le code, les trois fonctionnalités d’exemple et la documentation, et je le maintiens seul.',
        ],
        bullets: [
          {
            term: 'refus par défaut',
            text: 'un endpoint est protégé tant qu’il ne demande pas explicitement le contraire',
          },
          {
            term: 'RFC 7807',
            text: 'la même forme d’erreur partout, avec un code stable et un traceId',
          },
          {
            term: 'options validées',
            text: 'une configuration fautive arrête l’hôte au démarrage',
          },
          {
            term: 'tests d’architecture',
            text: 'un projet ajouté hors des règles fait échouer la construction',
          },
        ],
      },
      {
        paragraphs: [
          'EF Core ne mappe pas les entités du domaine : il mappe des modèles de persistance, et un convertisseur fait le passage. Cela coûte un objet et un mapper par entité — le compromis est assumé — mais le domaine ne subit plus les contraintes de l’ORM.',
          'Pour que ce coût ne devienne pas une source de bogues silencieux, un test piloté par réflexion échoue dès qu’une propriété ne survit pas à l’aller-retour. La règle n’est pas tenue par la relecture, elle est tenue par la chaîne de vérification.',
        ],
        figure: 'layers',
      },
      {
        paragraphs: [
          'Ce qui existe : un dépôt public qui se lance en une commande Docker, une documentation par sujet et une chaîne de vérification exécutable depuis un simple clone.',
          'Ce qui n’est pas démontré : aucune mesure de charge, aucun déploiement en production à montrer. Son document de sécurité consacre plus de place à ce qu’un déploiement doit encore faire qu’à ce que le socle fournit.',
        ],
      },
    ],
  },
  bkone: {
    title: 'Bk-ONE',
    lede: 'Un progiciel bancaire de la gamme BKLINK : il ouvre la compensation européenne aux banques sous-compensées.',
    links: [
      {
        label: 'bklink.com — présentation du produit',
        href: 'https://www.bklink.com/produits/bklink/bk-one/',
      },
      {
        label: 'numerilis.com',
        href: 'https://www.numerilis.com/',
      },
    ],
    chapters: [
      {
        paragraphs: [
          'Une banque sous-compensée ne présente pas directement ses opérations à la compensation : elle passe par un établissement tiers. Bk-ONE lui ouvre la compensation européenne en gérant elle-même ses flux, dans les formats et selon les règles imposés par le secteur.',
          'C’est un domaine où l’exactitude prime sur tout le reste : un virement mal formé n’est pas un défaut d’affichage, c’est une opération rejetée.',
        ],
        bullets: [
          {
            term: 'flux STP',
            text: 'réception et émission d’opérations de bout en bout',
          },
          {
            term: 'conventions EPC',
            text: 'application des règles européennes de paiement',
          },
          {
            term: 'virements',
            text: 'types CREDEURO et ICP',
          },
          {
            term: 'administration',
            text: 'interface complète et interfaçage avec des applications externes',
          },
        ],
      },
      {
        paragraphs: [
          'J’y étais stagiaire, sur la refonte du code back. Mon travail ne s’est pas limité à exécuter : j’ai proposé des éléments de solution pour l’architecture, et une partie a été retenue.',
          'C’est là que j’ai pris goût au découpage en couches et aux règles qu’une base de code se donne à elle-même — ce que je reprends aujourd’hui dans mon socle .NET personnel.',
        ],
      },
      {
        paragraphs: [
          'Un message d’opération mal formé n’est pas un défaut d’affichage : c’est une opération rejetée. La question posée pendant la refonte était de savoir où cette forme devait être vérifiée.',
          'L’élément que j’ai proposé, et qui a été retenu en partie, tient la vérification à la frontière plutôt que dans les traitements : un message est validé une fois, à l’entrée, et le métier travaille ensuite sur des données dont la forme est acquise. Le coût est un modèle de plus à maintenir à côté du format bancaire.',
        ],
      },
      {
        paragraphs: [
          'Ce qui existe : un produit commercialisé, documenté publiquement par son éditeur.',
          'Ce qui n’est pas démontrable ici : le code est privé, et le détail des traitements bancaires ne peut pas être exposé. La preuve, dans ce cas, sera un récit précis plutôt qu’un dépôt.',
        ],
      },
    ],
  },
  'skyted-companion': {
    title: 'Skyted Companion',
    lede: 'L’application compagnon utilisée en interne autour du casque : elle sert à préparer l’appareil, le mettre à jour et vérifier son état.',
    links: [],
    chapters: [
      {
        paragraphs: [
          'Un casque connecté ne se suffit pas à lui-même : il faut pouvoir l’appairer, le mettre à jour, vérifier son état et reproduire un problème signalé. Ce travail n’a pas sa place dans l’application grand public, qui doit rester simple.',
          'C’est le rôle de cette application compagnon : donner accès à l’appareil de près, pour les personnes qui travaillent avec lui.',
        ],
      },
      {
        paragraphs: [
          'J’ai développé des fonctionnalités de cette application au sein de l’équipe mobile, sur les deux plateformes, et suivi la liaison Bluetooth avec l’appareil.',
          'Elle partage son terrain avec l’application publique — mêmes protocoles, même matériel — mais son public est interne, avec des libertés qu’un magasin n’autoriserait pas.',
        ],
      },
      {
        paragraphs: [
          'La question était de savoir jusqu’où exposer l’appareil. Tout montrer rend l’outil puissant et illisible ; ne rien montrer le rend inutile.',
          'J’ai gardé une interface aussi proche que possible de celle de l’application publique, et laissé le reste à l’outillage. Le compromis : certaines opérations demandent encore de passer par un outil séparé.',
        ],
      },
      {
        paragraphs: [
          'Ce qui existe : une application en service en interne, liée au même matériel que l’application publiée.',
          'Ce qui ne peut pas être montré ici : elle n’est pas téléchargeable, et son contenu appartient à l’entreprise. La preuve, dans ce cas, est un récit précis plutôt qu’un lien.',
        ],
      },
    ],
  },
  speakey: {
    title: 'Speakey',
    lede: 'Un prototype personnel, resté prototype : écrit pour apprendre, pas pour être mis en service.',
    links: [],
    chapters: [
      {
        paragraphs: [
          'J’apprends en écrivant quelque chose qui fonctionne. Avant de savoir si une idée tient, je la construis assez loin pour en mesurer le coût : c’est ce qu’a été ce prototype, mené seul, en dehors de tout cadre professionnel.',
          'Il n’a pas été déployé, et je ne le présente pas pour autre chose que ce qu’il m’a appris.',
        ],
      },
      {
        title: 'Qu’est-ce qui tient ?',
        paragraphs: [
          'Ce qui existe : un prototype, sans mise en production ni utilisateurs.',
          // Flagged in the handoff (§8): said twice, here and in "Méthode".
          // Kept as written until it is rewritten or cut.
          'Ce qu’il m’a laissé : l’habitude de tenir un projet de bout en bout — la seule manière que je connaisse d’en voir le coût réel, et celle que je reprends aujourd’hui dans les projets que je publie.',
        ],
      },
    ],
  },
};
