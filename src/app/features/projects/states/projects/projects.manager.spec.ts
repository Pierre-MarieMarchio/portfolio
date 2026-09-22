import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { sampleProject } from '@testing/fake-managers';
import { ProjectsManager } from './projects.manager';
import { ProjectsEffect } from './projects.effect';
import { ProjectsState } from './projects.state';

describe('ProjectsManager', () => {
  let manager: ProjectsManager;
  let state: ProjectsState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewise({ effects: [ProjectsEffect] })],
    });

    state = TestBed.inject(ProjectsState);
    manager = TestBed.inject(ProjectsManager);
  });

  it('exposes its state read-only', () => {
    expect('set' in manager.projects).toBe(false);
    expect('set' in manager.isLoading).toBe(false);
  });

  it('derives the featured projects, keeping the rank order', () => {
    state.projects.set([
      sampleProject({ slug: 'a', featured: true }),
      sampleProject({ slug: 'b', featured: false }),
      sampleProject({ slug: 'c', featured: true }),
    ]);

    expect(manager.featured().map((project) => project.slug)).toEqual([
      'a',
      'c',
    ]);
  });

  /** Derived from the list, so a reload that renamed it shows through. */
  it('finds a project by its slug from the current list', () => {
    state.projects.set([sampleProject({ slug: 'p', title: 'Before' })]);
    expect(manager.find('p')?.title).toBe('Before');

    state.projects.set([sampleProject({ slug: 'p', title: 'After' })]);
    expect(manager.find('p')?.title).toBe('After');
    expect(manager.find('missing')).toBeNull();
  });

  it('loads the shipped projects, the whole cascade awaited', async () => {
    await manager.load();

    expect(manager.projects().length).toBeGreaterThan(0);
    expect(manager.isLoading()).toBe(false);
  });
});
