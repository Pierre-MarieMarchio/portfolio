import { EnvironmentProviders, Provider, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { Observable, of } from 'rxjs';
import { localize } from '@app/core/rules';
import {
  DetailSource,
  FactsSource,
  ProjectCatalog,
  ProjectEntry,
  ProjectSource,
  RankedProject,
} from '@app/features/projects/models';
import { rank } from '@app/features/projects/rules/ranking.rules';
import { provideTexts } from './texts.fixture';
import { ProjectsRepositoryService } from '@app/features/projects/services';
import { ProjectsEffect, ProjectsManager } from '@app/features/projects/states';

export const sampleProject = (
  overrides: Partial<ProjectSource> = {},
): ProjectSource => ({
  slug: 'ngx-statewise',
  title: 'ngx-statewise',
  short: 'ngx-statewise',
  tag: 'open source',
  family: 'personal',
  subject: 'Sample subject.',
  summary: 'sample summary',
  ...overrides,
});

export const sampleFacts = (
  overrides: Partial<FactsSource> = {},
): FactsSource => ({
  proof: 'Sample proof',
  role: 'Sample role',
  stack: 'Sample stack',
  context: 'Personnel',
  period: '2025',
  ...overrides,
});

export const sampleDetail = (
  overrides: Partial<DetailSource> = {},
): DetailSource => ({
  lede: 'Sample lede.',
  links: [],
  chapters: [{ paragraphs: ['Sample paragraph.'] }],
  ...overrides,
});

export const sampleEntry = (
  overrides: {
    project?: Partial<ProjectSource>;
    facts?: Partial<FactsSource>;
    detail?: Partial<DetailSource>;
  } = {},
): ProjectEntry => ({
  project: sampleProject(overrides.project),
  facts: sampleFacts(overrides.facts),
  detail: sampleDetail(overrides.detail),
});

export const sampleRanked = (
  entries: readonly ProjectEntry[],
): RankedProject[] =>
  rank(
    entries.map((entry) => ({
      ...localize(entry.project, 'fr'),
      facts: localize(entry.facts, 'fr'),
    })),
    entries.length,
  );

export const catalogOf = (
  entries: readonly ProjectEntry[],
): ProjectCatalog => ({
  projects: entries.map((entry) => entry.project),
  facts: Object.fromEntries(
    entries.map((entry) => [entry.project.slug, entry.facts]),
  ),
  details: Object.fromEntries(
    entries.map((entry) => [entry.project.slug, entry.detail]),
  ),
});

class RepositoryDouble implements Pick<
  ProjectsRepositoryService,
  'getCatalog'
> {
  public constructor(private readonly entries: readonly ProjectEntry[]) {}

  public getCatalog(): Observable<ProjectCatalog> {
    return of(catalogOf(this.entries));
  }
}

export const provideProjects = (
  entries: readonly ProjectEntry[],
  effects: readonly Type<unknown>[] = [],
): (Provider | EnvironmentProviders)[] => [
  provideStatewise({ effects: [ProjectsEffect, ...effects] }),
  {
    provide: ProjectsRepositoryService,
    useFactory: () => new RepositoryDouble(entries),
  },
  provideTexts(),
];

export const loadProjects = async (): Promise<ProjectsManager> => {
  const manager = TestBed.inject(ProjectsManager);
  await manager.load();
  return manager;
};
