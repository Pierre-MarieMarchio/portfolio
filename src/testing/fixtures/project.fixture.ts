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

/**
 * Two families of doubles, because the application crosses two kinds of
 * boundary.
 *
 * **Narrow doubles** stand in for a port: as small as the port, provided
 * against its token. A spec that needs more than one of these offers has a
 * subject reaching too far. (None yet: `features/common` is empty.)
 *
 * **Managers are never doubled.** A copy of a manager's rules drifts from
 * them: the one that stood here featured `slice(0, 4)` while the manager read
 * `FEATURED`, and ignored the default chapter titles. A spec gets the
 * real manager instead, fed through a double of the repository, which is the
 * seam a remote source would plug into anyway (`provideProjects`).
 */

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
  proofLevel: 'public',
  role: 'Sample role',
  stack: 'Sample stack',
  context: 'Personnel',
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

/** One project as its file writes it: identity, facts and detail. */
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

/** Projects in their places, as the manager ranks them, for a presentational spec. */
export const sampleRanked = (
  entries: readonly ProjectEntry[],
  featuredCount = entries.length,
): RankedProject[] =>
  rank(
    entries.map((entry) => ({
      ...localize(entry.project, 'fr'),
      facts: localize(entry.facts, 'fr'),
    })),
    featuredCount,
  );

/** The catalog the repository answers for these entries. */
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

/** The repository's seam, answering whatever entries the spec sets. */
class RepositoryDouble implements Pick<
  ProjectsRepositoryService,
  'getCatalog'
> {
  public constructor(public entries: readonly ProjectEntry[]) {}

  public getCatalog(): Observable<ProjectCatalog> {
    return of(catalogOf(this.entries));
  }
}

/**
 * The real `ProjectsManager` for a spec, over these entries: the
 * statewise engine with `ProjectsEffect` (and any other effects the spec
 * needs), the repository answering the entries, and the French texts. Call
 * `loadProjects()` before mounting.
 */
export const provideProjects = (
  entries: readonly ProjectEntry[] = [sampleEntry()],
  effects: readonly Type<unknown>[] = [],
): (Provider | EnvironmentProviders)[] => [
  provideStatewise({ effects: [ProjectsEffect, ...effects] }),
  {
    provide: ProjectsRepositoryService,
    useFactory: () => new RepositoryDouble(entries),
  },
  provideTexts(),
];

/**
 * Loads the entries into the real manager, as the app initializer does; with
 * `entries`, the repository answers those from now on, as after a reload.
 */
export const loadProjects = async (
  entries?: readonly ProjectEntry[],
): Promise<ProjectsManager> => {
  const repository = TestBed.inject(ProjectsRepositoryService);
  if (entries && repository instanceof RepositoryDouble) {
    repository.entries = entries;
  }
  const manager = TestBed.inject(ProjectsManager);
  await manager.load();
  return manager;
};
