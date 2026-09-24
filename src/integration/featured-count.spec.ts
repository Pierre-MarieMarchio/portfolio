import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  loadProjects,
  provideProjects,
  sampleEntry,
} from '@testing/fixtures/project.fixture';
import { ProjectEntry } from '@app/features/projects/models';
import { FEATURED } from '@app/features/projects/states';
import { ObservatorySceneComponent } from '@app/features/observatory/components';
import { SpaceSceneComponent } from '@shared/space-scene/components';
import {
  ObservatoryEffect,
  ObservatoryManager,
} from '@app/features/observatory/states';
import { ObservatoryPageComponent } from '@app/pages/observatory/observatory-page.component';

const entries = (count: number): ProjectEntry[] =>
  Array.from({ length: count }, (_, index) =>
    sampleEntry({
      project: {
        slug: `project-${String(index + 1)}`,
        title: `Project ${String(index + 1)}`,
      },
    }),
  );

const mount = async (featured: number, total: number) => {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  document.documentElement.style.setProperty('--arrival-at', '8700ms');
  TestBed.configureTestingModule({
    imports: [ObservatoryPageComponent],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideProjects(entries(total), [ObservatoryEffect]),
      { provide: FEATURED, useValue: featured },
    ],
  });
  await loadProjects();
  const fixture = TestBed.createComponent(ObservatoryPageComponent);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  const object = fixture.debugElement.query(
    (node: DebugElement) =>
      node.componentInstance instanceof ObservatorySceneComponent,
  ).componentInstance as ObservatorySceneComponent;
  const scene = fixture.debugElement.query(
    (node: DebugElement) =>
      node.componentInstance instanceof SpaceSceneComponent,
  ).componentInstance as SpaceSceneComponent;
  return {
    fixture,
    host,
    object,
    scene,
    station: TestBed.inject(ObservatoryManager),
    markers: () => host.querySelectorAll('app-featured-bar li').length,
    choices: () =>
      host.querySelectorAll('[aria-label="Projets mis en avant"] button')
        .length,
  };
};

describe('featured count', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--arrival-at');
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('ships with four', () => {
    expect(TestBed.inject(FEATURED)).toBe(4);
  });

  describe.each([
    [3, 3],
    [3, 12],
    [5, 3],
    [5, 12],
  ])('featuring %i of %i projects', (featured, total) => {
    const shown = Math.min(featured, total);

    it('draws one marker per featured project on the rule', async () => {
      const { markers } = await mount(featured, total);

      expect(markers()).toBe(shown);
    });

    it('tells the object how many it features', async () => {
      const { object } = await mount(featured, total);

      expect(object.featured()).toBe(shown);
    });

    it('offers the featured ones, and only them, in the preview', async () => {
      const { fixture, station, choices } = await mount(featured, total);

      station.openPreview('project-1');
      await fixture.whenStable();

      expect(choices()).toBe(shown);
    });

    it('numbers the featured rows of the index, and them only', async () => {
      const { fixture, station, host } = await mount(featured, total);

      station.syncRoute('index');
      await fixture.whenStable();

      expect(host.querySelectorAll('.number.featured')).toHaveLength(shown);
      expect(host.querySelectorAll('button.row')).toHaveLength(total);
    });
  });

  it('opens no preview for a planet the home page does not feature', async () => {
    const { fixture, station, object } = await mount(3, 12);

    object.bodyClicked.emit('project-6');
    await fixture.whenStable();
    expect(station.preview()).toBeNull();

    object.bodyClicked.emit('project-2');
    await fixture.whenStable();
    expect(station.preview()).toBe('project-2');
  });

  it('shows no preview window for a slug outside the featured ones', async () => {
    const { fixture, station, host } = await mount(3, 12);

    station.openPreview('project-7');
    await fixture.whenStable();

    expect(host.querySelector('app-project-preview .window')).toBeNull();
  });

  it('keeps the object from reading a pinned preview away from home', async () => {
    const { fixture, station, scene } = await mount(3, 12);

    station.openPreview('project-1');
    station.togglePin('preview');
    station.syncRoute('index');
    await fixture.whenStable();

    expect(scene.direction().framing).toEqual({ kind: 'overview' });
  });
});
