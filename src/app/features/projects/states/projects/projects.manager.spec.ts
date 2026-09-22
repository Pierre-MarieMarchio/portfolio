import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import {
  sampleFacts,
  sampleProject,
  sampleSheet,
} from '@testing/fake-managers';
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

  /** Derived from the rank: no flag, so the selection cannot drift from it. */
  it('features the first four projects of the rank order', () => {
    state.projects.set(
      ['a', 'b', 'c', 'd', 'e', 'f'].map((slug) => sampleProject({ slug })),
    );

    expect(manager.featured().map((project) => project.slug)).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });

  it('joins each project to its facts, leaving out one without facts', () => {
    state.projects.set([
      sampleProject({ slug: 'a' }),
      sampleProject({ slug: 'b' }),
    ]);
    state.facts.set({ a: sampleFacts({ proof: 'A proof' }) });

    expect(
      manager.withFacts().map((row) => [row.slug, row.facts.proof]),
    ).toEqual([['a', 'A proof']]);
  });

  it('counts the projects of each family', () => {
    state.projects.set([
      sampleProject({ slug: 'a', family: 'professional' }),
      sampleProject({ slug: 'b', family: 'personal' }),
      sampleProject({ slug: 'c', family: 'professional' }),
    ]);

    expect(manager.familyCounts()).toEqual({ professional: 2, personal: 1 });
  });

  it('reads facts and sheets by slug, null when there is none', () => {
    state.facts.set({ p: sampleFacts({ role: 'Seul' }) });
    state.sheets.set({ p: sampleSheet({ lede: 'Chapô' }) });

    expect(manager.factsOf('p')?.role).toBe('Seul');
    expect(manager.sheetOf('p')?.lede).toBe('Chapô');
    expect(manager.factsOf('missing')).toBeNull();
    expect(manager.sheetOf('missing')).toBeNull();
  });

  it('numbers a project by its place in the rank, 0 when unknown', () => {
    state.projects.set([
      sampleProject({ slug: 'a' }),
      sampleProject({ slug: 'b' }),
    ]);

    expect(manager.rankOf('b')).toBe(2);
    expect(manager.rankOf('missing')).toBe(0);
  });

  it('titles a chapter by its own title, else the default of its place', () => {
    state.defaultChapterTitles.set(['Pourquoi ?', 'Qu’ai-je fait ?']);
    state.sheets.set({
      p: sampleSheet({
        chapters: [
          { paragraphs: [] },
          { title: 'Qu’est-ce qui tient ?', paragraphs: [] },
        ],
      }),
    });

    expect(manager.chapterTitle('p', 0)).toBe('Pourquoi ?');
    expect(manager.chapterTitle('p', 1)).toBe('Qu’est-ce qui tient ?');
    expect(manager.chapterTitle('p', 2)).toBe('');
    expect(manager.chapterTitle('missing', 0)).toBe('');
  });

  /** Derived from the list, so a reload that renamed it shows through. */
  it('finds a project by its slug from the current list', () => {
    state.projects.set([sampleProject({ slug: 'p', title: 'Before' })]);
    expect(manager.find('p')?.title).toBe('Before');

    state.projects.set([sampleProject({ slug: 'p', title: 'After' })]);
    expect(manager.find('p')?.title).toBe('After');
    expect(manager.find('missing')).toBeNull();
  });

  it('loads the shipped catalog, the whole cascade awaited', async () => {
    await manager.load();

    expect(manager.projects()).toHaveLength(7);
    expect(manager.withFacts()).toHaveLength(7);
    expect(manager.sheetOf('skyted-voice')?.title).toBe('Skyted Voice');
    expect(manager.proofLevelLabel('indirect')).toBe('Vérifiable, code privé');
    expect(manager.isLoading()).toBe(false);
  });

  /** One cycle for the whole catalog: nothing shows before the projects do. */
  it('has no facts and no sheet while nothing is loaded', () => {
    expect(manager.projects()).toEqual([]);
    expect(manager.factsOf('skyted-voice')).toBeNull();
    expect(manager.sheetOf('skyted-voice')).toBeNull();
  });
});
