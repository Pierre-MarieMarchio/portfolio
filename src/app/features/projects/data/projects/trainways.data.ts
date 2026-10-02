import { bilingual, draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

export const TRAINWAYS: ProjectEntry = {
  project: {
    slug: 'trainways',
    title: 'TrainWays',
    short: 'TrainWays',
    family: 'professional',
    subject: bilingual(
      'Une application Android et iOS qui montre, avant un trajet en train, où le réseau passe et où il coupe.',
      draft(
        'An Android and iOS app that shows, before a train journey, where the network works and where it drops.',
      ),
    ),
    summary: bilingual(
      'réseau en train, Android et iOS',
      draft('network on trains, Android and iOS'),
    ),
  },
  facts: {
    proof: bilingual(
      'Sur Google Play et l’App Store',
      draft('On Google Play and the App Store'),
    ),
    role: bilingual(
      'En binôme : back-end, mise à jour, publication',
      draft('In a pair: back end, update, release'),
    ),
    stack: 'Kotlin · Swift · Firebase',
    context: 'Skyted',
    period: '2026',
  },
  detail: {
    lede: bilingual(
      'Pour savoir à l’avance à quel moment du trajet on pourra passer un appel.',
      draft(
        'To know ahead of time when during the journey you can make a call.',
      ),
    ),
    links: [
      {
        label: 'Google Play',
        href: 'https://play.google.com/store/apps/details?id=com.skyted.trainways',
      },
      {
        label: 'App Store',
        href: 'https://apps.apple.com/app/trainways/id6739769823',
      },
    ],
    chapters: [
      {
        paragraphs: [
          bilingual(
            'On choisit son train, par son numéro ou par ses gares, et l’application affiche les horaires, les zones couvertes et les zones sans réseau du trajet.',
            draft(
              'You pick your train, by number or by stations, and the app shows the times, the covered stretches and the dead zones of the journey.',
            ),
          ),
        ],
      },
      {
        paragraphs: [
          bilingual(
            'J’ai refait le back-end, mis l’application à jour et repris les développements prévus, puis je l’ai republiée sur Google Play et l’App Store.',
            draft(
              'I rebuilt the back end, updated the app and took up the planned work, then released it again on Google Play and the App Store.',
            ),
          ),
        ],
      },
    ],
  },
};
