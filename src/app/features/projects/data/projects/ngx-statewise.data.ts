import { bilingual, draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

export const NGX_STATEWISE: ProjectEntry = {
  project: {
    slug: 'ngx-statewise',
    title: 'ngx-statewise',
    short: 'ngx-statewise',
    tag: 'open source',
    family: 'personal',
    subject: bilingual(
      'Une bibliothèque de gestion d’état pour Angular, construite sur les signals, qui demande moins de code d’infrastructure que NgRx.',
      draft(
        'A state management library for Angular, built on signals, that takes less infrastructure code than NgRx.',
      ),
    ),
    summary: bilingual(
      'gestion d’état Angular',
      draft('Angular state management'),
    ),
  },
  facts: {
    proof: bilingual('Sur npm · code public', draft('On npm · public code')),
    role: bilingual('Seul', draft('Alone')),
    stack: 'Angular · signals · TypeScript',
    context: bilingual('Personnel', draft('Personal')),
    period: bilingual('depuis 2025', draft('since 2025')),
  },
  detail: {
    lede: bilingual(
      'Publiée sur npm, avec un site de documentation en français et en anglais.',
      draft(
        'Published on npm, with a documentation site in French and English.',
      ),
    ),
    links: [
      {
        label: bilingual('Site de documentation', draft('Documentation site')),
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
          bilingual(
            'Avec NgRx ou NGXS, on écrit beaucoup de code d’infrastructure avant d’arriver à la première règle métier. ngx-statewise s’appuie sur les signals d’Angular pour en écrire moins.',
            draft(
              'With NgRx or NGXS, you write a lot of infrastructure code before reaching the first business rule. ngx-statewise builds on Angular’s signals so you write less of it.',
            ),
          ),
        ],
      },
      {
        paragraphs: [
          bilingual(
            'La bibliothèque, sa documentation et son site, depuis avril 2025. Elle est couverte à 100 % par ses tests.',
            draft(
              'The library, its documentation and its site, since April 2025. Its tests cover it at 100%.',
            ),
          ),
        ],
        bullets: [
          {
            term: 'actions',
            text: bilingual('ce qui s’est passé', draft('what happened')),
          },
          {
            term: 'interceptors',
            text: bilingual(
              'peuvent refuser une action avant qu’elle touche l’état',
              draft('can refuse an action before it reaches the state'),
            ),
          },
          {
            term: 'updaters',
            text: bilingual(
              'appliquent l’action à l’état, de façon synchrone',
              draft('apply the action to the state, synchronously'),
            ),
          },
          {
            term: 'effects',
            text: bilingual(
              'le travail asynchrone, qui renvoie l’action suivante',
              draft('the asynchronous work, which returns the next action'),
            ),
          },
          {
            term: 'managers',
            text: bilingual(
              'la seule chose à laquelle parlent les composants',
              draft('the only thing components talk to'),
            ),
          },
        ],
      },
      {
        paragraphs: [
          bilingual(
            'L’état est écrit avant que les effets tournent. Un effet travaille donc toujours sur l’état à jour, et le comportement reste prévisible. En contrepartie, on ne lance pas d’effet sans passer par une action. La documentation dit aussi dans quels cas mieux vaut prendre autre chose.',
            draft(
              'The state is written before the effects run. An effect therefore always works on the current state, and the behaviour stays predictable. In return, you cannot start an effect without going through an action. The documentation also says when something else is a better fit.',
            ),
          ),
        ],
        figure: {
          kind: 'flow',
          steps: ['action', 'interceptor', 'updater', 'effect'],
          loop: bilingual('nouvelles actions', draft('new actions')),
          caption: bilingual(
            'Le flux décrit dans la documentation.',
            draft('The flow described in the documentation.'),
          ),
        },
      },
      {
        paragraphs: [
          bilingual(
            'La 0.6 est la version stable, la 1.0 est en bêta depuis septembre 2026. Ce portfolio l’utilise.',
            draft(
              'Version 0.6 is the stable one, and 1.0 has been in beta since September 2026. This portfolio runs on it.',
            ),
          ),
        ],
      },
    ],
  },
};
