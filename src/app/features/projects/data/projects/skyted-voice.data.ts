import { draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

/** Skyted Voice: identity, facts and detail, in one place. */
export const SKYTED_VOICE: ProjectEntry = {
  project: {
    slug: 'skyted-voice',
    title: 'Skyted Voice',
    short: 'Skyted Voice',
    tag: { fr: 'publié', en: draft('published') },
    family: 'professional',
    subject: {
      fr: 'Application mobile d’amplification vocale : elle se connecte à un casque Bluetooth, capte la voix en temps réel et l’élève à un niveau que l’entourage peut suivre.',
      en: draft(
        'A mobile voice amplification application: it connects to a Bluetooth headset, captures the voice in real time and raises it to a level the people around can follow.',
      ),
    },
    summary: {
      fr: 'amplification vocale, iOS et Android',
      en: draft('voice amplification, iOS and Android'),
    },
  },
  facts: {
    proof: {
      fr: 'Publiée · deux magasins',
      en: draft('Published · both stores'),
    },
    proofLevel: 'public',
    role: {
      fr: 'Seul, jusqu’à la production',
      en: draft('Alone, through to production'),
    },
    stack: {
      fr: '.NET MAUI · audio temps réel',
      en: draft('.NET MAUI · real-time audio'),
    },
    context: 'Skyted',
  },
  detail: {
    lede: {
      fr: 'Une application d’amplification vocale pour celles et ceux à qui l’on demande sans cesse de répéter.',
      en: draft(
        'A voice amplification application for those who are forever asked to repeat themselves.',
      ),
    },
    links: [
      {
        label: 'skyted.io',
        href: 'https://www.skyted.io/',
      },
    ],
    chapters: [
      {
        paragraphs: [
          {
            fr: 'Se faire comprendre ne devrait pas demander une énergie que l’on n’a pas à dépenser. Pour une personne dont la voix porte peu, chaque échange ordinaire — commander un café, parler au guichet d’une pharmacie, tenir une conversation à table — devient un effort.',
            en: draft(
              'Being understood should not take an energy one does not have to spend. For someone whose voice carries little, every ordinary exchange — ordering a coffee, speaking at a pharmacy counter, holding a conversation at table — becomes an effort.',
            ),
          },
          {
            fr: 'L’application se connecte à un casque ou à des écouteurs Bluetooth déjà possédés, capte la voix en temps réel et la restitue amplifiée autour de soi. Rien à acheter pour commencer ; l’expérience est affinée avec le casque maison.',
            en: draft(
              'The application connects to a Bluetooth headset or earphones one already owns, captures the voice in real time and plays it back amplified around. Nothing to buy to start with; the experience is refined with the company’s own headset.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'J’ai fait cette application de bout en bout, seul : la conception, le développement et la mise en production sur les deux magasins. Le traitement audio et le casque viennent d’ailleurs dans l’entreprise ; l’application, c’est moi.',
            en: draft(
              'I built this application end to end, alone: the design, the development and the release to production on both stores. The audio processing and the headset come from elsewhere in the company; the application is mine.',
            ),
          },
          {
            fr: 'Elle est écrite en .NET MAUI : une seule base de code pour iOS et Android, ce qui m’a permis de tenir les deux plateformes seul.',
            en: draft(
              'It is written in .NET MAUI: a single code base for iOS and Android, which let me hold both platforms alone.',
            ),
          },
        ],
        bullets: [
          {
            term: { fr: 'captation', en: draft('capture') },
            text: {
              fr: 'micro du casque Bluetooth, en temps réel',
              en: draft('the Bluetooth headset’s microphone, in real time'),
            },
          },
          {
            term: { fr: 'restitution', en: draft('playback') },
            text: {
              fr: 'haut-parleur du téléphone, à destination de l’entourage',
              en: draft('the phone’s speaker, for the people around'),
            },
          },
          {
            term: { fr: 'matériel', en: draft('hardware') },
            text: {
              fr: 'fonctionne avec l’existant, optimisé avec le casque maison',
              en: draft(
                'works with what one has, optimised with the company’s headset',
              ),
            },
          },
          {
            term: { fr: 'prix', en: draft('price') },
            text: {
              fr: 'gratuite sur les deux plateformes',
              en: draft('free on both platforms'),
            },
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'Une application audio en temps réel appelle le natif : c’est là que vivent la capture du micro, le routage vers le haut-parleur et la latence. J’ai pourtant choisi .NET MAUI, une seule base de code pour iOS et Android.',
            en: draft(
              'A real-time audio application calls for native code: that is where microphone capture, routing to the speaker and latency live. I nevertheless chose .NET MAUI, a single code base for iOS and Android.',
            ),
          },
          {
            fr: 'Le compromis est net : la chaîne audio n’a pas pu rester en code partagé — chaque plateforme a son accès au micro du casque et à la sortie du téléphone. Tout le reste, interface, réglages, cycle de vie, s’écrit une fois. Seul sur les deux magasins, c’est ce partage qui m’a permis de livrer.',
            en: draft(
              'The trade-off is clear: the audio chain could not stay in shared code — each platform has its own access to the headset’s microphone and to the phone’s output. Everything else, interface, settings, life cycle, is written once. Alone on both stores, that sharing is what let me ship.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          // Flagged in the handoff (§8): a day with no year. Kept as written
          // until it is rewritten; never completed here.
          {
            fr: 'Ce qui existe : une application publiée sur les deux magasins, téléchargeable par n’importe qui, sortie sur Android le 8 juin.',
            en: draft(
              'What exists: an application published on both stores, downloadable by anyone, released on Android on 8 June.',
            ),
          },
          {
            fr: 'Ce qui n’est pas démontré ici : nombre d’utilisateurs, retours d’usage, mesures d’intelligibilité. L’application ne change pas un diagnostic ; elle rend la conversation suivante plus facile.',
            en: draft(
              'What is not shown here: number of users, feedback from use, intelligibility measurements. The application does not change a diagnosis; it makes the next conversation easier.',
            ),
          },
        ],
      },
    ],
  },
};
