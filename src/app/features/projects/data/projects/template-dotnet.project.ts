import { ProjectEntry } from '../../models';

/** Template Clean Architecture .NET: identity, facts and sheet, in one place. */
export const TEMPLATE_DOTNET: ProjectEntry = {
  project: {
    slug: 'template-dotnet',
    title: 'Template Clean Architecture .NET',
    short: 'Template .NET',
    tag: 'open source',
    family: 'personal',
    subject:
      'Un point de départ pour une API HTTP .NET 10 : découpage Clean Architecture, PostgreSQL via EF Core, authentification ASP.NET Identity avec JWT et jetons de rafraîchissement rotatifs, refus par défaut en autorisation, erreurs RFC 7807.',
    summary: 'socle d’API .NET 10',
  },
  facts: {
    proof: 'Dépôt public · dotnet new',
    proofLevel: 'public',
    role: 'Seul, de bout en bout',
    stack: '.NET 10 · EF Core · PostgreSQL',
    context: 'Personnel',
  },
  sheet: {
    lede: 'Un dépôt de départ pour une API HTTP .NET 10, pour ne pas réécrire chaque fois l’authentification, le découpage en couches et la chaîne de vérification.',
    links: [
      {
        label:
          'github.com/Pierre-MarieMarchio/Template-DotNet_Clean_Architecture',
        href: 'https://github.com/Pierre-MarieMarchio/Template-DotNet_Clean_Architecture',
      },
    ],
    chapters: [
      {
        paragraphs: [
          'Démarrer une API sérieuse demande à chaque fois les mêmes semaines de mise en place : couches, persistance, authentification, format d’erreurs, intégration continue. Ce travail est refait projet après projet, rarement de la même manière.',
          'Le dépôt est ma réponse : un point de départ déjà gréé, que l’on peut cloner ou dont on peut générer un projet nommé à son tour.',
        ],
      },
      {
        paragraphs: [
          'Projet personnel. J’ai défini le découpage, écrit le code, les trois fonctionnalités d’exemple et la documentation, et je le maintiens seul.',
        ],
        bullets: [
          {
            term: 'refus par défaut',
            text: 'un endpoint est protégé tant qu’il ne demande pas explicitement le contraire',
          },
          {
            term: 'RFC 7807',
            text: 'la même forme d’erreur partout, avec un code stable et un traceId',
          },
          {
            term: 'options validées',
            text: 'une configuration fautive arrête l’hôte au démarrage',
          },
          {
            term: 'tests d’architecture',
            text: 'un projet ajouté hors des règles fait échouer la construction',
          },
        ],
      },
      {
        paragraphs: [
          'EF Core ne mappe pas les entités du domaine : il mappe des modèles de persistance, et un convertisseur fait le passage. Cela coûte un objet et un mapper par entité — le compromis est assumé — mais le domaine ne subit plus les contraintes de l’ORM.',
          'Pour que ce coût ne devienne pas une source de bogues silencieux, un test piloté par réflexion échoue dès qu’une propriété ne survit pas à l’aller-retour. La règle n’est pas tenue par la relecture, elle est tenue par la chaîne de vérification.',
        ],
        figure: {
          kind: 'layers',
          layers: [
            {
              name: 'Domain',
              projects: 'AppTemplate.Domain.Core · AppTemplate.Domain',
            },
            {
              name: 'Application',
              projects: 'Application.Core · Application · Application.Auth',
            },
            {
              name: 'Infrastructure',
              projects:
                'Core · Persistence · Auth · Email · Storage · InMemory',
            },
            {
              name: 'Presentation',
              projects: 'Presentation.Core · Api.Core · Api · Worker',
            },
            {
              name: 'Tests',
              projects:
                'miroir 1:1 de Src/, plus Architecture/ et Integration/',
            },
          ],
          caption:
            'Arborescence réelle du dépôt : les tests d’architecture échouent si un projet est ajouté sans que sa place soit décrite.',
        },
      },
      {
        paragraphs: [
          'Ce qui existe : un dépôt public qui se lance en une commande Docker, une documentation par sujet et une chaîne de vérification exécutable depuis un simple clone.',
          'Ce qui n’est pas démontré : aucune mesure de charge, aucun déploiement en production à montrer. Son document de sécurité consacre plus de place à ce qu’un déploiement doit encore faire qu’à ce que le socle fournit.',
        ],
      },
    ],
  },
};
