import { ProjectEntry } from '../../models';

/** ngx-statewise: identity, facts and sheet, in one place. */
export const NGX_STATEWISE: ProjectEntry = {
  project: {
    slug: 'ngx-statewise',
    title: 'ngx-statewise',
    short: 'ngx-statewise',
    tag: 'open source',
    family: 'personal',
    subject:
      'Une bibliothèque de gestion d’état pour Angular construite sur les signals : chaque action est reliée à la mise à jour d’état qu’elle provoque, puis aux effets qui en découlent.',
    summary: 'gestion d’état Angular',
  },
  facts: {
    proof: 'Dépôt public · npm',
    proofLevel: 'public',
    role: 'Seul, de bout en bout',
    stack: 'Angular · signals · TypeScript',
    context: 'Personnel',
  },
  sheet: {
    lede: 'Une alternative plus légère à NgRx et NGXS pour la gestion d’état Angular, appuyée sur les signals natifs plutôt que sur un store central.',
    links: [
      {
        label: 'github.com/Pierre-MarieMarchio/ngx-statewise',
        href: 'https://github.com/Pierre-MarieMarchio/ngx-statewise',
      },
    ],
    chapters: [
      {
        paragraphs: [
          'Les solutions établies de gestion d’état Angular sont construites autour d’un store central, d’actions distribuées et d’observables. Elles fonctionnent, mais demandent une quantité de code d’infrastructure importante avant d’écrire la moindre règle métier.',
          'J’ai voulu une approche qui s’appuie sur les signals introduits par Angular, où la réactivité de l’interface est automatique, et où l’on écrit surtout la logique.',
        ],
      },
      {
        paragraphs: [
          'Projet personnel. J’en ai défini le modèle, écrit la bibliothèque et la documentation, et je le maintiens seul. Il est publié en open source pour être relu et utilisé.',
        ],
        bullets: [
          {
            term: 'states',
            text: 'l’état, exposé en signals',
          },
          {
            term: 'actions',
            text: 'événements typés, seuls ou groupés par source',
          },
          {
            term: 'updators',
            text: 'modifient l’état, et rien d’autre',
          },
          {
            term: 'effects',
            text: 'appels réseau, navigation, et nouvelles actions',
          },
          {
            term: 'managers',
            text: 'la façade entre les composants et cette mécanique',
          },
        ],
      },
      {
        paragraphs: [
          'La bibliothèque impose un ordre : une action est d’abord distribuée, l’updator met l’état à jour, et seulement ensuite l’effet s’exécute. Tout effet travaille donc sur l’état le plus récent, ce qui rend le comportement prévisible et le débogage plus simple.',
          'Le compromis est réel et documenté dans le dépôt : impossible de déclencher un effet sans passer par une action, et les dérivations d’état très complexes demandent d’étendre les capacités de base. Pour qui vient d’un modèle Redux, cela demande un changement d’habitude.',
        ],
        figure: {
          kind: 'flow',
          steps: ['action', 'updator', 'effect'],
          loop: 'nouvelles actions',
          caption:
            'Séquence documentée dans le dépôt. Schéma de lecture, pas une capture d’application.',
        },
      },
      {
        paragraphs: [
          'Ce qui existe : une bibliothèque publiée, documentée concept par concept, avec ses exemples de code et une section qui expose elle-même ses limites.',
          'Ce qui n’est pas démontré : aucun usage en production mesuré, aucune adoption chiffrée, aucune comparaison de performance avec NgRx ou NGXS.',
        ],
      },
    ],
  },
};
