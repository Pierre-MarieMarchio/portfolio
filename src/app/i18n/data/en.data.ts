import { draft } from '@app/core/rules';
import { Catalog } from '../models/catalog.model';
import { OWNER_NAME } from './owner.data';
import { EN_PROFILE } from './en-profile.data';

export const EN: Catalog = {
  shared: {
    segmented: { label: draft('Selection') },
    pageBar: {
      languages: draft('Site language'),
      navigation: draft('Main navigation'),
      openWindow: draft('window open'),
    },
    contactRail: {
      label: draft('Contact me'),
    },
  },

  windows: {
    menu: draft('Window menu'),
    keepOpen: draft('Keep open when changing page'),
    keptOpen: draft('kept open'),
    snapLeft: draft('Left half'),
    snapRight: draft('Right half'),
    maximize: draft('Maximize the window'),
    restore: draft('Put the window back to its size'),
    close: draft('Close the window'),
    phone: {
      pin: draft('Keep this window open when changing tab'),
      unpin: draft('Let this window close when changing tab'),
      fold: draft('Lower the window'),
      unfold: draft('Raise the window'),
    },
    kept: draft('Window kept'),
    released: draft('Window released'),
  },

  mobileNav: {
    pageOf: draft(
      (place: number, count: number) =>
        `Page ${String(place)} of ${String(count)}`,
    ),
    close: draft('Close'),
  },

  projects: {
    defaultChapterTitles: [
      draft('The need'),
      draft('What I did'),
      draft('A technical choice'),
      draft('Today'),
    ],
    index: {
      heading: draft('Projects'),
      label: draft('Project list'),
      title: draft((count: string) => `The ${count} projects`),
      count: draft((count: string) => `${count} projects`),
      families: {
        label: draft('Filter the projects'),
        all: { label: draft('All'), aria: draft('Show every project') },
        professional: {
          label: draft('At work'),
          aria: draft('Show the projects done at work'),
        },
        personal: {
          label: draft('Personal'),
          aria: draft('Show the personal projects'),
        },
      },
      summary: draft(
        (professional: string, personal: string) =>
          `${professional} at work · ${personal} personal`,
      ),
      columns: [
        draft('No.'),
        draft('Project'),
        draft('Status'),
        draft('My role'),
      ],
      read: draft('viewed'),
    },
    preview: {
      label: draft('Project preview'),
      bodies: draft('Featured projects'),
      body: draft(
        (number: string, title: string) => `Project ${number}: ${title}`,
      ),
      previous: draft((title: string) => `Previous project: ${title}`),
      next: draft((title: string) => `Next project: ${title}`),
      terms: {
        proof: draft('Status'),
        role: draft('Role'),
        stack: draft('Stack'),
      },
      openSheet: draft('See the project →'),
    },
    sheet: {
      label: draft('Project details'),
      toIndex: draft('‹ Projects'),
      toIndexLabel: draft('Back to the projects'),
      approaches: draft('Sections'),
      approach: draft(
        (number: string, title: string) => `Section ${number}: ${title}`,
      ),
      terms: {
        access: draft('Status'),
        role: draft('Role'),
        stack: draft('Stack'),
        context: draft('Context'),
        period: draft('Period'),
      },
      nextApproach: draft((title: string) => `Next: ${title} →`),
      nextProject: draft((short: string) => `Next project: ${short} →`),
    },
    rule: {
      heading: draft('Projects in orbit'),
      all: draft('All the projects →'),
    },
  },

  observatory: {
    animation: {
      pause: draft('Pause the animation'),
      resume: draft('Resume the animation'),
    },
    object: {
      select: draft(
        (_number: string, title: string) => `Show ${title} in the list`,
      ),
      preview: draft((title: string) => `Preview of ${title}`),
      parts: [
        draft('Profile'),
        draft('Skills'),
        draft('Path'),
        draft('What next'),
      ],
    },
    home: {
      name: OWNER_NAME,
      trade: draft('.NET and Angular developer'),
      status: draft('I am looking for the next project to build.'),
      brand: 'Portfolio',
    },
    intro: {
      skip: draft('Skip the intro'),
    },
    stepBack: {
      deselect: draft('Deselect the project'),
      closePreview: draft('Close the preview'),
      overview: draft('‹ Overview'),
    },
    closeTo: {
      home: draft('Close and go back home'),
      index: draft('Close and go back to the projects'),
    },
    dock: {
      label: draft('Put-away windows'),
      windows: {
        about: draft('About'),
        index: draft('Projects'),
        sheet: draft('Details'),
        preview: draft('Preview'),
      },
    },
    notFound: {
      heading: draft('Page not found'),
      label: draft('Page not found'),
      title: draft('Nothing in orbit at this address.'),
      sentence: draft(
        (count: string) => `None of the ${count} projects matches this link.`,
      ),
      back: draft('All the projects →'),
    },
  },

  profile: EN_PROFILE,

  pages: {
    heads: {
      home: {
        title: draft('Home'),
        description: draft(
          'Pierre-Marie Marchio, .NET and Angular developer in Toulouse, looking for a work-study position. His web, desktop and mobile projects.',
        ),
      },
      index: {
        title: draft('Projects'),
        description: draft(
          'The projects of Pierre-Marie Marchio, at work and personal, and what he did on each.',
        ),
      },
      about: {
        title: draft('About'),
        description: draft(
          'Path, skills and work-study search of Pierre-Marie Marchio, developer in Toulouse.',
        ),
      },
      notFound: { title: draft('Page not found') },
      sheet: { title: draft('Project') },
    },
    skipLink: draft('Skip to the content'),
    navigation: {
      home: draft('Home'),
      index: draft('Projects'),
      about: draft('About'),
    },
    languages: { fr: 'Français', en: 'English' },
  },
};
