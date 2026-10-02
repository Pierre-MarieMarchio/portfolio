import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import {
  loadProjects,
  provideProjects,
  sampleEntry,
} from '@testing/fixtures/project.fixture';
import { resizeTo } from '@testing/doubles/browser.double';
import { stillObservatory } from '@testing/fixtures/observatory.fixture';
import { componentOf } from '@testing/fixtures/testbed.fixture';
import { SessionHistoryService } from '@app/core/services';
import { ObservatoryEffect } from '@app/features/observatory/states';
import { ObservatoryManager } from '@app/features/observatory/states';
import { ObservatorySceneComponent } from '@app/features/observatory/components';
import { OBSERVATORY_WINDOWS } from '@app/features/observatory/models/observatory.model';
import {
  BottomSheetComponent,
  PagerComponent,
} from '@shared/mobile-nav/components';
import { LayoutAnchorsService } from '@shared/ui/services';
import { AboutWindowComponent } from '@app/features/profile/components/about-window/about-window.component';
import { FeaturedBarComponent } from '@app/features/projects/components';
import { OBSERVATORY_TEXTS } from '@app/features/observatory/ports';
import { MobileNavPlatformService } from '@app/features/observatory/services';
import { PROFILE_TEXTS } from '@app/features/profile/ports';
import { PAGES_TEXTS, ViewLinksService } from '@app/i18n';
import { MOBILE_NAV_PLATFORM } from '@shared/mobile-nav/ports';
import { BackLayersService } from '@shared/mobile-nav/services';
import { SHARED_TEXTS } from '@shared/ui/ports';
import { ObservatoryPageComponent } from './observatory-page.component';

const NOTHING = (): void => {};

const TOUCH = new Set(['(pointer: coarse)', '(hover: none)']);

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

const shownAfterFrames = async (fixture: {
  whenStable: () => Promise<unknown>;
}): Promise<void> => {
  await fixture.whenStable();
  await new Promise((done) => {
    requestAnimationFrame(() => requestAnimationFrame(done));
  });
  await fixture.whenStable();
};

const rankOf =
  (host: HTMLElement) =>
  (name: string): number =>
    Number(
      host
        .querySelector<HTMLElement>(`.slot--${name}`)
        ?.style.getPropertyValue('--stack'),
    );

const openOf = (host: HTMLElement): boolean[] =>
  [...host.querySelectorAll<HTMLElement>('app-main-nav a')].map(
    (a) => a.dataset['open'] !== undefined,
  );

const follows = (first: Element, second: Element): number =>
  first.compareDocumentPosition(second);

