import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  loadProjects,
  provideProjects,
  sampleEntry,
} from '@testing/fixtures/project.fixture';
import { DesktopEffect } from '@app/features/desktop/states';
import { DesktopManager } from '@app/features/desktop/states';
import { DesktopSceneComponent } from '@app/features/desktop/components';
import { DESKTOP_WINDOWS } from '@app/features/desktop/models/desktop.model';
import { DesktopPageComponent } from './desktop-page.component';

const arrivals = (host: HTMLElement) =>
  ['#home', 'app-main-nav', 'app-featured-bar', 'app-social-links'].map(
    (selector) =>
      host.querySelector<HTMLElement>(selector)?.dataset['arrival'] ?? null,
  );

const isRevealed = (fixture: { debugElement: DebugElement }): boolean =>
  (
    fixture.debugElement.query(
      (node) => node.componentInstance instanceof DesktopSceneComponent,
    ).componentInstance as DesktopSceneComponent
  ).revealed();

describe('StationComponent', () => {
  const KNOWN_SLUG = 'known-project';

  /** One project the catalog knows, with facts and a sheet to open. */
  const ENTRIES = [
    sampleEntry({ project: { slug: KNOWN_SLUG, title: 'Known project' } }),
  ];

  const mount = async (options: { reducedMotion?: boolean } = {}) => {
    // jsdom has no matchMedia: without it the station reads reduced motion,
    // like the prerender. A static answer is enough here.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches:
        query === '(prefers-reduced-motion: reduce)'
          ? (options.reducedMotion ?? true)
          : false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    // jsdom has no 2D context: the object takes its no-canvas fallback, which
    // is what these specs need, without jsdom logging "not implemented".
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    // The global stylesheet is not loaded here: the crossing's length, which
    // the arrival reads from the CSS, is set by hand as `_tokens.scss` does.
    document.documentElement.style.setProperty('--arrival-at', '8700ms');
    TestBed.configureTestingModule({
      imports: [DesktopPageComponent],
      providers: [
        // A catch-all route: the station's step-back effects navigate
        // through the real router, and this keeps it from throwing on an
        // address nothing else declares in this spec.
        provideRouter([{ path: '**', children: [] }]),
        provideProjects(ENTRIES, [DesktopEffect]),
      ],
    });
    await loadProjects();

    const fixture = TestBed.createComponent(DesktopPageComponent);
    const station = TestBed.inject(DesktopManager);
    await fixture.whenStable();

    return { fixture, station, host: fixture.nativeElement as HTMLElement };
  };

  afterEach(() => {
    // A listener added straight on `window` (Escape, pointerdown) outlives
    // the fixture unless the component tears it down; nothing here relies on
    // that beyond one spec, but destroying the fixture keeps every spec
    // starting from a station with no listener left behind.
    document.documentElement.style.removeProperty('--arrival-at');
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('the arrival of the home page', () => {
    it('holds the rest during the crossing, and lets it in at 8700 ms', async () => {
      // setTimeout only: the zoneless scheduler runs on microtasks.
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { fixture, host } = await mount({ reducedMotion: false });

      expect(arrivals(host)).toEqual(['held', 'held', 'held', 'held']);
      expect(isRevealed(fixture)).toBe(false);

      vi.advanceTimersByTime(8699);
      await fixture.whenStable();
      expect(arrivals(host)).toEqual(['held', 'held', 'held', 'held']);

      vi.advanceTimersByTime(1);
      await fixture.whenStable();
      expect(arrivals(host)).toEqual(['shown', 'shown', 'shown', 'shown']);
      expect(isRevealed(fixture)).toBe(true);
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

      station.syncRoute('index');
      await fixture.whenStable();
      expect(
        host.querySelector<HTMLElement>('app-main-nav')?.dataset['arrival'],
      ).toBe('shown');
    });

    it('plays the featured tour over the featured slugs once the rest is in', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { fixture, station } = await mount({ reducedMotion: false });

      vi.advanceTimersByTime(8700);
      await fixture.whenStable();
      expect(station.hovered()).toBeNull();

      vi.advanceTimersByTime(4200);
      await fixture.whenStable();
      expect(station.hovered()).toBe(KNOWN_SLUG);
    });

    it('shows everything at once with reduced motion', async () => {
      const { fixture, host } = await mount({ reducedMotion: true });

      expect(arrivals(host)).toEqual(['shown', 'shown', 'shown', 'shown']);
      expect(isRevealed(fixture)).toBe(true);
    });
  });

  it('renders the page bar and the contact rail, with no pause button for now', async () => {
    const { host } = await mount();
    const links = [...host.querySelectorAll('nav a')];

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
      station.syncRoute(view, slug);
      await fixture.whenStable();
      const current = host.querySelectorAll('nav a[aria-current="page"]');
      expect(current).toHaveLength(1);
      expect(current[0]?.textContent?.trim()).toBe('Projets');
    }
  });

  it('lights the about entry on the about view', async () => {
    const { fixture, station, host } = await mount();
    station.syncRoute('about');
    await fixture.whenStable();

    const current = host.querySelectorAll('nav a[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent?.trim()).toBe('À propos');
  });

  it('shows the home heading only on the home view', async () => {
    const { fixture, station, host } = await mount();
    expect(host.querySelector('#home-title')?.tagName).toBe('H1');
    expect(host.querySelector('#home-title')?.textContent?.trim()).toBe(
      'Concepteur développeur d’applications',
    );

    station.syncRoute('about');
    await fixture.whenStable();
    expect(host.querySelector('#home-title')).toBeNull();
  });

  it('shows the project index on its own view, and once pinned elsewhere', async () => {
    const { fixture, station, host } = await mount();
    expect(host.querySelector('app-project-list')).toBeNull();

    station.syncRoute('index');
    await fixture.whenStable();
    expect(host.querySelector('app-project-list')).not.toBeNull();

    station.togglePin('index');
    station.syncRoute('home');
    await fixture.whenStable();
    expect(host.querySelector('app-project-list')).not.toBeNull();
  });

  it('shows the sheet for a slug the catalog knows', async () => {
    const { fixture, station, host } = await mount();
    station.syncRoute('sheet', KNOWN_SLUG);
    await fixture.whenStable();

    expect(host.querySelector('app-project-detail')).not.toBeNull();
    expect(host.querySelector('app-not-found-window')).toBeNull();
  });

  it('shows the not-found window for an unknown slug, and no sheet', async () => {
    const { fixture, station, host } = await mount();
    station.syncRoute('sheet', 'ghost-slug');
    await fixture.whenStable();

    expect(host.querySelector('app-project-detail')).toBeNull();
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
    station.syncRoute('not-found');
    await fixture.whenStable();

    expect(host.querySelector('app-not-found-window')).not.toBeNull();
    expect(host.querySelector('app-project-detail')).toBeNull();
  });

  /** D3: the switch is a link to the same page in the other language. */
  it('offers the same view in English from the page bar', async () => {
    const { fixture, station, host } = await mount();

    station.syncRoute('index');
    await fixture.whenStable();

    const english = host.querySelector('app-language-switch a');
    expect(english?.textContent?.trim()).toBe('EN');
    expect(english?.getAttribute('hreflang')).toBe('en');
  });

  it('has no void button on the plain home view', async () => {
    const { host } = await mount();
    expect(host.querySelector('button.void')).toBeNull();
  });

  it('shows the void button on the sheet view', async () => {
    const { fixture, station, host } = await mount();
    station.syncRoute('sheet', KNOWN_SLUG);
    await fixture.whenStable();

    const button = host.querySelector('button.void');
    expect(button?.getAttribute('aria-label')).toBe(
      'Refermer et revenir à la vue d’ensemble',
    );
    expect(button?.getAttribute('tabindex')).toBe('-1');
  });

  it('shows the void button on the home view once a preview is open', async () => {
    const { fixture, station, host } = await mount();
    station.openPreview(KNOWN_SLUG);
    await fixture.whenStable();

    expect(host.querySelector('button.void')).not.toBeNull();
  });

  it('shows the void button on the index view once a row is selected', async () => {
    const { fixture, station, host } = await mount();
    station.syncRoute('index');
    await fixture.whenStable();
    expect(host.querySelector('button.void')).toBeNull();

    station.select(KNOWN_SLUG);
    await fixture.whenStable();
    expect(host.querySelector('button.void')).not.toBeNull();
  });

  it('clears the index selection on Escape', async () => {
    const { fixture, station } = await mount();
    station.syncRoute('index');
    station.select(KNOWN_SLUG);
    await fixture.whenStable();
    expect(station.selected()).toBe(KNOWN_SLUG);

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await fixture.whenStable();

    expect(station.selected()).toBeNull();
  });

  /** D6: the first load leaves the focus where a reader expects to start. */
  it('leaves the focus alone on the first load', async () => {
    const { fixture, host } = await mount();
    document.body.append(host);
    await fixture.whenStable();

    expect(document.activeElement).toBe(document.body);
    host.remove();
  });

  it('moves the focus to the view heading after a navigation', async () => {
    const { fixture, station, host } = await mount();
    document.body.append(host);

    station.syncRoute('about');
    await fixture.whenStable();
    expect(document.activeElement?.closest('.slot')).toBe(
      host.querySelector('.slot--about'),
    );
    expect(document.activeElement?.tagName).toBe('H1');

    station.syncRoute('home');
    await fixture.whenStable();
    expect(document.activeElement?.id).toBe('home-title');
    host.remove();
  });

  it('lays out one slot per desktop window, in the order of the list', async () => {
    const { host } = await mount();

    const slots = [...host.querySelectorAll<HTMLElement>('.slot')].map((slot) =>
      [...slot.classList]
        .find((name) => name.startsWith('slot--'))
        ?.slice('slot--'.length),
    );

    expect(slots).toEqual([...DESKTOP_WINDOWS]);
  });

  it('raises the slot a pointerdown starts on above the others', async () => {
    const { fixture, station, host } = await mount();
    station.togglePin('index');
    station.togglePin('about');
    await fixture.whenStable();

    const slots = [...host.querySelectorAll<HTMLElement>('.slot')];
    expect(slots.length).toBeGreaterThanOrEqual(2);
    const first = slots[0];
    const second = slots[1];
    if (!first || !second) {
      throw new Error('expected at least two slots');
    }

    const rank = (slot: HTMLElement): number =>
      Number(slot.style.getPropertyValue('--stack'));

    first.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await fixture.whenStable();
    expect(rank(first)).toBeGreaterThan(rank(second));

    second.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await fixture.whenStable();
    expect(rank(second)).toBeGreaterThan(rank(first));
  });

  it('brings the window of the view to the front at each navigation, from one sheet to the next too', async () => {
    const { fixture, station, host } = await mount();
    const rank = (name: string): number =>
      Number(
        host
          .querySelector<HTMLElement>(`.slot--${name}`)
          ?.style.getPropertyValue('--stack'),
      );
    station.togglePin('index');
    station.syncRoute('sheet', KNOWN_SLUG);
    await fixture.whenStable();
    expect(rank('sheet')).toBeGreaterThan(rank('index'));

    host
      .querySelector('.slot--index')
      ?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await fixture.whenStable();
    expect(rank('index')).toBeGreaterThan(rank('sheet'));

    station.syncRoute('sheet', 'ghost-slug');
    await fixture.whenStable();
    expect(rank('sheet')).toBeGreaterThan(rank('index'));
  });
  /** The scene reads slugs: the page hands it the station's own. */
  it('hands the scene the planets, and the slugs of the sheet, the selection, the preview and the hovered body', async () => {
    const { fixture, station } = await mount();
    const object = (): DesktopSceneComponent => {
      const found = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DesktopSceneComponent,
      );
      if (!found) {
        throw new Error('expected the object to be mounted');
      }
      return found.componentInstance as DesktopSceneComponent;
    };

    expect(object().bodies()).toEqual([
      { slug: KNOWN_SLUG, title: 'Known project', short: 'ngx-statewise' },
    ]);

    station.syncRoute('sheet', KNOWN_SLUG);
    await fixture.whenStable();
    expect(object().view()).toBe('sheet');
    expect(object().sheet()).toBe(KNOWN_SLUG);

    station.syncRoute('index');
    station.select(KNOWN_SLUG);
    station.hover(KNOWN_SLUG);
    await fixture.whenStable();
    expect(object().selected()).toBe(KNOWN_SLUG);
    expect(object().hovered()).toBe(KNOWN_SLUG);

    station.select(null);
    station.hover(null);
    await fixture.whenStable();
    expect(object().selected()).toBeNull();
    expect(object().hovered()).toBeNull();

    station.syncRoute('home');
    station.openPreview(KNOWN_SLUG);
    await fixture.whenStable();
    expect(object().preview()).toBe(KNOWN_SLUG);
  });

  it('shows the orbit rule on the home view with no preview open', async () => {
    const { host } = await mount();
    expect(host.querySelector('app-featured-bar')).not.toBeNull();
  });

  it('gives way to the preview once one is open, on the home view', async () => {
    const { fixture, station, host } = await mount();
    station.openPreview(KNOWN_SLUG);
    await fixture.whenStable();

    expect(host.querySelector('app-project-preview')).not.toBeNull();
    expect(host.querySelector('app-featured-bar')).toBeNull();
  });

  it('shows the preview on the index view only once pinned', async () => {
    const { fixture, station, host } = await mount();
    station.syncRoute('index');
    station.openPreview(KNOWN_SLUG);
    await fixture.whenStable();
    expect(host.querySelector('app-project-preview')).toBeNull();

    station.togglePin('preview');
    await fixture.whenStable();
    expect(host.querySelector('app-project-preview')).not.toBeNull();
  });

  it('names the preview slot with the id the orbit rule points its markers to', async () => {
    const { fixture, station, host } = await mount();
    station.openPreview(KNOWN_SLUG);
    await fixture.whenStable();

    const slot = host.querySelector<HTMLElement>('#preview-panel');
    expect(slot).not.toBeNull();
    expect(slot?.classList.contains('slot--preview')).toBe(true);
  });

  it('keeps the last previewed slug as the reading fallback once the preview closes', async () => {
    const { fixture, station } = await mount();
    station.openPreview(KNOWN_SLUG);
    await fixture.whenStable();
    expect(station.lastPreview()).toBe(KNOWN_SLUG);

    await station.close('preview');
    await fixture.whenStable();

    expect(station.lastPreview()).toBe(KNOWN_SLUG);
  });
});
