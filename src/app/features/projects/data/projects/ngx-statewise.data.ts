import { draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

export const NGX_STATEWISE: ProjectEntry = {
  project: {
    slug: 'ngx-statewise',
    title: 'ngx-statewise',
    short: 'ngx-statewise',
    tag: 'open source',
    family: 'personal',
    subject: {
      fr: 'Une bibliothèque de gestion d’état pour Angular, construite sur les signals, qui demande moins de code d’infrastructure que NgRx.',
      en: draft(
        'A state management library for Angular, built on signals, that takes less infrastructure code than NgRx.',
      ),
    },
    summary: {
      fr: 'gestion d’état Angular',
      en: draft('Angular state management'),
    },
  },
  facts: {
    proof: {
      fr: 'Sur npm · code public',
      en: draft('On npm · public code'),
    },
    role: { fr: 'Seul', en: draft('Alone') },
    stack: 'Angular · signals · TypeScript',
    context: { fr: 'Personnel', en: draft('Personal') },
    period: { fr: 'depuis 2025', en: draft('since 2025') },
  },
  detail: {
    lede: {
      fr: 'Publiée sur npm, avec un site de documentation en français et en anglais.',
      en: draft(
        'Published on npm, with a documentation site in French and English.',
      ),
    },
    links: [
      {
        label: {
          fr: 'Site de documentation',
          en: draft('Documentation site'),
        },
        href: 'https://pierre-mariemarchio.github.io/ngx-statewise/',
      },
      {
        label: 'github.com/Pierre-MarieMarchio/ngx-statewise',
        href: 'https://github.com/Pierre-MarieMarchio/ngx-statewise',
      },
    ],
    chapters: [
      {
        paragraphs: [
          {
            fr: 'Avec NgRx ou NGXS, on écrit beaucoup de code d’infrastructure avant d’arriver à la première règle métier. ngx-statewise s’appuie sur les signals d’Angular pour en écrire moins.',
            en: draft(
              'With NgRx or NGXS, you write a lot of infrastructure code before reaching the first business rule. ngx-statewise builds on Angular’s signals so you write less of it.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'La bibliothèque, sa documentation et son site, depuis avril 2025. Elle est couverte à 100 % par ses tests.',
            en: draft(
              'The library, its documentation and its site, since April 2025. Its tests cover it at 100%.',
            ),
          },
        ],
        bullets: [
          {
            term: 'actions',
            text: { fr: 'ce qui s’est passé', en: draft('what happened') },
          },
          {
            term: 'interceptors',
            text: {
              fr: 'peuvent refuser une action avant qu’elle touche l’état',
              en: draft('can refuse an action before it reaches the state'),
            },
          },
          {
            term: 'updaters',
            text: {
              fr: 'appliquent l’action à l’état, de façon synchrone',
              en: draft('apply the action to the state, synchronously'),
            },
          },
          {
            term: 'effects',
            text: {
              fr: 'le travail asynchrone, qui renvoie l’action suivante',
              en: draft('the asynchronous work, which returns the next action'),
            },
          },
          {
            term: 'managers',
            text: {
              fr: 'la seule chose à laquelle parlent les composants',
              en: draft('the only thing components talk to'),
            },
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'L’état est écrit avant que les effets tournent. Un effet travaille donc toujours sur l’état à jour, et le comportement reste prévisible. En contrepartie, on ne lance pas d’effet sans passer par une action. La documentation dit aussi dans quels cas mieux vaut prendre autre chose.',
            en: draft(
              'The state is written before the effects run. An effect therefore always works on the current state, and the behaviour stays predictable. In return, you cannot start an effect without going through an action. The documentation also says when something else is a better fit.',
            ),
          },
        ],
        figure: {
          kind: 'flow',
          steps: ['action', 'interceptor', 'updater', 'effect'],
          loop: { fr: 'nouvelles actions', en: draft('new actions') },
          caption: {
            fr: 'Le flux décrit dans la documentation.',
            en: draft('The flow described in the documentation.'),
          },
        },
      },
      {
        paragraphs: [
          {
            fr: 'La 0.6 est la version stable, la 1.0 est en bêta depuis septembre 2026. Ce portfolio l’utilise.',
            en: draft(
              'Version 0.6 is the stable one, and 1.0 has been in beta since September 2026. This portfolio runs on it.',
            ),
          },
        ],
      },
    ],
  },
};
