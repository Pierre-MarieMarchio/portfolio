import { computed, signal, WritableSignal } from '@angular/core';
import { Project } from '@app/features/projects/models';

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
 * spec asserts on.
 */

export const sampleProject = (overrides: Partial<Project> = {}): Project => ({
  slug: 'ngx-statewise',
  title: 'ngx-statewise',
  family: 'personal',
  featured: true,
  ...overrides,
});

/* --- Wide: managers -------------------------------------------------------- */

export interface FakeProjectsManager {
  projects: WritableSignal<readonly Project[]>;
  isLoading: WritableSignal<boolean>;
  isError: WritableSignal<boolean>;
  featured: () => readonly Project[];
  find: (slug: string) => Project | null;
  load: () => Promise<void>;
  reset: () => Promise<void>;
  calls: { load: number; reset: number };
}

export const fakeProjectsManager = (
  projects: readonly Project[] = [sampleProject()],
): FakeProjectsManager => {
  const list = signal(projects);
  const calls = { load: 0, reset: 0 };

  return {
    projects: list,
    isLoading: signal(false),
    isError: signal(false),
    featured: computed(() => list().filter((project) => project.featured)),
    find: (slug) => list().find((project) => project.slug === slug) ?? null,
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
