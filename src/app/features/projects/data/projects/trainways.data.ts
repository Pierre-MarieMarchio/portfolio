import { draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

export const TRAINWAYS: ProjectEntry = {
  project: {
    slug: 'trainways',
    title: 'TrainWays',
    short: 'TrainWays',
    tag: { fr: 'publiée', en: draft('published') },
    family: 'professional',
    subject: {
      fr: 'Une application Android qui montre, avant un trajet en train, où le réseau passe et où il coupe.',
      en: draft(
        'An Android app that shows, before a train journey, where the network works and where it drops.',
      ),
    },
    summary: {
      fr: 'réseau en train, Android',
      en: draft('network on trains, Android'),
    },
  },
  facts: {
    proof: { fr: 'Sur Google Play', en: draft('On Google Play') },
    role: {
      fr: 'En binôme : back-end, mise à jour, publication',
      en: draft('In a pair: back end, update, release'),
    },
    stack: 'Kotlin · Android',
    context: 'Skyted',
    period: '2026',
  },
  detail: {
    lede: {
      fr: 'Pour savoir à l’avance à quel moment du trajet on pourra passer un appel.',
      en: draft(
        'To know ahead of time when during the journey you can make a call.',
      ),
    },
    links: [
      {
        label: 'Google Play',
        href: 'https://play.google.com/store/apps/details?id=com.skyted.trainways',
      },
    ],
    chapters: [
      {
        paragraphs: [
          {
            fr: 'On choisit son train, par son numéro ou par ses gares, et l’application affiche les horaires, les zones couvertes et les zones sans réseau du trajet.',
            en: draft(
              'You pick your train, by number or by stations, and the app shows the times, the covered stretches and the dead zones of the journey.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'J’ai refait le back-end, mis l’application à jour et repris les développements prévus, puis je l’ai republiée sur Google Play en 2026.',
            en: draft(
              'I rebuilt the back end, updated the app and took up the planned work, then released it again on Google Play in 2026.',
            ),
          },
        ],
      },
    ],
  },
};
