import { draft } from '@app/core/rules';
import { Catalog } from '../models/catalog.model';

/**
 * Every text of the interface, in English: the one file to open to change
 * one. Written without the author's review, so each text is marked
 * `draft(…)` until it is read; `src/integration/drafts.spec.ts` counts the
 * ones left. The lorem ipsum and the "to be filled in" lines stand where the
 * French placeholders do.
 */
export const EN: Catalog = {
  shared: {
    segmented: { label: draft('Selection') },
    pageBar: {
      languages: draft('Site language'),
      navigation: draft('Main navigation'),
    },
    contactRail: {
      label: draft('Contact me'),
    },
  },

  windows: {
    pin: draft('Pin: keep the window open when changing page'),
    unpin: draft('Unpin: the window will close when changing page'),
    fold: draft('Fold the window'),
    unfold: draft('Unfold the window'),
    close: draft('Close the window'),
  },

  projects: {
    proofLevels: {
      public: draft('Open it yourself'),
      indirect: draft('Checkable, private code'),
      none: draft('On account only'),
    },
    defaultChapterTitles: [
      draft('Why?'),
      draft('What did I do?'),
      draft('Which trade-off?'),
      draft('What holds?'),
    ],
    index: {
      heading: draft('Projects · the index'),
      label: draft('Window: index of the projects'),
      title: draft((count: string) => `Projects — the index of ${count} works`),
      count: draft((count: string) => `${count} sheets`),
      families: {
        label: draft('Project families'),
        all: { label: draft('All'), aria: draft('See every project') },
        professional: {
          label: draft('At work'),
          aria: draft('See only the work done in a company'),
        },
        personal: {
          label: draft('Personal'),
          aria: draft('See only the personal projects'),
        },
      },
      summary: draft(
        (professional: string, personal: string) =>
          `${professional} at work · ${personal} personal`,
      ),
      columns: [
        draft('Ref'),
        draft('Project'),
        draft('What you can check'),
        draft('Role held'),
      ],
      read: draft('read'),
      openSheet: draft('Open the sheet →'),
    },
    preview: {
      label: draft('Window: project preview'),
      bodies: draft('Bodies in orbit'),
      body: draft(
        (number: string, title: string) => `Preview ${number} — ${title}`,
      ),
      terms: {
        proof: draft('Proof'),
        role: draft('Role'),
        stack: draft('Stack'),
      },
      openSheet: draft('Open the sheet →'),
    },
    sheet: {
      label: draft('Window: project sheet'),
      approaches: draft('Approaches of the sheet'),
      approach: draft(
        (number: string, title: string) => `Approach ${number} — ${title}`,
      ),
      terms: {
        access: draft('Access'),
        role: draft('Role'),
        stack: draft('Technique'),
        context: draft('Context'),
      },
      nextApproach: draft((title: string) => `Next: ${title} →`),
      nextProject: draft((short: string) => `Following: ${short} →`),
    },
    rule: {
      heading: draft('Projects in orbit'),
      all: draft('All the projects →'),
    },
  },

  desktop: {
    animation: {
      pause: draft('Pause the animation of the object'),
      resume: draft('Resume the animation of the object'),
    },
    object: {
      select: draft(
        (number: string, title: string) =>
          `Select ${number} — ${title} in the index`,
      ),
      preview: draft((title: string) => `Preview of the project ${title}`),
      parts: [
        draft('Profile'),
        draft('Skills'),
        draft('Method'),
        draft('Path'),
      ],
    },
    home: {
      void: draft('Close and go back to the overview'),
      name: 'Pierre-Marie Marchio',
      trade: draft('Application designer and developer'),
      brand: 'Portfolio',
    },
    notFound: {
      heading: draft('Unknown address'),
      label: draft('Window: unknown address'),
      title: draft('This work does not exist.'),
      sentence: draft(
        (count: string) =>
          `The address asked for matches none of the ${count} sheets of the index.`,
      ),
      back: draft('All the projects →'),
    },
  },

  profile: {
    about: {
      heading: draft('About'),
      label: draft('Window: about'),
      parts: draft('Parts of the profile'),
      title: draft((part: string) => `About — ${part}`),
      goTo: draft((part: string) => `Go to: ${part}`),
      next: draft((part: string) => `Next: ${part} →`),
      back: draft('All the projects →'),
      profile: {
        label: draft('Profile'),
        title: draft('Profile'),
        lead: draft(
          'I come from archaeology. I kept one habit from it: asserting nothing without proof.',
        ),
        facts: [
          {
            term: draft('Position'),
            value: draft('Application designer and developer, Skyted'),
            tone: 'text',
          },
          {
            term: draft('Stack'),
            value: '.NET · MAUI · Angular · Swift · Kotlin · PostgreSQL',
            tone: 'data',
          },
          {
            term: draft('Place'),
            value: draft('Lorem ipsum — city and mobility to be filled in'),
            tone: 'quiet',
          },
          {
            term: draft('Open to'),
            value: draft(
              'Lorem ipsum — permanent, contract, freelance: to be specified',
            ),
            tone: 'quiet',
          },
        ],
        prose: [
          draft(
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Two applications published on the stores, two open-source foundations written alone: what you read here can be checked in three clicks.',
          ),
          'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, ut enim ad minim veniam quis nostrud exercitation ullamco laboris.',
        ],
      },
      skills: {
        label: draft('Skills'),
        title: draft('Skills · what I have delivered on'),
        heading: draft('What I have delivered on'),
        domains: [
          { label: 'Web', value: draft('.NET APIs, Angular front ends') },
          {
            label: 'Mobile',
            value: draft('published applications, tied to a device'),
          },
          {
            label: draft('Hardware'),
            value: draft('Bluetooth Low Energy integration'),
          },
          { label: 'Desktop', value: draft('Java Swing applications') },
          {
            label: draft('Business'),
            value: draft('banking flows, European clearing'),
          },
        ],
        prose: draft(
          'Lorem ipsum dolor sit amet: each line leads to a project of the index, not to a list of keywords.',
        ),
      },
      method: {
        label: draft('Method'),
        title: draft('Way of working'),
        heading: draft('How I work'),
        steps: [
          draft(
            'Carry a project through to production: the only way to see its real cost.',
          ),
          draft(
            'Lorem ipsum dolor sit amet — decisions that are explained, code that can be read again.',
          ),
          draft(
            'Consectetur adipiscing elit — results you can go and check yourself.',
          ),
        ],
      },
      path: {
        label: draft('Path'),
        title: draft('Path'),
        heading: draft('Steps'),
        missing: draft('years to be filled in'),
        milestones: [
          {
            year: '— — — —',
            fact: draft('Archaeology: excavation, survey, description'),
          },
          { year: '— — — —', fact: draft('Retraining into development') },
          {
            year: '— — — —',
            fact: draft('Training — title and school to be filled in'),
          },
          {
            year: '— — — —',
            fact: draft(
              'Numerilis — internship, rework of the Bk-ONE back end',
            ),
          },
          {
            year: '— — — —',
            fact: draft('Skyted — application designer and developer'),
          },
        ],
      },
    },
    contact: {
      email: draft('Write to me at pierremariemarchio.pro@gmail.com'),
      linkedin: draft('LinkedIn profile of Pierre-Marie Marchio'),
      github: draft('GitHub repositories of Pierre-Marie Marchio'),
    },
  },
  pages: {
    heads: {
      home: {
        title: draft('Home'),
        description: draft(
          'Portfolio of Pierre-Marie Marchio, application designer and developer.',
        ),
      },
      index: {
        title: draft('Projects'),
        description: draft('The projects of Pierre-Marie Marchio.'),
      },
      about: {
        title: draft('About'),
        description: draft('Who Pierre-Marie Marchio is.'),
      },
      notFound: { title: draft('Unknown address') },
      sheet: { title: draft('Project') },
    },
    skipLink: draft('Skip to the content'),
    navigation: {
      home: draft('Home'),
      index: draft('Projects'),
      about: draft('About'),
    },
    // Each language named in itself: the same in both catalogues.
    languages: { fr: 'Français', en: 'English' },
  },
};
