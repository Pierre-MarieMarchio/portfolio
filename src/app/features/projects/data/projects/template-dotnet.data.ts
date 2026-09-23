import { draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

/** Template Clean Architecture .NET: identity, facts and detail, in one place. */
export const TEMPLATE_DOTNET: ProjectEntry = {
  project: {
    slug: 'template-dotnet',
    title: 'Template Clean Architecture .NET',
    short: 'Template .NET',
    tag: 'open source',
    family: 'personal',
    subject: {
      fr: 'Un point de départ pour une API HTTP .NET 10 : découpage Clean Architecture, PostgreSQL via EF Core, authentification ASP.NET Identity avec JWT et jetons de rafraîchissement rotatifs, refus par défaut en autorisation, erreurs RFC 7807.',
      en: draft(
        'A starting point for a .NET 10 HTTP API: Clean Architecture layering, PostgreSQL through EF Core, ASP.NET Identity authentication with JWT and rotating refresh tokens, deny-by-default authorisation, RFC 7807 errors.',
      ),
    },
    summary: { fr: 'socle d’API .NET 10', en: draft('.NET 10 API foundation') },
  },
  facts: {
    proof: {
      fr: 'Dépôt public · dotnet new',
      en: draft('Public repository · dotnet new'),
    },
    proofLevel: 'public',
    role: { fr: 'Seul, de bout en bout', en: draft('Alone, end to end') },
    stack: '.NET 10 · EF Core · PostgreSQL',
    context: { fr: 'Personnel', en: draft('Personal') },
  },
  detail: {
    lede: {
      fr: 'Un dépôt de départ pour une API HTTP .NET 10, pour ne pas réécrire chaque fois l’authentification, le découpage en couches et la chaîne de vérification.',
      en: draft(
        'A starter repository for a .NET 10 HTTP API, so as not to rewrite authentication, layering and the verification chain every time.',
      ),
    },
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
          {
            fr: 'Démarrer une API sérieuse demande à chaque fois les mêmes semaines de mise en place : couches, persistance, authentification, format d’erreurs, intégration continue. Ce travail est refait projet après projet, rarement de la même manière.',
            en: draft(
              'Starting a serious API takes the same weeks of set-up every time: layers, persistence, authentication, error format, continuous integration. That work is redone project after project, rarely the same way.',
            ),
          },
          {
            fr: 'Le dépôt est ma réponse : un point de départ déjà gréé, que l’on peut cloner ou dont on peut générer un projet nommé à son tour.',
            en: draft(
              'The repository is my answer: a starting point already rigged, which can be cloned or used to generate a project under a name of one’s own.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'Projet personnel. J’ai défini le découpage, écrit le code, les trois fonctionnalités d’exemple et la documentation, et je le maintiens seul.',
            en: draft(
              'Personal project. I defined the layering, wrote the code, the three example features and the documentation, and I maintain it alone.',
            ),
          },
        ],
        bullets: [
          {
            term: { fr: 'refus par défaut', en: draft('deny by default') },
            text: {
              fr: 'un endpoint est protégé tant qu’il ne demande pas explicitement le contraire',
              en: draft(
                'an endpoint is protected until it explicitly asks otherwise',
              ),
            },
          },
          {
            term: 'RFC 7807',
            text: {
              fr: 'la même forme d’erreur partout, avec un code stable et un traceId',
              en: draft(
                'the same error shape everywhere, with a stable code and a traceId',
              ),
            },
          },
          {
            term: { fr: 'options validées', en: draft('validated options') },
            text: {
              fr: 'une configuration fautive arrête l’hôte au démarrage',
              en: draft('a faulty configuration stops the host at start-up'),
            },
          },
          {
            term: {
              fr: 'tests d’architecture',
              en: draft('architecture tests'),
            },
            text: {
              fr: 'un projet ajouté hors des règles fait échouer la construction',
              en: draft('a project added outside the rules fails the build'),
            },
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'EF Core ne mappe pas les entités du domaine : il mappe des modèles de persistance, et un convertisseur fait le passage. Cela coûte un objet et un mapper par entité — le compromis est assumé — mais le domaine ne subit plus les contraintes de l’ORM.',
            en: draft(
              'EF Core does not map the domain entities: it maps persistence models, and a converter does the crossing. That costs an object and a mapper per entity — the trade-off is accepted — but the domain no longer bears the ORM’s constraints.',
            ),
          },
          {
            fr: 'Pour que ce coût ne devienne pas une source de bogues silencieux, un test piloté par réflexion échoue dès qu’une propriété ne survit pas à l’aller-retour. La règle n’est pas tenue par la relecture, elle est tenue par la chaîne de vérification.',
            en: draft(
              'So that this cost does not become a source of silent bugs, a reflection-driven test fails as soon as a property does not survive the round trip. The rule is not held by review, it is held by the verification chain.',
            ),
          },
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
              projects: {
                fr: 'miroir 1:1 de Src/, plus Architecture/ et Integration/',
                en: draft(
                  'a 1:1 mirror of Src/, plus Architecture/ and Integration/',
                ),
              },
            },
          ],
          caption: {
            fr: 'Arborescence réelle du dépôt : les tests d’architecture échouent si un projet est ajouté sans que sa place soit décrite.',
            en: draft(
              'The repository’s real tree: the architecture tests fail if a project is added without its place being described.',
            ),
          },
        },
      },
      {
        paragraphs: [
          {
            fr: 'Ce qui existe : un dépôt public qui se lance en une commande Docker, une documentation par sujet et une chaîne de vérification exécutable depuis un simple clone.',
            en: draft(
              'What exists: a public repository that starts with one Docker command, documentation by subject and a verification chain that runs from a plain clone.',
            ),
          },
          {
            fr: 'Ce qui n’est pas démontré : aucune mesure de charge, aucun déploiement en production à montrer. Son document de sécurité consacre plus de place à ce qu’un déploiement doit encore faire qu’à ce que le socle fournit.',
            en: draft(
              'What is not shown: no load measurement, no production deployment to show. Its security document gives more room to what a deployment still has to do than to what the foundation provides.',
            ),
          },
        ],
      },
    ],
  },
};
