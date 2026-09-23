import { draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

/** Speakey: identity, facts and sheet, in one place. */
export const SPEAKEY: ProjectEntry = {
  project: {
    slug: 'speakey',
    title: 'Speakey',
    short: 'Speakey',
    tag: 'prototype',
    family: 'personal',
    subject: {
      fr: 'Prototype mobile personnel, écrit pour apprendre et resté à l’état de prototype.',
      en: draft(
        'A personal mobile prototype, written to learn and left at the prototype stage.',
      ),
    },
    summary: { fr: 'prototype personnel', en: draft('personal prototype') },
  },
  facts: {
    proof: {
      fr: 'Prototype · non déployé',
      en: draft('Prototype · not deployed'),
    },
    proofLevel: 'none',
    role: {
      fr: 'Conception et développement',
      en: draft('Design and development'),
    },
    stack: { fr: 'Prototype mobile', en: draft('Mobile prototype') },
    context: { fr: 'Personnel', en: draft('Personal') },
  },
  sheet: {
    lede: {
      fr: 'Un prototype personnel, resté prototype : écrit pour apprendre, pas pour être mis en service.',
      en: draft(
        'A personal prototype, left a prototype: written to learn, not to be put into service.',
      ),
    },
    links: [],
    chapters: [
      {
        paragraphs: [
          {
            fr: 'J’apprends en écrivant quelque chose qui fonctionne. Avant de savoir si une idée tient, je la construis assez loin pour en mesurer le coût : c’est ce qu’a été ce prototype, mené seul, en dehors de tout cadre professionnel.',
            en: draft(
              'I learn by writing something that works. Before knowing whether an idea holds, I build it far enough to measure its cost: that is what this prototype was, carried out alone, outside any professional setting.',
            ),
          },
          {
            fr: 'Il n’a pas été déployé, et je ne le présente pas pour autre chose que ce qu’il m’a appris.',
            en: draft(
              'It was not deployed, and I present it for nothing more than what it taught me.',
            ),
          },
        ],
      },
      {
        title: { fr: 'Qu’est-ce qui tient ?', en: draft('What holds?') },
        paragraphs: [
          {
            fr: 'Ce qui existe : un prototype, sans mise en production ni utilisateurs.',
            en: draft(
              'What exists: a prototype, with no production release and no users.',
            ),
          },
          // Flagged in the handoff (§8): said twice, here and in "Méthode".
          // Kept as written until it is rewritten or cut.
          {
            fr: 'Ce qu’il m’a laissé : l’habitude de tenir un projet de bout en bout — la seule manière que je connaisse d’en voir le coût réel, et celle que je reprends aujourd’hui dans les projets que je publie.',
            en: draft(
              'What it left me: the habit of carrying a project end to end — the only way I know to see its real cost, and the one I take up today in the projects I publish.',
            ),
          },
        ],
      },
    ],
  },
};
