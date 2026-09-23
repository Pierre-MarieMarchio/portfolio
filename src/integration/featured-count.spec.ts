import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  loadProjects,
  provideProjects,
  sampleEntry,
} from '@testing/fake-managers';
import { ProjectEntry } from '@app/features/projects/models';
import { FEATURED, FEATURED_COUNT } from '@app/features/projects/states';
import { SpaceSceneComponent } from '@app/features/desktop/components';
import { DesktopEffect, DesktopManager } from '@app/features/desktop/states';
import { StationComponent } from '@app/pages/station/station.component';

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
    imports: [StationComponent],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideProjects(entries(total), [DesktopEffect]),
      { provide: FEATURED, useValue: featured },
    ],
  });
  await loadProjects();
  const fixture = TestBed.createComponent(StationComponent);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  const object = fixture.debugElement.query(
    (node: DebugElement) =>
      node.componentInstance instanceof SpaceSceneComponent,
  ).componentInstance as SpaceSceneComponent;
  return {
    fixture,
    host,
    object,
    station: TestBed.inject(DesktopManager),
    markers: () => host.querySelectorAll('app-orbit-rule li').length,
    choices: () =>
      host.querySelectorAll('[aria-label="Corps en orbite"] button').length,
  };
};

/**
 * The mechanism under test: the number of featured projects is one value
 * (`FEATURED_COUNT`), and the home page follows it everywhere, whatever the
 * size of the catalogue. The value is provided here through `FEATURED`,
 * the token the manager reads it from, at three and five, with three and
 * twelve projects in all.
 */
describe('featured count', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--arrival-at');
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('ships with four', () => {
    expect(FEATURED_COUNT).toBe(4);
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

  /** A body past the featured ones has no place in the preview. */
  it('opens no preview for a planet the home page does not feature', async () => {
    const { fixture, station, object } = await mount(3, 12);

    object.bodyClicked.emit(5);
    await fixture.whenStable();
    expect(station.preview()).toBeNull();

    object.bodyClicked.emit(1);
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
    const { fixture, station, object } = await mount(3, 12);

    station.openPreview('project-1');
    station.togglePin('preview');
    station.syncRoute('index');
    await fixture.whenStable();

    expect(object.preview()).toBe(-1);
  });
});
