import { DebugElement, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import {
  loadProjects,
  provideProjects,
  sampleEntry,
} from '@testing/fixtures/project.fixture';
import { stillObservatory } from '@testing/fixtures/observatory.fixture';
import { componentOf } from '@testing/fixtures/testbed.fixture';
import { ObservatoryEffect } from '@app/features/observatory/states';
import { ObservatoryManager } from '@app/features/observatory/states';
import { ObservatorySceneComponent } from '@app/features/observatory/components';
import { OBSERVATORY_WINDOWS } from '@app/features/observatory/models/observatory.model';
import { LayoutAnchorsService } from '@shared/ui/services';
import { FormatCodeService } from '@app/core/services';
import { loadGlassGestures } from '@shared/windows/directives';
import { AboutWindowComponent } from '@app/features/profile/components/about-window/about-window.component';
import { FeaturedBarComponent } from '@app/features/projects/components';
import { OBSERVATORY_TEXTS } from '@app/features/observatory/ports';
import { PROFILE_TEXTS } from '@app/features/profile/ports';
import { PAGES_TEXTS } from '@app/i18n';
import { SHARED_TEXTS } from '@shared/ui/ports';
import { ObservatoryPageComponent } from './observatory-page.component';

const arrivals = (host: HTMLElement) =>
  ['#home', 'app-main-nav', 'app-featured-bar', 'app-social-links'].map(
    (selector) =>
      host.querySelector<HTMLElement>(selector)?.dataset['arrival'] ?? null,
  );

const sceneOf = (fixture: {
  debugElement: DebugElement;
}): ObservatorySceneComponent =>
  componentOf(fixture, ObservatorySceneComponent);

const isRevealed = (fixture: { debugElement: DebugElement }): boolean =>
  sceneOf(fixture).revealed();

describe('ObservatoryPageComponent', () => {
  const KNOWN_SLUG = 'known-project';

  const ENTRIES = [
    sampleEntry({ project: { slug: KNOWN_SLUG, title: 'Known project' } }),
  ];

  const mount = async (
    options: {
      reducedMotion?: boolean;
      formatCode?: Pick<FormatCodeService, 'load'>;
      address?: string;
    } = {},
  ) => {
    stillObservatory((query) =>
      query === '(prefers-reduced-motion: reduce)'
        ? (options.reducedMotion ?? true)
        : false,
    );
    TestBed.configureTestingModule({
      imports: [ObservatoryPageComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideProjects(ENTRIES, [ObservatoryEffect]),
        options.formatCode
          ? [{ provide: FormatCodeService, useValue: options.formatCode }]
          : [],
      ],
    });
    await loadProjects();

    const station = TestBed.inject(ObservatoryManager);
    if (options.address) {
      await TestBed.inject(Router).navigateByUrl(options.address);
    }
    const fixture = TestBed.createComponent(ObservatoryPageComponent);
    await fixture.whenStable();

    return { fixture, station, host: fixture.nativeElement as HTMLElement };
  };

  afterEach(() => {
    document.documentElement.style.removeProperty('--arrival-at');
    delete document.documentElement.dataset['format'];
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('the arrival of the home page', () => {
    it('holds the rest during the crossing, and lets it in at 8700 ms', async () => {
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

    it('hands the tour over to the reader who points at the orbit rule', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { fixture, station } = await mount({ reducedMotion: false });
      vi.advanceTimersByTime(8700);
      await fixture.whenStable();

      componentOf(fixture, FeaturedBarComponent).hoveredChange.emit(null);
      vi.advanceTimersByTime(4200);
      await fixture.whenStable();

      expect(station.hovered()).toBeNull();
    });

    it('plays the opening card on the home page until the rest is in', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { fixture, host } = await mount({ reducedMotion: false });
      expect(host.querySelector('app-intro-card')).not.toBeNull();

      window.dispatchEvent(new Event('pointerdown'));
      await fixture.whenStable();

      expect(host.querySelector('app-intro-card')).toBeNull();
    });

    it.each([
      ['/projets', 'index'],
      [`/projet/${KNOWN_SLUG}`, 'sheet'],
      ['/a-propos', 'about'],
      ['/en/projects', 'index'],
      ['/en/about', 'about'],
      ['/nowhere', 'not-found'],
    ])(
      'opens %s with everything in and no card, from the first render',
      async (address, view) => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const { fixture, host, station } = await mount({
          reducedMotion: false,
          address,
        });

        expect(station.view()).toBe(view);

        expect(host.querySelector('app-intro-card')).toBeNull();
        expect(
          host.querySelector<HTMLElement>('#home')?.dataset['arrival'],
        ).toBe('shown');
        expect(isRevealed(fixture)).toBe(true);
      },
    );
  });

  it('renders the page bar and the contact rail, with no pause button for now', async () => {
    const { host } = await mount();
    const links = [...host.querySelectorAll('nav a')];
    const words = TestBed.inject(PAGES_TEXTS)().navigation;
    const contact = TestBed.inject(PROFILE_TEXTS)().contact;

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      words.home,
      words.index,
      words.about,
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/projets',
      '/a-propos',
    ]);

    const rail = host.querySelector(
      `ul[aria-label="${TestBed.inject(SHARED_TEXTS)().contactRail.label}"]`,
    );
    for (const label of [contact.email, contact.linkedin, contact.github]) {
      expect(rail?.querySelector(`[aria-label="${label}"]`)).not.toBeNull();
    }
    expect(host.querySelector('app-social-links .links button')).toBeNull();
  });

  it.each([
    ['home', null, '/'],
    ['index', null, '/projets'],
    ['sheet', KNOWN_SLUG, '/projets'],
    ['not-found', null, '/projets'],
    ['about', null, '/a-propos'],
  ] as const)(
    'lights one entry of the page bar on the %s view, the one to %s',
    async (view, slug, href) => {
      const { fixture, station, host } = await mount();

      station.syncRoute(view, slug);
      await fixture.whenStable();
      const current = host.querySelectorAll('nav a[aria-current="page"]');

      expect(current).toHaveLength(1);
      expect(current[0]?.getAttribute('href')).toBe(href);
    },
  );

  it('chooses the section of a figure touched in the sky, as the segmented control does', async () => {
    const { fixture, station } = await mount();
    station.syncRoute('about');
    await fixture.whenStable();
    const scene = componentOf(fixture, ObservatorySceneComponent);

    scene.figureChosen.emit(2);
    await fixture.whenStable();

    const about = componentOf(fixture, AboutWindowComponent);
    expect(station.section()).toBe(2);
    expect(about.part()).toBe(2);
  });

  it('shows the home heading only on the home view', async () => {
    const { fixture, station, host } = await mount();
    expect(host.querySelector('#home-title')?.tagName).toBe('H1');

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

  it('marks a pinned window the reader has left as docked, and brings it back', async () => {
    const { fixture, station, host } = await mount();
    const docked = () =>
      [...host.querySelectorAll<HTMLElement>('[appStackedWindow], .slot')]
        .filter((slot) => slot.dataset['docked'] === 'true')
        .map((slot) => slot.getAttribute('appstackedwindow'));
    station.syncRoute('index');
    station.togglePin('index');

    station.syncRoute('about');
    await fixture.whenStable();
    expect(docked()).toEqual(['index']);
    expect(
      host.querySelector('app-observatory-dock a')?.getAttribute('href'),
    ).toBe('/projets');

    station.syncRoute('index');
    await fixture.whenStable();
    expect(docked()).toEqual([]);
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
    expect(host.querySelector('app-not-found-window')).not.toBeNull();
  });

  it('shows the not-found window on the not-found view too', async () => {
    const { fixture, station, host } = await mount();
    station.syncRoute('not-found');
    await fixture.whenStable();

    expect(host.querySelector('app-not-found-window')).not.toBeNull();
    expect(host.querySelector('app-project-detail')).toBeNull();
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
      TestBed.inject(OBSERVATORY_TEXTS)().home.void,
    );
    expect(button?.getAttribute('tabindex')).toBe('-1');
  });

  it('steps back from the sheet to the list on a click in the void', async () => {
    const { fixture, station, host } = await mount();
    station.syncRoute('sheet', KNOWN_SLUG);
    await fixture.whenStable();

    host.querySelector<HTMLButtonElement>('button.void')?.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/projets');
  });

  it('toggles the selection of a body clicked in the sky of the index', async () => {
    const { fixture, station } = await mount();
    station.syncRoute('index');
    await fixture.whenStable();

    sceneOf(fixture).bodyClicked.emit(KNOWN_SLUG);
    expect(station.selected()).toBe(KNOWN_SLUG);

    sceneOf(fixture).bodyClicked.emit(KNOWN_SLUG);
    expect(station.selected()).toBeNull();
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

  it('lays out one slot per observatory window, in the order of the list', async () => {
    const { host } = await mount();

    const slots = [...host.querySelectorAll<HTMLElement>('.slot')].map((slot) =>
      [...slot.classList]
        .find((name) => name.startsWith('slot--'))
        ?.slice('slot--'.length),
    );

    expect(slots).toEqual([...OBSERVATORY_WINDOWS]);
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

  it('hands the scene the planets, and the slugs of the sheet, the selection, the preview, the hovered body and the designated one', async () => {
    const { fixture, station } = await mount();
    const object = (): ObservatorySceneComponent => sceneOf(fixture);

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
    expect(object().designated()).toBe(KNOWN_SLUG);
    station.openPreview(KNOWN_SLUG);
    await fixture.whenStable();
    expect(object().preview()).toBe(KNOWN_SLUG);
  });

  it('shows the orbit rule on the home view, and gives way to the preview once one is open', async () => {
    const { fixture, station, host } = await mount();
    expect(host.querySelector('app-featured-bar')).not.toBeNull();

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

  it('hands the page navigation to the scene as chrome, for the tabs it becomes on a phone held upright', async () => {
    const { host } = await mount();
    const nav = host.querySelector('app-main-nav');

    expect(nav).not.toBeNull();
    expect(TestBed.inject(LayoutAnchorsService).list('chrome')).toContain(nav);
  });

  it('asks for the code of the glass gestures as it starts, before any window opens', async () => {
    const load = vi.fn(() => signal(null).asReadonly());
    const { host } = await mount({ formatCode: { load } });

    expect(host.querySelector('app-window')).toBeNull();
    expect(load).toHaveBeenCalledWith(['phone'], loadGlassGestures);
  });
});
