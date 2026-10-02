import { bilingual, draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

export const SKYTED_APP: ProjectEntry = {
  project: {
    slug: 'skyted-app',
    title: bilingual('Application Skyted 320', draft('Skyted 320 app')),
    short: 'Skyted 320',
    family: 'professional',
    subject: bilingual(
      'L’application mobile du casque Skyted 320 : appairage, mises à jour, entraînement à parler bas et portée de la voix en temps réel.',
      draft(
        'The mobile app for the Skyted 320 headset: pairing, updates, training to speak quietly and live voice reach.',
      ),
    ),
    summary: bilingual(
      'application du casque, iOS et Android',
      draft('headset app, iOS and Android'),
    ),
  },
  facts: {
    proof: bilingual(
      'Sur Google Play et l’App Store',
      draft('On Google Play and the App Store'),
    ),
    role: bilingual(
      'En binôme : correctifs, Bluetooth, back-end',
      draft('In a pair: fixes, Bluetooth, back end'),
    ),
    stack: 'Kotlin · Swift · BLE · Firebase',
    context: 'Skyted',
    period: '2025 – 2026',
  },
  detail: {
    lede: bilingual(
      'L’application qui accompagne le casque, pour l’appairer, le mettre à jour et apprendre à parler bas.',
      draft(
        'The app that comes with the headset, to pair it, update it and learn to speak quietly.',
      ),
    ),
    links: [
      {
        label: 'Google Play',
        href: 'https://play.google.com/store/apps/details?id=io.skyted.app320.android',
      },
      {
        label: 'App Store',
        href: 'https://apps.apple.com/app/skyted-app/id6753917589',
      },
    ],
    chapters: [
      {
        paragraphs: [
          bilingual(
            'Le Skyted 320 garde les appels confidentiels. L’application gère l’appareil (batterie, compte, mises à jour du firmware) et montre en temps réel jusqu’où la voix porte.',
            draft(
              'The Skyted 320 keeps calls private. The app manages the device (battery, account, firmware updates) and shows in real time how far your voice carries.',
            ),
          ),
        ],
      },
      {
        paragraphs: [
          bilingual(
            'Des correctifs sur les versions iOS et Android, et la migration du back-end vers Firebase Functions v2.',
            draft(
              'Fixes on the iOS and Android versions, and the migration of the back end to Firebase Functions v2.',
            ),
          ),
        ],
      },
      {
        title: bilingual('Le Bluetooth, refait', draft('Bluetooth, redone')),
        paragraphs: [
          bilingual(
            'Pour le firmware V24, j’ai refait le scan et l’appairage. L’application reconnaît le casque par ses données constructeur, puis par ses services GATT, et repère les mises à jour grâce à un checksum. La connexion est environ 20 % plus rapide.',
            draft(
              'For firmware V24, I redid the scan and the pairing. The app recognises the headset by its manufacturer data, then by its GATT services, and spots updates with a checksum. Connecting is about 20% faster.',
            ),
          ),
        ],
      },
      {
        paragraphs: [
          bilingual(
            'Elle est sur Google Play et sur l’App Store.',
            draft('It is on Google Play and the App Store.'),
          ),
        ],
      },
    ],
  },
};
