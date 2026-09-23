import { computed, signal, WritableSignal } from '@angular/core';
import {
  Project,
  ProjectCatalog,
  ProjectFacts,
  ProjectFamily,
  ProjectSheet,
  ProofLevel,
  SheetLayer,
} from '@app/features/projects/models';
import type { ProjectsManager } from '@app/features/projects/states';

/**
 * Two families of doubles, because the application crosses two kinds of
 * boundary.
 *
 * **Narrow doubles** stand in for a port: as small as the port, provided
 * against its token. A spec that needs more than one of these offers has a
 * subject reaching too far. (None yet: `features/common` is empty.)
 *
 * **Wide doubles** stand in for a manager, provided against the class itself,
 * and used by a page. Their signals are writable and they record the calls a
 * spec asserts on. Each one is typed against its manager's public surface: a
 * member added to the manager and forgotten here fails the compilation, not a
 * page spec at run time.
 */

export const sampleProject = (overrides: Partial<Project> = {}): Project => ({
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
  overrides: Partial<ProjectFacts> = {},
): ProjectFacts => ({
  proof: 'Sample proof',
  proofLevel: 'public',
  role: 'Sample role',
  stack: 'Sample stack',
  context: 'Personnel',
  ...overrides,
});

export const sampleSheet = (
  overrides: Partial<ProjectSheet> = {},
): ProjectSheet => ({
  title: 'ngx-statewise',
  lede: 'Sample lede.',
  links: [],
  chapters: [{ paragraphs: ['Sample paragraph.'] }],
  ...overrides,
});

/* --- Wide: managers -------------------------------------------------------- */

type ProjectsManagerSurface = Pick<ProjectsManager, keyof ProjectsManager>;

export interface FakeProjectsManager extends ProjectsManagerSurface {
  projects: WritableSignal<readonly Project[]>;
  layers: WritableSignal<readonly SheetLayer[]>;
  isLoading: WritableSignal<boolean>;
  isError: WritableSignal<boolean>;
  /** Not on the manager: the double's own knobs behind its lookups. */
  facts: WritableSignal<Readonly<Record<string, ProjectFacts>>>;
  sheets: WritableSignal<Readonly<Record<string, ProjectSheet>>>;
  calls: { load: number; reset: number };
}

const FAKE_LEVEL_LABELS: Readonly<Record<ProofLevel, string>> = {
  public: 'Ouvrable par vous',
  indirect: 'Vérifiable, code privé',
  none: 'Sur récit seulement',
};

export const fakeProjectsManager = (
  projects: readonly Project[] = [sampleProject()],
): FakeProjectsManager => {
  const list = signal(projects);
  const facts = signal<Readonly<Record<string, ProjectFacts>>>(
    Object.fromEntries(
      projects.map((project) => [project.slug, sampleFacts()]),
    ),
  );
  const sheets = signal<Readonly<Record<string, ProjectSheet>>>({});
  const calls = { load: 0, reset: 0 };

  return {
    projects: list,
    layers: signal<readonly SheetLayer[]>([]),
    isLoading: signal(false),
    isError: signal(false),
    facts,
    sheets,
    featured: computed(() => list().slice(0, 4)),
    withFacts: computed(() =>
      list().flatMap((project) => {
        const found = facts()[project.slug];
        return found ? [{ ...project, facts: found }] : [];
      }),
    ),
    familyCounts: computed(() => {
      const counts: Record<ProjectFamily, number> = {
        professional: 0,
        personal: 0,
      };
      for (const project of list()) {
        counts[project.family] += 1;
      }
      return counts;
    }),
    find: (slug) => list().find((project) => project.slug === slug) ?? null,
    factsOf: (slug) => facts()[slug] ?? null,
    sheetOf: (slug) => sheets()[slug] ?? null,
    rankOf: (slug) => list().findIndex((project) => project.slug === slug) + 1,
    proofLevelLabel: (level) => FAKE_LEVEL_LABELS[level],
    chapterTitle: (slug, index) => sheets()[slug]?.chapters[index]?.title ?? '',
    load: () => {
      calls.load += 1;
      return Promise.resolve();
    },
    reset: () => {
      calls.reset += 1;
      return Promise.resolve();
    },
    calls,
  };
};

/** A one-project catalog, as the repository would answer it. */
export const sampleCatalog = (): ProjectCatalog => {
  const project = sampleProject();
  return {
    projects: [project],
    facts: { [project.slug]: sampleFacts() },
    sheets: { [project.slug]: sampleSheet() },
    proofLevelLabels: FAKE_LEVEL_LABELS,
    defaultChapterTitles: ['Pourquoi ?'],
    layers: [],
  };
};
