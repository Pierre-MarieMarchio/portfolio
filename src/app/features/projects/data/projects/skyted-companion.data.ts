import { bilingual, draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

export const SKYTED_COMPANION: ProjectEntry = {
  project: {
    slug: 'skyted-companion',
    title: 'Skyted Companion',
    short: 'Skyted Companion',
    tag: bilingual('en cours', draft('in progress')),
    family: 'professional',
    subject: bilingual(
      'L’application desktop du prochain casque Skyted, pour Windows, macOS et Linux, écrite en .NET avec Avalonia.',
      draft(
        'The desktop app for Skyted’s next headset, for Windows, macOS and Linux, written in .NET with Avalonia.',
      ),
    ),
    summary: bilingual(
      'application desktop, trois systèmes',
      draft('desktop app, three systems'),
    ),
  },
  facts: {
    proof: bilingual(
      'En développement · code privé',
      draft('In development · private code'),
    ),
    role: bilingual(
      'Seul, de la conception au code',
      draft('Alone, from design to code'),
    ),
    stack: '.NET · Avalonia · Bluetooth',
    context: 'Skyted',
    period: '2025 – 2026',
  },
  detail: {
    lede: bilingual(
      'La version ordinateur de l’application qui pilote les casques Skyted.',
      draft('The computer version of the app that drives Skyted headsets.'),
    ),
    links: [],
    chapters: [
      {
        paragraphs: [
          bilingual(
            'L’application du casque existait sur téléphone. Pour le prochain modèle, il la fallait aussi sur ordinateur, et sur les trois systèmes.',
            draft(
              'The headset’s app existed on phones. The next model needed it on computers too, on all three systems.',
            ),
          ),
        ],
      },
      {
        paragraphs: [
          bilingual(
            'Le modèle de domaine, l’interface et son design system, la persistance avec EF Core, et un installeur pour chaque système. L’application s’appuie sur le monorepo .NET de Skyted, qu’elle partage avec Skyted Voice.',
            draft(
              'The domain model, the interface and its design system, persistence with EF Core, and an installer for each system. The app builds on Skyted’s .NET monorepo, which it shares with Skyted Voice.',
            ),
          ),
        ],
      },
      {
        paragraphs: [
          bilingual(
            'Le Bluetooth ne se programme pas de la même façon sur Windows, macOS et Linux, ni en Bluetooth Classic ni en BLE. J’ai mis les trois implémentations derrière une seule interface, choisie au démarrage par injection de dépendances. Le reste de l’application ignore sur quel système elle tourne.',
            draft(
              'Bluetooth is not programmed the same way on Windows, macOS and Linux, neither Classic nor BLE. I put the three implementations behind a single interface, picked at startup through dependency injection. The rest of the app does not know which system it runs on.',
            ),
          ),
        ],
      },
      {
        paragraphs: [
          bilingual(
            'Elle est toujours en développement. La connexion Bluetooth Classic et BLE est stable sous Windows, et la prochaine étape est l’intégration du SoundBubble.',
            draft(
              'It is still in development. The Bluetooth Classic and BLE connection is stable on Windows, and the next step is integrating SoundBubble.',
            ),
          ),
        ],
      },
    ],
  },
};