describe('ObservatoryPageComponent', () => {
  const KNOWN_SLUG = 'known-project';

  const ENTRIES = [
    sampleEntry({ project: { slug: KNOWN_SLUG, title: 'Known project' } }),
  ];

  const mount = async (
    options: {
      reducedMotion?: boolean;
      address?: string;
      phone?: boolean;
      entries?: typeof ENTRIES;
    } = {},
  ) => {
    stillObservatory((query) =>
      query === '(prefers-reduced-motion: reduce)'
        ? (options.reducedMotion ?? true)
        : (options.phone ?? false) && TOUCH.has(query),
    );
    if (options.phone) {
      resizeTo(412, 915);
    }
    TestBed.configureTestingModule({
      imports: [ObservatoryPageComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideProjects(options.entries ?? ENTRIES, [ObservatoryEffect]),
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

  it('provides the mobile-nav platform and back layers from its own tree, never from the root', async () => {
    const { fixture } = await mount();
    const page = fixture.debugElement.injector;

    expect(() => TestBed.inject(MOBILE_NAV_PLATFORM)).toThrow();
    expect(page.get(MOBILE_NAV_PLATFORM)).toBeInstanceOf(
      MobileNavPlatformService,
    );
    expect(() => TestBed.inject(BackLayersService)).toThrow();
    expect(() => page.get(BackLayersService)).not.toThrow();
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

    it('shows a button to skip the intro only while it is held, reachable before anything else', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { fixture, host } = await mount({ reducedMotion: false });
      const focusables = () =>
        [...host.querySelectorAll<HTMLElement>('button, a[href]')].filter(
          (el) => el.tabIndex >= 0,
        );

      expect(host.querySelector('.skip')?.textContent?.trim()).toBe(
        TestBed.inject(OBSERVATORY_TEXTS)().intro.skip,
      );
      expect(focusables()[0]).toBe(host.querySelector('.skip'));

      window.dispatchEvent(new Event('pointerdown'));
      await fixture.whenStable();

      expect(host.querySelector('.skip')).toBeNull();
    });

    it('skips the intro at once when the button is pressed', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { fixture, host, station } = await mount({
        reducedMotion: false,
      });

      host.querySelector<HTMLButtonElement>('.skip')?.click();
      await fixture.whenStable();

      expect(host.querySelector('.skip')).toBeNull();
      expect(isRevealed(fixture)).toBe(true);
      vi.advanceTimersByTime(4200);
      await fixture.whenStable();
      expect(station.hovered()).toBe(KNOWN_SLUG);
    });

    it('never shows the skip button with reduced motion', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { host } = await mount({ reducedMotion: true });

      expect(host.querySelector('.skip')).toBeNull();
    });

    it('never shows the skip button from a deep link', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { host } = await mount({
        reducedMotion: false,
        address: '/a-propos',
      });

      expect(host.querySelector('.skip')).toBeNull();
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

  it('renders the page bar and the contact rail with its phone menu, with no pause button for now', async () => {
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
    const descriptions = [
      ...(rail?.querySelectorAll('.visually-hidden') ?? []),
    ].map((el) => el.textContent);
    for (const label of [contact.email, contact.linkedin, contact.github]) {
      expect(descriptions).toContain(label);
    }
    expect(
      host.querySelector('app-social-links app-contact-menu dialog'),
    ).not.toBeNull();
    expect(host.querySelector('app-animation-toggle')).toBeNull();
  });

  it('keeps the language switch in the page bar away from the phone', async () => {
    const { host } = await mount();

    expect(host.querySelectorAll('.bar app-language-switch a')).toHaveLength(1);
  });

  it('moves the language out of the page bar and into the last row of the contact menu on the phone', async () => {
    const { host } = await mount({ phone: true });
    const other = TestBed.inject(ViewLinksService)
      .languages()
      .find((language) => !language.current);
    const rows = [...host.querySelectorAll('app-contact-menu .action-row')];
    const last = rows.at(-1);

    expect(host.querySelector('.bar a[hreflang]')).toBeNull();
    expect(last?.getAttribute('href')).toBe(other?.route);
    expect(last?.getAttribute('hreflang')).toBe(other?.lang);
    expect(last?.textContent).toContain(other?.name);
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

  it('keeps a window once shown, hidden and inert away from its view, its h1 turned to an h2', async () => {
    const { fixture, station, host } = await mount();
    station.syncRoute('about');
    await shownAfterFrames(fixture);
    const about = host.querySelector('app-about-window');
    const slot = host.querySelector<HTMLElement>('.slot--about');
    expect(slot?.dataset['shown']).toBe('true');
    expect(host.querySelectorAll('h1')).toHaveLength(1);

    station.syncRoute('home');
    await fixture.whenStable();

    expect(host.querySelector('app-about-window')).toBe(about);
    expect(slot?.dataset['shown']).toBe('false');
    expect(slot?.hasAttribute('inert')).toBe(true);
    expect(slot?.querySelector('h1')).toBeNull();
    expect(slot?.querySelector('h2.landing')).not.toBeNull();
    expect([...host.querySelectorAll('h1')].map((h1) => h1.id)).toEqual([
      'home-title',
    ]);
    expect(TestBed.inject(LayoutAnchorsService).list('panel')).not.toContain(
      slot,
    );

    station.syncRoute('about');
    await shownAfterFrames(fixture);
    expect(host.querySelector('app-about-window')).toBe(about);
    expect(slot?.dataset['shown']).toBe('true');
    expect(slot?.querySelector('h1')).not.toBeNull();
  });

  it('keeps the h1 to the window of the view when another is pinned beside it', async () => {
    const { fixture, station, host } = await mount();
    station.syncRoute('index');
    station.togglePin('index');
    station.syncRoute('about');
    await fixture.whenStable();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.querySelector('.slot--about h1')).not.toBeNull();
    expect(host.querySelector('.slot--index h2.landing')).not.toBeNull();
  });

  it('keeps at most one h1, with the preview open on home, or pinned elsewhere', async () => {
    const { fixture, station, host } = await mount();
    station.openPreview(KNOWN_SLUG);
    await fixture.whenStable();
    expect(host.querySelectorAll('h1')).toHaveLength(1);

    station.togglePin('preview');
    station.syncRoute('index');
    await fixture.whenStable();
    expect(host.querySelectorAll('h1')).toHaveLength(1);

    station.syncRoute('about');
    await fixture.whenStable();
    expect(host.querySelectorAll('h1')).toHaveLength(1);

    station.syncRoute('sheet', KNOWN_SLUG);
    await fixture.whenStable();
    expect(host.querySelectorAll('h1')).toHaveLength(1);
  });

  it('keeps the sheet it last showed, on its chapter, once the reader leaves it', async () => {
    const { fixture, station, host } = await mount();
    station.syncRoute('sheet', KNOWN_SLUG);
    station.chooseChapter(1);
    await fixture.whenStable();
    const detail = host.querySelector('app-project-detail');

    station.syncRoute('index');
    await fixture.whenStable();

    expect(host.querySelector('app-project-detail')).toBe(detail);
    expect(host.querySelector('.slot--sheet h2')?.textContent).toContain(
      'Known project',
    );
    expect(host.querySelector('app-not-found-window')).toBeNull();
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

  it('names each close button after where it leads: the list from the sheet, home from the list, nowhere for a pinned window', async () => {
    const { fixture, station, host } = await mount();
    const { closeTo } = TestBed.inject(OBSERVATORY_TEXTS)();
    const closeOf = (slot: string) =>
      host
        .querySelector(`.slot--${slot} button.close`)
        ?.getAttribute('aria-label');
    station.syncRoute('index');
    station.togglePin('index');
    await fixture.whenStable();
    const onIndex = closeOf('index');

    station.syncRoute('sheet', KNOWN_SLUG);
    await fixture.whenStable();

    expect(onIndex).toBe(closeTo.home);
    expect(closeOf('sheet')).toBe(closeTo.index);
    expect(closeOf('index')).toBe('Fermer la fenêtre');
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

  it('has no void button on the plain home, index, about or sheet view', async () => {
    const { fixture, station, host } = await mount();
    for (const view of ['home', 'index', 'about'] as const) {
      station.syncRoute(view);
      await fixture.whenStable();
      expect(host.querySelector('button.void')).toBeNull();
    }
    station.syncRoute('sheet', KNOWN_SLUG);
    await fixture.whenStable();
    expect(host.querySelector('button.void')).toBeNull();
  });

  it('shows the void button, named after what it closes, once there is something to step back from', async () => {
    const { fixture, station, host } = await mount();
    const { stepBack } = TestBed.inject(OBSERVATORY_TEXTS)();

    station.syncRoute('index');
    station.select(KNOWN_SLUG);
    await fixture.whenStable();
    let button = host.querySelector('button.void');
    expect(button?.getAttribute('aria-label')).toBe(stepBack.deselect);
    expect(button?.getAttribute('tabindex')).toBe('-1');

    station.syncRoute('home');
    station.openPreview(KNOWN_SLUG);
    await fixture.whenStable();
    button = host.querySelector('button.void');
    expect(button?.getAttribute('aria-label')).toBe(stepBack.closePreview);
  });

  it('deselects the index row on a click in the void, never navigating away', async () => {
    const { fixture, station, host } = await mount();
    const before = TestBed.inject(Router).url;
    station.syncRoute('index');
    station.select(KNOWN_SLUG);
    await fixture.whenStable();

    host.querySelector<HTMLButtonElement>('button.void')?.click();
    await fixture.whenStable();

    expect(station.selected()).toBeNull();
    expect(TestBed.inject(Router).url).toBe(before);
  });

  it('shows an overview chip only when the index has a selection, and it deselects', async () => {
    const { fixture, station, host } = await mount();
    const { stepBack } = TestBed.inject(OBSERVATORY_TEXTS)();
    station.syncRoute('index');
    await fixture.whenStable();
    expect(host.querySelector('button.overview')).toBeNull();

    station.select(KNOWN_SLUG);
    await fixture.whenStable();
    const chip = host.querySelector<HTMLButtonElement>('button.overview');
    expect(chip?.textContent?.trim()).toBe(stepBack.overview);

    chip?.click();
    await fixture.whenStable();
    expect(station.selected()).toBeNull();
    expect(host.querySelector('button.overview')).toBeNull();
  });

  it('never shows the overview chip outside the index', async () => {
    const { fixture, station, host } = await mount();
    station.syncRoute('home');
    station.openPreview(KNOWN_SLUG);
    await fixture.whenStable();

    expect(host.querySelector('button.overview')).toBeNull();
  });

  it('leaves the sheet for the list on its title-bar link', async () => {
    const { fixture, station, host } = await mount();
    station.syncRoute('sheet', KNOWN_SLUG);
    await fixture.whenStable();

    host.querySelector<HTMLAnchorElement>('.slot--sheet a.to-index')?.click();
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

  it('does nothing on F6 without a window shown, and focuses its title once one is', async () => {
    const { fixture, station, host } = await mount();
    document.body.append(host);

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'F6', bubbles: true }),
    );
    expect(document.activeElement).toBe(document.body);

    station.syncRoute('about');
    await shownAfterFrames(fixture);

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'F6', bubbles: true }),
    );

    expect(document.activeElement).toBe(
      host.querySelector('.slot--about [data-window-title]'),
    );
    host.remove();
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
    expect(document.activeElement?.closest('.slot')).toBeFalsy();
    await shownAfterFrames(fixture);
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
    const rank = rankOf(host);
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

    expect(host.querySelector('.slot--preview app-window')).not.toBeNull();
    expect(host.querySelector('app-featured-bar')).toBeNull();
  });

  it('shows the preview on the index view only once pinned', async () => {
    const { fixture, station, host } = await mount();
    station.syncRoute('index');
    station.openPreview(KNOWN_SLUG);
    await fixture.whenStable();
    expect(host.querySelector('.slot--preview app-window')).toBeNull();

    station.togglePin('preview');
    await fixture.whenStable();
    expect(host.querySelector('.slot--preview app-window')).not.toBeNull();
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

  describe('the page bar marks the windows shown on screen', () => {
    it('marks Home never, and marks Projets and À propos when their window shows', async () => {
      const { fixture, station, host } = await mount();
      expect(openOf(host)).toEqual([false, false, false]);

      station.syncRoute('index');
      await fixture.whenStable();
      expect(openOf(host)).toEqual([false, true, false]);

      station.togglePin('about');
      station.syncRoute('home');
      await fixture.whenStable();
      expect(openOf(host)).toEqual([false, false, true]);
    });

    it('counts the sheet for Projets, even when the list itself is not kept', async () => {
      const { fixture, station, host } = await mount();
      station.syncRoute('sheet', KNOWN_SLUG);
      await fixture.whenStable();

      expect(openOf(host)).toEqual([false, true, false]);
    });

    it('names an open entry as such, without touching its visible label', async () => {
      const { fixture, station, host } = await mount();
      station.syncRoute('index');
      await fixture.whenStable();
      const [home, projects, about] = [
        ...host.querySelectorAll('app-main-nav a'),
      ];

      expect(home?.getAttribute('aria-label')).toBeNull();
      expect(projects?.getAttribute('aria-label')).toBe(
        'Projets, fenêtre ouverte',
      );
      expect(projects?.textContent?.trim()).toBe('Projets');
      expect(about?.getAttribute('aria-label')).toBeNull();
    });

    it('brings the window a marked entry points to the front, once its page is reached', async () => {
      const { fixture, station, host } = await mount();
      const rank = rankOf(host);
      station.syncRoute('about');
      station.togglePin('about');
      station.syncRoute('index');
      await fixture.whenStable();
      expect(openOf(host)).toEqual([false, true, true]);
      expect(rank('index')).toBeGreaterThan(rank('about'));

      station.syncRoute('about');
      await fixture.whenStable();

      expect(rank('about')).toBeGreaterThan(rank('index'));
    });
  });

  describe('the order of the page', () => {
    it('reaches the page bar, the windows and the rest of the page before the moving planets', async () => {
      const { host } = await mount();
      const bar = host.querySelector('.bar') as Element;
      const about = host.querySelector('.slot--about') as Element;
      const index = host.querySelector('.slot--index') as Element;
      const sheet = host.querySelector('.slot--sheet') as Element;
      const featured = host.querySelector('app-featured-bar') as Element;
      const scene = host.querySelector('app-observatory-scene') as Element;

      for (const before of [bar, about, index, sheet, featured]) {
        expect(follows(before, scene)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      }
    });
  });

  describe('on the phone, the home is one sheet', () => {
    const SLUGS = ['alpha', 'beta', 'gamma'];
    const PHONE_ENTRIES = SLUGS.map((slug) =>
      sampleEntry({ project: { slug, title: `Title ${slug}` } }),
    );

    const mountOnPhone = async (
      options: { reducedMotion?: boolean; address?: string } = {},
    ) => {
      const mounted = await mount({
        ...options,
        phone: true,
        entries: PHONE_ENTRIES,
      });
      const sheet = (): BottomSheetComponent =>
        mounted.fixture.debugElement.query(
          By.css('.slot--home app-bottom-sheet'),
        ).componentInstance as BottomSheetComponent;
      const cards = (): HTMLButtonElement[] => [
        ...mounted.host.querySelectorAll<HTMLButtonElement>(
          '.slot--home app-card-carousel .card',
        ),
      ];
      return { ...mounted, sheet, cards };
    };

    it('holds the line and the cards in a sheet of the same component as the other pages, with the three detents', async () => {
      const { host, sheet } = await mountOnPhone();

      expect(sheet().detents()).toEqual(['folded', 'half', 'full']);
      expect(sheet().detent()).toBe('half');
      const home = host.querySelector('.slot--home');
      expect(
        home?.querySelector('app-home-title h1')?.textContent?.trim(),
      ).toBe('Pierre-Marie Marchio · Développeur .NET et Angular');
      expect(home?.querySelectorAll('app-card-carousel .card')).toHaveLength(3);
    });

    it('draws no separate preview: no slot, no pin, no numbered segments, no position counter', async () => {
      const { fixture, station, host } = await mountOnPhone();
      station.openPreview('beta');
      await fixture.whenStable();

      expect(host.querySelector('.slot--preview')).toBeNull();
      expect(host.querySelector('app-segmented')).toBeNull();
      expect(host.querySelector('app-window .meta')).toBeNull();
      expect(host.querySelector('.slot--home app-window')).toBeNull();
      expect(host.querySelector('.slot--home button[aria-pressed]')).toBeNull();
    });

    it('keeps a single h1, the home line, and no two-line title', async () => {
      const { host } = await mountOnPhone();

      expect([...host.querySelectorAll('h1')].map((h1) => h1.id)).toEqual([
        'home-title',
      ]);
      expect(host.querySelector('app-home-title .name')).toBeNull();
      expect(host.querySelector('.status')).toBeNull();
    });

    it('leaves the home slot on the sheet, for the focus to land in', async () => {
      const { host } = await mountOnPhone();

      expect(host.querySelector('.slot--home')?.querySelector('h1')).toBe(
        host.querySelector('#home-title'),
      );
    });

    it('draws the sheet on the home view only', async () => {
      const { fixture, station, host } = await mountOnPhone();

      station.syncRoute('about');
      await fixture.whenStable();

      expect(host.querySelector('.slot--home')).toBeNull();
      expect(host.querySelectorAll('h1')).toHaveLength(1);
    });

    it('raises the sheet to full on the project of a touched card, and the scene closes in on it', async () => {
      const { fixture, station, host, sheet, cards } = await mountOnPhone();

      cards()[2]?.click();
      await fixture.whenStable();

      expect(station.preview()).toBe('gamma');
      expect(sheet().detent()).toBe('full');
      expect(sceneOf(fixture).preview()).toBe('gamma');
      expect(
        host.querySelector('.slot--home app-pager-page[data-current] h2')
          ?.textContent,
      ).toContain('Title gamma');
    });

    it('raises the sheet to full on the planet touched in the sky', async () => {
      const { fixture, station, sheet } = await mountOnPhone();

      sceneOf(fixture).bodyClicked.emit('beta');
      await fixture.whenStable();

      expect(station.preview()).toBe('beta');
      expect(sheet().detent()).toBe('full');
    });

    it('poses the project the reader stopped on when they pull the sheet up to full', async () => {
      const { fixture, station, sheet } = await mountOnPhone();
      station.hover('beta');

      sheet().detent.set('full');
      await fixture.whenStable();

      expect(station.preview()).toBe('beta');
    });

    it('turns to the neighbour project on a lateral swipe, the card and the scene following', async () => {
      const { fixture, station, host, cards } = await mountOnPhone();
      cards()[0]?.click();
      await fixture.whenStable();
      expect(station.preview()).toBe('alpha');

      componentOf(fixture, PagerComponent).indexChange.emit(1);
      await fixture.whenStable();

      expect(station.preview()).toBe('beta');
      expect(sceneOf(fixture).preview()).toBe('beta');
      expect(
        cards().findIndex((card) => card.hasAttribute('aria-current')),
      ).toBe(1);
      expect(
        host.querySelector('.slot--home app-pager-page[data-current] h2')
          ?.textContent,
      ).toContain('Title beta');
    });

    it('lifts the project when the sheet comes down from full, whatever detent it lands on', async () => {
      const { fixture, station, sheet, cards } = await mountOnPhone();
      cards()[1]?.click();
      await fixture.whenStable();

      sheet().detent.set('half');
      await fixture.whenStable();

      expect(station.preview()).toBeNull();
      expect(sceneOf(fixture).preview()).toBeNull();

      cards()[1]?.click();
      await fixture.whenStable();
      sheet().detent.set('folded');
      await fixture.whenStable();

      expect(station.preview()).toBeNull();
      expect(sheet().detent()).toBe('folded');
    });

    it('has the handle of the other sheets, and no chevron', async () => {
      const { fixture, host, sheet } = await mountOnPhone();
      const grip = host.querySelector<HTMLButtonElement>(
        '.slot--home app-home-title button.grip',
      );

      expect(grip?.getAttribute('aria-label')).toBe('Baisser la fenêtre');
      expect(grip?.getAttribute('aria-expanded')).toBe('true');
      expect(host.querySelector('.slot--home .fold')).toBeNull();
      expect(host.querySelector('.slot--home app-home-title svg')).toBeNull();

      const toggle = vi.spyOn(sheet(), 'toggle');

      grip?.click();
      expect(toggle).toHaveBeenCalledOnce();

      sheet().detent.set('folded');
      await fixture.whenStable();

      expect(grip?.getAttribute('aria-label')).toBe('Remonter la fenêtre');
      expect(grip?.getAttribute('aria-expanded')).toBe('false');
    });

    it('says the posed project among the featured ones with dots under the preview, and follows the swipe', async () => {
      const { fixture, host, cards } = await mountOnPhone();
      const dots = (): HTMLButtonElement[] => [
        ...host.querySelectorAll<HTMLButtonElement>(
          '.slot--home app-pager ~ app-pager-dots .dot',
        ),
      ];
      const current = (): number =>
        dots().findIndex((dot) => dot.hasAttribute('aria-current'));

      expect(dots()).toHaveLength(3);
      cards()[1]?.click();
      await fixture.whenStable();
      expect(current()).toBe(1);

      componentOf(fixture, PagerComponent).shownChange.emit(2);
      await fixture.whenStable();

      expect(current()).toBe(2);
      expect(dots().every((dot) => dot.tabIndex === -1)).toBe(true);
      expect(dots().map((dot) => dot.getAttribute('aria-label'))).toEqual([
        'Page 1 sur 3',
        'Page 2 sur 3',
        'Page 3 sur 3',
      ]);
    });

    it('leads to a project when its dot is touched, the card and the scene following', async () => {
      const { fixture, station, host, sheet, cards } = await mountOnPhone();
      cards()[0]?.click();
      await fixture.whenStable();

      host
        .querySelectorAll<HTMLButtonElement>(
          '.slot--home app-pager ~ app-pager-dots .dot',
        )[2]
        ?.click();
      await fixture.whenStable();

      expect(station.preview()).toBe('gamma');
      expect(sceneOf(fixture).preview()).toBe('gamma');
      expect(sheet().detent()).toBe('full');
      expect(
        cards().findIndex((card) => card.hasAttribute('aria-current')),
      ).toBe(2);
    });

    it('comes down to half on the system back from full, and lifts the project', async () => {
      vi.spyOn(
        SessionHistoryService.prototype,
        'hasCloseWatcher',
      ).mockReturnValue(true);
      const back: (() => void)[] = [];
      vi.spyOn(
        SessionHistoryService.prototype,
        'watchClose',
      ).mockImplementation((fn) => {
        back.push(fn);
        return NOTHING;
      });
      const { fixture, station, sheet, cards } = await mountOnPhone();
      cards()[1]?.click();
      await fixture.whenStable();
      expect(sheet().detent()).toBe('full');

      back.at(-1)?.();
      await fixture.whenStable();

      expect(sheet().detent()).toBe('half');
      expect(station.preview()).toBeNull();
    });

    it('lowers the sheet to half when the sky is touched or escape is pressed', async () => {
      const { fixture, station, sheet, cards } = await mountOnPhone();
      cards()[1]?.click();
      await fixture.whenStable();

      await station.stepBack();
      await fixture.whenStable();

      expect(sheet().detent()).toBe('half');
      expect(station.preview()).toBeNull();
    });

    it('shows the cards at half and the project at full, hiding the other from the tree', async () => {
      const { fixture, host, cards } = await mountOnPhone();
      const layers = (): boolean[] =>
        [...host.querySelectorAll<HTMLElement>('.slot--home .layer')].map(
          (layer) => layer.inert,
        );
      expect(layers()).toEqual([false, true]);

      cards()[0]?.click();
      await fixture.whenStable();

      expect(layers()).toEqual([true, false]);
    });

    it('points the cards to the layer that holds the project', async () => {
      const { host, cards } = await mountOnPhone();

      const layer = host.querySelector('.slot--home .layer:last-child');
      expect(layer?.id).toBe('preview-panel');
      expect(cards().map((card) => card.getAttribute('aria-controls'))).toEqual(
        ['preview-panel', 'preview-panel', 'preview-panel'],
      );
    });

    it('anchors the scene on the cards at half and on the project at full', async () => {
      const { fixture, host, cards } = await mountOnPhone();
      const home = host.querySelector<HTMLElement>('.slot--home');
      expect(home?.dataset['panel']).toBe('rule');

      cards()[0]?.click();
      await fixture.whenStable();

      expect(home?.dataset['panel']).toBe('preview');
    });

    it('keeps the sheet held and inert while the intro plays, and lets it in with the rest', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { fixture, host } = await mountOnPhone({ reducedMotion: false });
      const surface = host.querySelector<HTMLElement>('.slot--home .home');
      expect(surface?.dataset['arrival']).toBe('held');
      expect(surface?.inert).toBe(true);

      vi.advanceTimersByTime(8700);
      await fixture.whenStable();

      expect(surface?.dataset['arrival']).toBe('shown');
      expect(surface?.inert).toBe(false);
    });

    it('draws the desktop home unchanged: the title, the rule, and the preview slot', async () => {
      const { fixture, station, host } = await mount({
        entries: PHONE_ENTRIES,
      });

      expect(host.querySelector('.slot--home')).toBeNull();
      expect(host.querySelector('app-home-title .name')).not.toBeNull();
      station.openPreview('beta');
      await fixture.whenStable();
      expect(host.querySelector('.slot--preview app-window')).not.toBeNull();
    });
  });
});
