import { draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

export const TEMPLATE_DOTNET: ProjectEntry = {
  project: {
    slug: 'template-dotnet',
    title: 'Template Clean Architecture .NET',
    short: 'Template .NET',
    tag: 'open source',
    family: 'personal',
    subject: {
      fr: 'Un point de départ pour une API .NET 10 : Clean Architecture, PostgreSQL, authentification JWT complète, erreurs au format RFC 7807.',
      en: draft(
        'A starting point for a .NET 10 API: Clean Architecture, PostgreSQL, full JWT authentication, RFC 7807 errors.',
      ),
    },
    summary: { fr: 'socle d’API .NET 10', en: draft('.NET 10 API foundation') },
  },
  facts: {
    proof: {
      fr: 'Code public sur GitHub',
      en: draft('Public code on GitHub'),
    },
    proofLevel: 'public',
    role: { fr: 'Seul', en: draft('Alone') },
    stack: '.NET 10 · EF Core · PostgreSQL',
    context: { fr: 'Personnel', en: draft('Personal') },
  },
  detail: {
    lede: {
      fr: 'De quoi démarrer une API .NET avec l’authentification, les couches et la CI déjà en place.',
      en: draft(
        'What you need to start a .NET API with authentication, layers and CI already in place.',
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
            fr: 'Toute nouvelle API demande la même mise en place : les couches, la base, l’authentification, le format des erreurs, la CI. Ce dépôt la fournit déjà faite.',
            en: draft(
              'Every new API needs the same setup: layers, database, authentication, error format, CI. This repository ships it ready-made.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'Le code, trois fonctionnalités d’exemple et une documentation par sujet. On peut le cloner tel quel, ou générer un projet à son nom avec dotnet new.',
            en: draft(
              'The code, three example features and one document per subject. You can clone it as is, or generate a project under your own name with dotnet new.',
            ),
          },
        ],
        bullets: [
          {
            term: { fr: 'refus par défaut', en: draft('default deny') },
            text: {
              fr: 'un endpoint est protégé sauf s’il dit le contraire',
              en: draft('an endpoint is protected unless it opts out'),
            },
          },
          {
            term: 'RFC 7807',
            text: {
              fr: 'la même forme d’erreur partout, avec un code stable',
              en: draft('the same error shape everywhere, with a stable code'),
            },
          },
          {
            term: {
              fr: 'configuration vérifiée au démarrage',
              en: draft('configuration checked at startup'),
            },
            text: {
              fr: 'une erreur de réglage arrête l’API tout de suite',
              en: draft('a wrong setting stops the API straight away'),
            },
          },
          {
            term: {
              fr: 'tests d’architecture',
              en: draft('architecture tests'),
            },
            text: {
              fr: 'un projet mal placé fait échouer le build',
              en: draft('a misplaced project fails the build'),
            },
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'EF Core ne mappe pas les entités du domaine mais des modèles de persistance, et un mapper fait la conversion. Ça coûte une classe de plus par entité. En échange, le domaine ne dépend pas de l’ORM, et un test échoue dès qu’une propriété se perd dans la conversion.',
            en: draft(
              'EF Core does not map the domain entities but persistence models, and a mapper converts between them. It costs one more class per entity. In exchange, the domain does not depend on the ORM, and a test fails as soon as a property gets lost in the conversion.',
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
            fr: 'L’arborescence du dépôt. Les tests d’architecture échouent si un projet est ajouté sans que sa place soit décrite.',
            en: draft(
              'The repository’s tree. The architecture tests fail if a project is added without its place being described.',
            ),
          },
        },
      },
      {
        paragraphs: [
          {
            fr: 'Le dépôt est public et se lance avec Docker Compose.',
            en: draft(
              'The repository is public and starts with Docker Compose.',
            ),
          },
        ],
      },
    ],
  },
};
