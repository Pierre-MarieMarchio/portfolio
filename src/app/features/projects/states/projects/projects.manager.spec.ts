import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import {
  sampleDetail,
  sampleFacts,
  sampleProject,
} from '@testing/fixtures/project.fixture';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { PROJECTS } from '../../data';
import { PROJECTS_TEXTS } from '../../ports';
import { proofLevelLabel } from '../../rules/project-labels.rules';
import { FEATURED, ProjectsManager } from './projects.manager';
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
    expect('set' in manager.ranked).toBe(false);
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
  it('features the first FEATURED projects of the rank order', () => {
    setSix();

    expect(manager.featured().map((project) => project.slug)).toEqual(
      SIX.slice(0, TestBed.inject(FEATURED)),
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

  it('reads facts and details by slug, null when there is none', () => {
    state.projects.set([sampleProject({ slug: 'p' })]);
    state.facts.set({ p: sampleFacts({ role: 'Seul' }) });
    state.details.set({ p: sampleDetail({ lede: 'Chapô' }) });

    expect(manager.find('p')?.facts.role).toBe('Seul');
    expect(manager.detailOf('p')?.lede).toBe('Chapô');
    expect(manager.find('missing')?.facts ?? null).toBeNull();
    expect(manager.detailOf('missing')).toBeNull();
  });

  /** D5: both languages are in the state; the reader's is a derivation. */
  it('reads a text pair in the reader language', () => {
    state.projects.set([
      sampleProject({ slug: 'p', tag: { fr: 'publié', en: 'published' } }),
    ]);
    state.facts.set({ p: sampleFacts({ role: { fr: 'Seul', en: 'Alone' } }) });

    expect(manager.find('p')?.tag).toBe('publié');
    expect(manager.find('p')?.facts.role).toBe('Seul');
  });

  it('finds a project in a language other than the reader one', () => {
    state.projects.set([
      sampleProject({
        slug: 'p',
        subject: { fr: 'Un module bancaire.', en: 'A banking module.' },
      }),
    ]);
    state.facts.set({ p: sampleFacts({ role: { fr: 'Seul', en: 'Alone' } }) });

    expect(manager.find('p')?.subject).toBe('Un module bancaire.');
    expect(manager.findIn('p', 'en')?.subject).toBe('A banking module.');
    expect(manager.findIn('p', 'en')?.facts.role).toBe('Alone');
    expect(manager.findIn('missing', 'en')).toBeNull();
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
    expect(manager.detailOf('skyted-voice')?.chapters.length).toBeGreaterThan(
      0,
    );
    expect(
      proofLevelLabel('indirect', TestBed.inject(PROJECTS_TEXTS)().proofLevels),
    ).toBe('Vérifiable, code privé');
    expect(manager.find('skyted-voice')?.facts.context).toBe('Skyted');
    expect(state.isLoading()).toBe(false);
  });

  /** One cycle for the whole catalog: nothing shows before the projects do. */
  it('has no facts and no detail while nothing is loaded', () => {
    expect(manager.projects()).toEqual([]);
    expect(manager.find('skyted-voice')?.facts ?? null).toBeNull();
    expect(manager.detailOf('skyted-voice')).toBeNull();
  });
});
