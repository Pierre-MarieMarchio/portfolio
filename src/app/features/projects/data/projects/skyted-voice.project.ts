import { ProjectEntry } from '../../models';

/** Skyted Voice: identity, facts and sheet, in one place. */
export const SKYTED_VOICE: ProjectEntry = {
  project: {
    slug: 'skyted-voice',
    title: 'Skyted Voice',
    short: 'Skyted Voice',
    tag: 'publié',
    family: 'professional',
    subject:
      'Application mobile d’amplification vocale : elle se connecte à un casque Bluetooth, capte la voix en temps réel et l’élève à un niveau que l’entourage peut suivre.',
    summary: 'amplification vocale, iOS et Android',
  },
  facts: {
    proof: 'Publiée · deux magasins',
    proofLevel: 'public',
    role: 'Seul, jusqu’à la production',
    stack: '.NET MAUI · audio temps réel',
    context: 'Skyted',
  },
  sheet: {
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
};
