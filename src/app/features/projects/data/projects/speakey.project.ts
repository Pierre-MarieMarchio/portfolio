import { ProjectEntry } from '../../models';

/** Speakey: identity, facts and sheet, in one place. */
export const SPEAKEY: ProjectEntry = {
  project: {
    slug: 'speakey',
    title: 'Speakey',
    short: 'Speakey',
    tag: 'prototype',
    family: 'personal',
    subject:
      'Prototype mobile personnel, écrit pour apprendre et resté à l’état de prototype.',
    summary: 'prototype personnel',
  },
  facts: {
    proof: 'Prototype · non déployé',
    proofLevel: 'none',
    role: 'Conception et développement',
    stack: 'Prototype mobile',
    context: 'Personnel',
  },
  sheet: {
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
