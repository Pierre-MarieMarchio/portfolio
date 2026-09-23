import { ProjectFacts } from '../models';

/**
 * What can be checked about each project: the one table of facts, read by
 * every view. The export still misses the period, the duration and the scale
 * of each project, and the stack of Bk-ONE is an assumption; none of it is
 * made up here.
 */
export const FACTS: Readonly<Record<string, ProjectFacts>> = {
  'skyted-voice': {
    proof: 'Publiée · deux magasins',
    proofLevel: 'public',
    role: 'Seul, jusqu’à la production',
    stack: '.NET MAUI · audio temps réel',
    context: 'Skyted',
  },
  'skyted-app': {
    proof: 'Publiée · deux magasins',
    proofLevel: 'public',
    role: 'Reprise, puis livraisons',
    stack: 'Swift · Kotlin · BLE',
    context: 'Skyted',
  },
  'ngx-statewise': {
    proof: 'Dépôt public · npm',
    proofLevel: 'public',
    role: 'Seul, de bout en bout',
    stack: 'Angular · signals · TypeScript',
    context: 'Personnel',
  },
  'template-dotnet': {
    proof: 'Dépôt public · dotnet new',
    proofLevel: 'public',
    role: 'Seul, de bout en bout',
    stack: '.NET 10 · EF Core · PostgreSQL',
    context: 'Personnel',
  },
  bkone: {
    proof: 'Produit commercialisé · code privé',
    proofLevel: 'indirect',
    role: 'Stage — refonte du back',
    stack: 'Java · flux ISO 20022',
    context: 'Numerilis',
  },
  'skyted-companion': {
    proof: 'Interne · non publiée',
    proofLevel: 'none',
    role: 'Développement, en équipe',
    stack: 'Natif · BLE',
    context: 'Skyted',
  },
  speakey: {
    proof: 'Prototype · non déployé',
    proofLevel: 'none',
    role: 'Conception et développement',
    stack: 'Prototype mobile',
    context: 'Personnel',
  },
};
