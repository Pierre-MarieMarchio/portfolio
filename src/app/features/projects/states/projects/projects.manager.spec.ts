import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import {
  sampleFacts,
  sampleProject,
  sampleSheet,
} from '@testing/fake-managers';
import { provideTexts } from '@testing/texts';
import { PROJECTS } from '../../data';
import { FEATURED_COUNT, ProjectsManager } from './projects.manager';
import { ProjectsEffect } from './projects.effect';
import { ProjectsState } from './projects.state';

describe('ProjectsManager', () => {
  let manager: ProjectsManager;
  let state: ProjectsState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideStatewise({ effects: [ProjectsEffect] }),
        provideTexts(),
      ],
    });

    state = TestBed.inject(ProjectsState);
    manager = TestBed.inject(ProjectsManager);
  });

  it('exposes its state read-only', () => {
    expect('set' in manager.projects).toBe(false);
    expect('set' in manager.isLoading).toBe(false);
  });

  const SIX = ['a', 'b', 'c', 'd', 'e', 'f'];

  /** Six projects, each with its facts, as a loaded catalog holds them. */
  const setSix = (): void => {
    state.projects.set(SIX.map((slug) => sampleProject({ slug })));
    state.facts.set(
      Object.fromEntries(SIX.map((slug) => [slug, sampleFacts()])),
    );
  };

  /** Derived from the rank: no flag, so the selection cannot drift from it. */
  it('features the first FEATURED_COUNT projects of the rank order', () => {
    setSix();

    expect(manager.featured().map((project) => project.slug)).toEqual(
      SIX.slice(0, FEATURED_COUNT),
    );
    expect(manager.isFeatured('a')).toBe(true);
    expect(manager.isFeatured('f')).toBe(false);
    expect(manager.isFeatured('missing')).toBe(false);
  });

  it('ranks and numbers each project once, from its place in the order', () => {
    setSix();

    expect(
      manager.ranked().map(({ slug, rank, number }) => [slug, rank, number]),
    ).toEqual(SIX.map((slug, rank) => [slug, rank, `0${String(rank + 1)}`]));
  });

  /** A remote catalog lacking some facts draws no blank row, and shifts none. */
  it('leaves out a project without facts, keeping the numbers of the others', () => {
    state.projects.set(['a', 'b', 'c'].map((slug) => sampleProject({ slug })));
    state.facts.set({ a: sampleFacts(), c: sampleFacts() });

    expect(manager.ranked().map(({ slug, number }) => [slug, number])).toEqual([
      ['a', '01'],
      ['c', '03'],
    ]);
  });

  it('leads from each project to the next, wrapping round after the last', () => {
    setSix();

    expect(manager.nextOf('a')?.slug).toBe('b');
    expect(manager.nextOf('f')?.slug).toBe('a');
    expect(manager.nextOf('missing')).toBeNull();
  });

  it('leads nowhere when there is no other project', () => {
    state.projects.set([sampleProject({ slug: 'a' })]);
    state.facts.set({ a: sampleFacts() });

    expect(manager.nextOf('a')).toBeNull();
  });

  it('counts the projects of each family', () => {
    state.projects.set([
      sampleProject({ slug: 'a', family: 'professional' }),
      sampleProject({ slug: 'b', family: 'personal' }),
      sampleProject({ slug: 'c', family: 'professional' }),
    ]);
    state.facts.set({ a: sampleFacts(), b: sampleFacts(), c: sampleFacts() });

    expect(manager.familyCounts()).toEqual({ professional: 2, personal: 1 });
  });

  it('reads facts and sheets by slug, null when there is none', () => {
    state.projects.set([sampleProject({ slug: 'p' })]);
    state.facts.set({ p: sampleFacts({ role: 'Seul' }) });
    state.sheets.set({ p: sampleSheet({ lede: 'Chapô' }) });

    expect(manager.factsOf('p')?.role).toBe('Seul');
    expect(manager.sheetOf('p')?.lede).toBe('Chapô');
    expect(manager.factsOf('missing')).toBeNull();
    expect(manager.sheetOf('missing')).toBeNull();
  });

  /** D5: both languages are in the state; the reader's is a derivation. */
  it('reads a text pair in the reader language', () => {
    state.projects.set([
      sampleProject({ slug: 'p', tag: { fr: 'publié', en: 'published' } }),
    ]);
    state.facts.set({ p: sampleFacts({ role: { fr: 'Seul', en: 'Alone' } }) });

    expect(manager.find('p')?.tag).toBe('publié');
    expect(manager.factsOf('p')?.role).toBe('Seul');
  });

  it('titles a chapter by its own title, else the default of its place', () => {
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
    // Past the chapters of the sheet, the defaults do not stand in.
    expect(manager.chapterTitle('missing', 0)).toBe('');
  });

  /** Derived from the list, so a reload that renamed it shows through. */
  it('finds a project by its slug from the current list', () => {
    state.facts.set({ p: sampleFacts() });
    state.projects.set([sampleProject({ slug: 'p', title: 'Before' })]);
    expect(manager.find('p')?.title).toBe('Before');

    state.projects.set([sampleProject({ slug: 'p', title: 'After' })]);
    expect(manager.find('p')?.title).toBe('After');
    expect(manager.find('missing')).toBeNull();
  });

  it('loads the shipped catalog, the whole cascade awaited', async () => {
    await manager.load();

    expect(manager.projects()).toHaveLength(PROJECTS.length);
    expect(manager.ranked()).toHaveLength(PROJECTS.length);
    expect(manager.sheetOf('skyted-voice')?.chapters.length).toBeGreaterThan(0);
    expect(manager.proofLevelLabel('indirect')).toBe('Vérifiable, code privé');
    expect(manager.find('skyted-voice')?.facts.context).toBe('Skyted');
    expect(manager.isLoading()).toBe(false);
  });

  /** One cycle for the whole catalog: nothing shows before the projects do. */
  it('has no facts and no sheet while nothing is loaded', () => {
    expect(manager.projects()).toEqual([]);
    expect(manager.factsOf('skyted-voice')).toBeNull();
    expect(manager.sheetOf('skyted-voice')).toBeNull();
  });
});
