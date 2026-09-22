import { Project } from '../models';

/**
 * The projects, in rank order: the order is the distance from the centre in
 * the mockup, and the reading order everywhere else. Filtering never reorders.
 *
 * Content, not data: it ships with the site. Only the repository reads it,
 * so a remote source can replace this file without any other one noticing.
 */
export const PROJECTS: readonly Project[] = [
  {
    slug: 'skyted-voice',
    title: 'Skyted Voice',
    family: 'professional',
    featured: true,
  },
  {
    slug: 'skyted-app',
    title: 'Skyted App',
    family: 'professional',
    featured: true,
  },
  {
    slug: 'ngx-statewise',
    title: 'ngx-statewise',
    family: 'personal',
    featured: true,
  },
  {
    slug: 'template-dotnet',
    title: 'Template .NET',
    family: 'personal',
    featured: true,
  },
  { slug: 'bkone', title: 'Bk-ONE', family: 'professional', featured: false },
  {
    slug: 'skyted-companion',
    title: 'Skyted Companion',
    family: 'professional',
    featured: false,
  },
  { slug: 'speakey', title: 'Speakey', family: 'personal', featured: false },
];
