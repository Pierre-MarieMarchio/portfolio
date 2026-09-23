import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStatewise } from 'ngx-statewise';
import {
  fakeProjectsManager,
  sampleFacts,
  sampleProject,
  sampleSheet,
} from '@testing/fake-managers';
import { ProjectsManager } from '@app/features/projects/states';
import { StationEffect } from '@app/features/station/states';
import { StationManager } from '@app/features/station/states';
import { ObjectComponent } from '@shared/ui/object';
import { StationComponent } from './station.component';

describe('StationComponent', () => {
  const KNOWN_SLUG = 'known-project';

  /** One project the catalog knows, with facts and a sheet to open. */
  const createProjectsManager = () => {
    const manager = fakeProjectsManager([
      sampleProject({ slug: KNOWN_SLUG, title: 'Known project' }),
    ]);
    manager.facts.set({ [KNOWN_SLUG]: sampleFacts() });
    manager.sheets.set({ [KNOWN_SLUG]: sampleSheet() });
    return manager;
  };

  const mount = async (options: { reducedMotion?: boolean } = {}) => {
    // jsdom has no matchMedia: without it the station reads reduced motion,
    // like the prerender. A static answer is enough here.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches:
        query === '(prefers-reduced-motion: reduce)'
          ? (options.reducedMotion ?? true)
          : false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    // jsdom has no 2D context: the object takes its no-canvas fallback, which
    // is what these specs need, without jsdom logging "not implemented".
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    TestBed.configureTestingModule({
      imports: [StationComponent],
      providers: [
        // A catch-all route: the station's step-back effects navigate
        // through the real router, and this keeps it from throwing on an
        // address nothing else declares in this spec.
        provideRouter([{ path: '**', children: [] }]),
        provideStatewise({ effects: [StationEffect] }),
        { provide: ProjectsManager, useValue: createProjectsManager() },
      ],
    });

    const fixture = TestBed.createComponent(StationComponent);
    const station = TestBed.inject(StationManager);
    await fixture.whenStable();

    return { fixture, station, host: fixture.nativeElement as HTMLElement };
  };

  afterEach(() => {
    // A listener added straight on `window` (Escape, pointerdown) outlives
    // the fixture unless the component tears it down; nothing here relies on
    // that beyond one spec, but destroying the fixture keeps every spec
    // starting from a station with no listener left behind.
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('the arrival of the home page', () => {
    const arrivals = (host: HTMLElement) =>
      ['#accueil', 'app-page-bar', 'app-orbit-rule', 'app-contact-rail'].map(
        (selector) =>
          host.querySelector(selector)?.getAttribute('data-arrival') ?? null,
      );
    const revealed = (fixture: { debugElement: DebugElement }): boolean =>
      (
        fixture.debugElement.query(
          (node) => node.componentInstance instanceof ObjectComponent,
        ).componentInstance as ObjectComponent
      ).revealed();

    it('holds the rest during the crossing, and lets it in at 8700 ms', async () => {
      // setTimeout only: the zoneless scheduler runs on microtasks.
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { fixture, host } = await mount({ reducedMotion: false });

      expect(arrivals(host)).toEqual(['held', 'held', 'held', 'held']);
      expect(revealed(fixture)).toBe(false);

      vi.advanceTimersByTime(8699);
      await fixture.whenStable();
      expect(arrivals(host)).toEqual(['held', 'held', 'held', 'held']);

      vi.advanceTimersByTime(1);
      await fixture.whenStable();
      expect(arrivals(host)).toEqual(['shown', 'shown', 'shown', 'shown']);
      expect(revealed(fixture)).toBe(true);
    });

    it.each(['pointerdown', 'keydown', 'wheel', 'touchstart'])(
      'lets the rest in at the first %s',
      async (type) => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const { fixture, host } = await mount({ reducedMotion: false });

        window.dispatchEvent(new Event(type));
        await fixture.whenStable();
        expect(arrivals(host)).toEqual(['shown', 'shown', 'shown', 'shown']);
      },
    );

    it('lets the rest in when the reader leaves the home page', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { fixture, station, host } = await mount({ reducedMotion: false });

      station.navigated('index');
      await fixture.whenStable();
      expect(
        host.querySelector('app-page-bar')?.getAttribute('data-arrival'),
      ).toBe('shown');
    });

    it('shows everything at once with reduced motion', async () => {
      const { fixture, host } = await mount({ reducedMotion: true });

      expect(arrivals(host)).toEqual(['shown', 'shown', 'shown', 'shown']);
      expect(revealed(fixture)).toBe(true);
    });
  });

  it('renders the page bar and the contact rail, with no pause button for now', async () => {
    const { host } = await mount();
    const links = Array.from(host.querySelectorAll('nav a'));

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Accueil',
      'Projets',
      'À propos',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/projets',
      '/a-propos',
    ]);

    const rail = host.querySelector('[aria-label="Me contacter"]');
    expect(
      rail?.querySelector(
        '[aria-label="M’écrire à pierremariemarchio.pro@gmail.com"]',
      ),
    ).not.toBeNull();
    expect(
      rail?.querySelector(
        '[aria-label="Profil LinkedIn de Pierre-Marie Marchio"]',
      ),
    ).not.toBeNull();
    expect(
      rail?.querySelector(
        '[aria-label="Dépôts GitHub de Pierre-Marie Marchio"]',
      ),
    ).not.toBeNull();
    expect(host.querySelector('.rail button')).toBeNull();
  });

  it('lights the home entry on the home view', async () => {
    const { host } = await mount();
    const current = host.querySelectorAll('nav a[aria-current="page"]');

    expect(current).toHaveLength(1);
    expect(current[0]?.textContent?.trim()).toBe('Accueil');
  });

  it('lights the projects entry on index, sheet and not-found', async () => {
    const { fixture, station, host } = await mount();

    for (const [view, slug] of [
      ['index', null],
      ['sheet', KNOWN_SLUG],
      ['not-found', null],
    ] as const) {
      station.navigated(view, slug);
      await fixture.whenStable();
      const current = host.querySelectorAll('nav a[aria-current="page"]');
      expect(current).toHaveLength(1);
      expect(current[0]?.textContent?.trim()).toBe('Projets');
    }
  });

  it('lights the about entry on the about view', async () => {
    const { fixture, station, host } = await mount();
    station.navigated('about');
    await fixture.whenStable();

    const current = host.querySelectorAll('nav a[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent?.trim()).toBe('À propos');
  });

  it('shows the home heading only on the home view', async () => {
    const { fixture, station, host } = await mount();
    expect(host.querySelector('#titre-accueil')?.tagName).toBe('H1');
    expect(host.querySelector('#titre-accueil')?.textContent?.trim()).toBe(
      'Concepteur développeur d’applications',
    );

    station.navigated('about');
    await fixture.whenStable();
    expect(host.querySelector('#titre-accueil')).toBeNull();
  });

  it('shows the project index on its own view, and once pinned elsewhere', async () => {
    const { fixture, station, host } = await mount();
    expect(host.querySelector('app-project-index')).toBeNull();

    station.navigated('index');
    await fixture.whenStable();
    expect(host.querySelector('app-project-index')).not.toBeNull();

    station.togglePin('index');
    station.navigated('home');
    await fixture.whenStable();
    expect(host.querySelector('app-project-index')).not.toBeNull();
  });

  it('shows the sheet for a slug the catalog knows', async () => {
    const { fixture, station, host } = await mount();
    station.navigated('sheet', KNOWN_SLUG);
    await fixture.whenStable();

    expect(host.querySelector('app-project-sheet')).not.toBeNull();
    expect(host.querySelector('app-not-found-window')).toBeNull();
  });

  it('shows the not-found window for an unknown slug, and no sheet', async () => {
    const { fixture, station, host } = await mount();
    station.navigated('sheet', 'ghost-slug');
    await fixture.whenStable();

    expect(host.querySelector('app-project-sheet')).toBeNull();
    const notFound = host.querySelector('app-not-found-window');
    expect(notFound).not.toBeNull();
    expect(notFound?.querySelector('h1')?.textContent?.trim()).toBe(
      'Cette réalisation n’existe pas.',
    );
    const link = notFound?.querySelector('a');
    expect(link?.textContent?.trim()).toBe('Tous les projets →');
    expect(link?.getAttribute('href')).toBe('/projets');
  });

  it('shows the not-found window on the not-found view too', async () => {
    const { fixture, station, host } = await mount();
    station.navigated('not-found');
    await fixture.whenStable();

    expect(host.querySelector('app-not-found-window')).not.toBeNull();
    expect(host.querySelector('app-project-sheet')).toBeNull();
  });

  it('shows the English-is-coming status once EN is clicked, through the station', async () => {
    const { fixture, host } = await mount();
    expect(host.querySelector('[role="status"]')).toBeNull();

    host.querySelector<HTMLButtonElement>('.language button')?.click();
    await fixture.whenStable();

    expect(host.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'textes anglais à venir',
    );
  });

  it('has no void button on the plain home view', async () => {
    const { host } = await mount();
    expect(host.querySelector('button.void')).toBeNull();
  });

  it('shows the void button on the sheet view', async () => {
    const { fixture, station, host } = await mount();
    station.navigated('sheet', KNOWN_SLUG);
    await fixture.whenStable();

    const button = host.querySelector('button.void');
    expect(button?.getAttribute('aria-label')).toBe(
      'Refermer et revenir à la vue d’ensemble',
    );
    expect(button?.getAttribute('tabindex')).toBe('-1');
  });

  it('shows the void button on the home view once a preview is open', async () => {
    const { fixture, station, host } = await mount();
    station.showPreview(KNOWN_SLUG);
    await fixture.whenStable();

    expect(host.querySelector('button.void')).not.toBeNull();
  });

  it('shows the void button on the index view once a row is selected', async () => {
    const { fixture, station, host } = await mount();
    station.navigated('index');
    await fixture.whenStable();
    expect(host.querySelector('button.void')).toBeNull();

    station.select(KNOWN_SLUG);
    await fixture.whenStable();
    expect(host.querySelector('button.void')).not.toBeNull();
  });

  it('clears the index selection on Escape', async () => {
    const { fixture, station } = await mount();
    station.navigated('index');
    station.select(KNOWN_SLUG);
    await fixture.whenStable();
    expect(station.selection()).toBe(KNOWN_SLUG);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(station.selection()).toBeNull();
  });

  it('raises the slot a pointerdown starts on above the others', async () => {
    const { fixture, station, host } = await mount();
    station.togglePin('index');
    station.togglePin('about');
    await fixture.whenStable();

    const slots = Array.from(host.querySelectorAll<HTMLElement>('[data-slot]'));
    expect(slots.length).toBeGreaterThanOrEqual(2);
    const first = slots[0];
    const second = slots[1];
    if (!first || !second) {
      throw new Error('expected at least two slots');
    }

    first.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await fixture.whenStable();
    expect(Number(first.style.zIndex)).toBeGreaterThan(
      Number(second.style.zIndex),
    );

    second.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await fixture.whenStable();
    expect(Number(second.style.zIndex)).toBeGreaterThan(
      Number(first.style.zIndex),
    );
  });
  /** The object knows ranks, the station slugs: the composition translates. */
  it('hands the object the ranks of the sheet, the selection, the preview and the hovered body', async () => {
    const { fixture, station } = await mount();
    const object = (): ObjectComponent => {
      const found = fixture.debugElement.query(
        (node) => node.componentInstance instanceof ObjectComponent,
      );
      if (!found) {
        throw new Error('expected the object to be mounted');
      }
      return found.componentInstance as ObjectComponent;
    };

    station.navigated('sheet', KNOWN_SLUG);
    await fixture.whenStable();
    expect(object().view()).toBe('sheet');
    expect(object().focus()).toBe(0);

    station.navigated('index');
    station.select(KNOWN_SLUG);
    station.hover(KNOWN_SLUG);
    await fixture.whenStable();
    expect(object().selected()).toBe(0);
    expect(object().hovered()).toBe(0);

    station.select(null);
    station.hover('unknown');
    await fixture.whenStable();
    expect(object().selected()).toBe(-1);
    expect(object().hovered()).toBe(-1);

    station.navigated('home');
    station.showPreview(KNOWN_SLUG);
    await fixture.whenStable();
    expect(object().preview()).toBe(0);
  });

  it('shows the orbit rule on the home view with no preview open', async () => {
    const { host } = await mount();
    expect(host.querySelector('app-orbit-rule')).not.toBeNull();
  });

  it('gives way to the preview once one is open, on the home view', async () => {
    const { fixture, station, host } = await mount();
    station.showPreview(KNOWN_SLUG);
    await fixture.whenStable();

    expect(host.querySelector('app-project-preview')).not.toBeNull();
    expect(host.querySelector('app-orbit-rule')).toBeNull();
  });

  it('shows the preview on the index view only once pinned', async () => {
    const { fixture, station, host } = await mount();
    station.navigated('index');
    station.showPreview(KNOWN_SLUG);
    await fixture.whenStable();
    expect(host.querySelector('app-project-preview')).toBeNull();

    station.togglePin('preview');
    await fixture.whenStable();
    expect(host.querySelector('app-project-preview')).not.toBeNull();
  });

  it('names the preview slot with the id the orbit rule points its markers to', async () => {
    const { fixture, station, host } = await mount();
    station.showPreview(KNOWN_SLUG);
    await fixture.whenStable();

    const slot = host.querySelector('#panneau-apercu');
    expect(slot).not.toBeNull();
    expect(slot?.getAttribute('data-slot')).toBe('preview');
  });

  it('keeps the last previewed slug as the reading fallback once the preview closes', async () => {
    const { fixture, station } = await mount();
    station.showPreview(KNOWN_SLUG);
    await fixture.whenStable();
    expect(station.reading()).toBe(KNOWN_SLUG);

    await station.close('preview');
    await fixture.whenStable();

    expect(station.reading()).toBe(KNOWN_SLUG);
  });
});
