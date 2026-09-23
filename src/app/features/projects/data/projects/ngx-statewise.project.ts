import { draft } from '@app/core/i18n';
import { ProjectEntry } from '../../models';

/** ngx-statewise: identity, facts and sheet, in one place. */
export const NGX_STATEWISE: ProjectEntry = {
  project: {
    slug: 'ngx-statewise',
    title: 'ngx-statewise',
    short: 'ngx-statewise',
    tag: 'open source',
    family: 'personal',
    subject: {
      fr: 'Une bibliothèque de gestion d’état pour Angular construite sur les signals : chaque action est reliée à la mise à jour d’état qu’elle provoque, puis aux effets qui en découlent.',
      en: draft(
        'A state management library for Angular built on signals: each action is tied to the state update it causes, then to the effects that follow from it.',
      ),
    },
    summary: {
      fr: 'gestion d’état Angular',
      en: draft('Angular state management'),
    },
  },
  facts: {
    proof: { fr: 'Dépôt public · npm', en: draft('Public repository · npm') },
    proofLevel: 'public',
    role: { fr: 'Seul, de bout en bout', en: draft('Alone, end to end') },
    stack: 'Angular · signals · TypeScript',
    context: { fr: 'Personnel', en: draft('Personal') },
  },
  sheet: {
    lede: {
      fr: 'Une alternative plus légère à NgRx et NGXS pour la gestion d’état Angular, appuyée sur les signals natifs plutôt que sur un store central.',
      en: draft(
        'A lighter alternative to NgRx and NGXS for Angular state management, resting on native signals rather than on a central store.',
      ),
    },
    links: [
      {
        label: 'github.com/Pierre-MarieMarchio/ngx-statewise',
        href: 'https://github.com/Pierre-MarieMarchio/ngx-statewise',
      },
    ],
    chapters: [
      {
        paragraphs: [
          {
            fr: 'Les solutions établies de gestion d’état Angular sont construites autour d’un store central, d’actions distribuées et d’observables. Elles fonctionnent, mais demandent une quantité de code d’infrastructure importante avant d’écrire la moindre règle métier.',
            en: draft(
              'The established Angular state management solutions are built around a central store, dispatched actions and observables. They work, but ask for a large amount of infrastructure code before the first business rule is written.',
            ),
          },
          {
            fr: 'J’ai voulu une approche qui s’appuie sur les signals introduits par Angular, où la réactivité de l’interface est automatique, et où l’on écrit surtout la logique.',
            en: draft(
              'I wanted an approach that rests on the signals Angular introduced, where the interface’s reactivity is automatic, and where one mostly writes the logic.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'Projet personnel. J’en ai défini le modèle, écrit la bibliothèque et la documentation, et je le maintiens seul. Il est publié en open source pour être relu et utilisé.',
            en: draft(
              'Personal project. I defined its model, wrote the library and its documentation, and I maintain it alone. It is published as open source, to be read and used.',
            ),
          },
        ],
        bullets: [
          {
            term: 'states',
            text: {
              fr: 'l’état, exposé en signals',
              en: draft('the state, exposed as signals'),
            },
          },
          {
            term: 'actions',
            text: {
              fr: 'événements typés, seuls ou groupés par source',
              en: draft('typed events, alone or grouped by source'),
            },
          },
          {
            term: 'updators',
            text: {
              fr: 'modifient l’état, et rien d’autre',
              en: draft('change the state, and nothing else'),
            },
          },
          {
            term: 'effects',
            text: {
              fr: 'appels réseau, navigation, et nouvelles actions',
              en: draft('network calls, navigation, and new actions'),
            },
          },
          {
            term: 'managers',
            text: {
              fr: 'la façade entre les composants et cette mécanique',
              en: draft('the facade between the components and this machinery'),
            },
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'La bibliothèque impose un ordre : une action est d’abord distribuée, l’updator met l’état à jour, et seulement ensuite l’effet s’exécute. Tout effet travaille donc sur l’état le plus récent, ce qui rend le comportement prévisible et le débogage plus simple.',
            en: draft(
              'The library imposes an order: an action is dispatched first, the updator updates the state, and only then does the effect run. Every effect therefore works on the most recent state, which makes the behaviour predictable and debugging simpler.',
            ),
          },
          {
            fr: 'Le compromis est réel et documenté dans le dépôt : impossible de déclencher un effet sans passer par une action, et les dérivations d’état très complexes demandent d’étendre les capacités de base. Pour qui vient d’un modèle Redux, cela demande un changement d’habitude.',
            en: draft(
              'The trade-off is real and documented in the repository: an effect cannot be triggered without going through an action, and very complex state derivations call for extending the base capabilities. For someone coming from a Redux model, it asks for a change of habit.',
            ),
          },
        ],
        figure: {
          kind: 'flow',
          steps: ['action', 'updator', 'effect'],
          loop: { fr: 'nouvelles actions', en: draft('new actions') },
          caption: {
            fr: 'Séquence documentée dans le dépôt. Schéma de lecture, pas une capture d’application.',
            en: draft(
              'Sequence documented in the repository. A reading diagram, not a screenshot of an application.',
            ),
          },
        },
      },
      {
        paragraphs: [
          {
            fr: 'Ce qui existe : une bibliothèque publiée, documentée concept par concept, avec ses exemples de code et une section qui expose elle-même ses limites.',
            en: draft(
              'What exists: a published library, documented concept by concept, with its code examples and a section that sets out its own limits.',
            ),
          },
          {
            fr: 'Ce qui n’est pas démontré : aucun usage en production mesuré, aucune adoption chiffrée, aucune comparaison de performance avec NgRx ou NGXS.',
            en: draft(
              'What is not shown: no measured production use, no figures on adoption, no performance comparison with NgRx or NGXS.',
            ),
          },
        ],
      },
    ],
  },
};
