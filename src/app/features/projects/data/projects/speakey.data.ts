import { draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

export const SPEAKEY: ProjectEntry = {
  project: {
    slug: 'speakey',
    title: 'Speakey',
    short: 'Speakey',
    tag: { fr: 'arrêté', en: draft('stopped') },
    family: 'professional',
    subject: {
      fr: 'Le site et l’API d’un outil de dictée vocale hébergé en Europe, chez Skyted.',
      en: draft(
        'The website and API of a voice dictation tool hosted in Europe, at Skyted.',
      ),
    },
    summary: { fr: 'dictée vocale, web', en: draft('voice dictation, web') },
  },
  facts: {
    proof: { fr: 'Pas de lien public', en: draft('No public link') },
    role: {
      fr: 'Tout, sauf le moteur de reconnaissance',
      en: draft('Everything but the recognition engine'),
    },
    stack: 'Angular · .NET 10 · OVHcloud',
    context: 'Skyted',
    period: '2025 – 2026',
  },
  detail: {
    lede: {
      fr: 'Tout le logiciel autour du moteur de reconnaissance de la parole, jusqu’à la mise en production.',
      en: draft(
        'All the software around the speech recognition engine, up to production.',
      ),
    },
    links: [],
    chapters: [
      {
        paragraphs: [
          {
            fr: 'Skyted voulait un outil de dictée vocale dont les données restent en Europe. Le moteur de reconnaissance devait venir ensuite.',
            en: draft(
              'Skyted wanted a voice dictation tool whose data stays in Europe. The recognition engine was to come later.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'Le front en Angular (signals, prérendu, i18n, design system en SCSS), l’API REST en .NET 10, et la mise en production sur un VPS OVHcloud en HTTPS, avec une CI/CD GitHub Actions.',
            en: draft(
              'The Angular front end (signals, prerendering, i18n, an SCSS design system), the .NET 10 REST API, and the production deployment on an OVHcloud VPS over HTTPS, with GitHub Actions CI/CD.',
            ),
          },
        ],
      },
      {
        title: { fr: 'Aujourd’hui', en: draft('Today') },
        paragraphs: [
          {
            fr: 'Le projet s’est arrêté avant l’arrivée du moteur.',
            en: draft('The project stopped before the engine arrived.'),
          },
        ],
      },
    ],
  },
};
