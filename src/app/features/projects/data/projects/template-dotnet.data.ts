import { bilingual, draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

export const TEMPLATE_DOTNET: ProjectEntry = {
  project: {
    slug: 'template-dotnet',
    title: 'Template Clean Architecture .NET',
    short: 'Template .NET',
    tag: 'open source',
    family: 'personal',
    subject: bilingual(
      'Un point de départ pour une API .NET 10 : Clean Architecture, PostgreSQL, authentification JWT complète, erreurs au format RFC 7807.',
      draft(
        'A starting point for a .NET 10 API: Clean Architecture, PostgreSQL, full JWT authentication, RFC 7807 errors.',
      ),
    ),
    summary: bilingual('socle d’API .NET 10', draft('.NET 10 API foundation')),
  },
  facts: {
    proof: bilingual('Code public sur GitHub', draft('Public code on GitHub')),
    role: bilingual('Seul', draft('Alone')),
    stack: '.NET 10 · EF Core · PostgreSQL',
    context: bilingual('Personnel', draft('Personal')),
    period: bilingual('depuis 2025', draft('since 2025')),
  },
  detail: {
    lede: bilingual(
      'De quoi démarrer une API .NET avec l’authentification, les couches et la CI déjà en place.',
      draft(
        'What you need to start a .NET API with authentication, layers and CI already in place.',
      ),
    ),
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
          bilingual(
            'Toute nouvelle API demande la même mise en place : les couches, la base, l’authentification, le format des erreurs, la CI. Ce dépôt la fournit déjà faite.',
            draft(
              'Every new API needs the same setup: layers, database, authentication, error format, CI. This repository ships it ready-made.',
            ),
          ),
        ],
      },
      {
        paragraphs: [
          bilingual(
            'Le code, trois fonctionnalités d’exemple et une documentation par sujet. On peut le cloner tel quel, ou générer un projet à son nom avec dotnet new.',
            draft(
              'The code, three example features and one document per subject. You can clone it as is, or generate a project under your own name with dotnet new.',
            ),
          ),
        ],
        bullets: [
          {
            term: bilingual('refus par défaut', draft('default deny')),
            text: bilingual(
              'un endpoint est protégé sauf s’il dit le contraire',
              draft('an endpoint is protected unless it opts out'),
            ),
          },
          {
            term: 'RFC 7807',
            text: bilingual(
              'la même forme d’erreur partout, avec un code stable',
              draft('the same error shape everywhere, with a stable code'),
            ),
          },
          {
            term: bilingual(
              'configuration vérifiée au démarrage',
              draft('configuration checked at startup'),
            ),
            text: bilingual(
              'une erreur de réglage arrête l’API tout de suite',
              draft('a wrong setting stops the API straight away'),
            ),
          },
          {
            term: bilingual(
              'tests d’architecture',
              draft('architecture tests'),
            ),
            text: bilingual(
              'un projet mal placé fait échouer le build',
              draft('a misplaced project fails the build'),
            ),
          },
        ],
      },
      {
        paragraphs: [
          bilingual(
            'EF Core ne mappe pas les entités du domaine mais des modèles de persistance, et un mapper fait la conversion. Ça coûte une classe de plus par entité. En échange, le domaine ne dépend pas de l’ORM, et un test échoue dès qu’une propriété se perd dans la conversion.',
            draft(
              'EF Core does not map the domain entities but persistence models, and a mapper converts between them. It costs one more class per entity. In exchange, the domain does not depend on the ORM, and a test fails as soon as a property gets lost in the conversion.',
            ),
          ),
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
              projects: bilingual(
                'miroir 1:1 de Src/, plus Architecture/ et Integration/',
                draft(
                  'a 1:1 mirror of Src/, plus Architecture/ and Integration/',
                ),
              ),
            },
          ],
          caption: bilingual(
            'L’arborescence du dépôt. Les tests d’architecture échouent si un projet est ajouté sans que sa place soit décrite.',
            draft(
              'The repository’s tree. The architecture tests fail if a project is added without its place being described.',
            ),
          ),
        },
      },
      {
        paragraphs: [
          bilingual(
            'Le dépôt est public et se lance avec Docker Compose.',
            draft('The repository is public and starts with Docker Compose.'),
          ),
        ],
      },
    ],
  },
};
