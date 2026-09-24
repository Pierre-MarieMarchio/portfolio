import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  Router,
  RouterOutlet,
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
} from '@angular/router';
import { provideStatewise } from 'ngx-statewise';
import { LocaleService } from '@app/core/services';
import { RouteHeadStrategy } from '@app/core/strategies';
import { ProjectsEffect, ProjectsManager } from '@app/features/projects/states';
import {
  ObservatoryEffect,
  ObservatoryManager,
} from '@app/features/observatory/states';
import { CatalogLoaderService, provideI18n, translatePath } from '@app/i18n';
import { ObservatoryPageComponent } from '@app/pages/observatory/observatory-page.component';
import { routes } from '../app/app.routes';

@Component({
  imports: [RouterOutlet, ObservatoryPageComponent],
  template: '<router-outlet /><app-observatory-page />',
})
class Shell {}

const mount = async () => {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  document.documentElement.style.setProperty('--arrival-at', '8700ms');
  TestBed.configureTestingModule({
    imports: [Shell],
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      { provide: TitleStrategy, useClass: RouteHeadStrategy },
      provideStatewise({ effects: [ProjectsEffect, ObservatoryEffect] }),
      provideI18n(),
    ],
  });
  await TestBed.inject(CatalogLoaderService).ensure('fr');
  await TestBed.inject(ProjectsManager).load();
  const fixture = TestBed.createComponent(Shell);
  const router = TestBed.inject(Router);
  const go = async (url: string) => {
    await router.navigateByUrl(url);
    await fixture.whenStable();
  };
  return {
    fixture,
    go,
    host: fixture.nativeElement as HTMLElement,
    station: TestBed.inject(ObservatoryManager),
  };
};

const href = (selector: string) =>
  document.head.querySelector(selector)?.getAttribute('href');

describe('i18n', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--arrival-at');
    document.documentElement.setAttribute('lang', 'fr');
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('speaks French at the root and English under /en, and says so', async () => {
    const { go, host } = await mount();

    await go('/projets');
    expect(document.documentElement.getAttribute('lang')).toBe('fr');
    expect(
      host.querySelector('app-main-nav nav')?.getAttribute('aria-label'),
    ).toBe('Navigation principale');

    await go('/en/projects');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(TestBed.inject(LocaleService).lang()).toBe('en');
    expect(
      host.querySelector('app-main-nav nav')?.getAttribute('aria-label'),
    ).toBe('Main navigation');
    expect(host.querySelector('.window h2')?.textContent?.trim()).toBe(
      'Projects',
    );
  });

  it('keeps the station as it was across the switch', async () => {
    const { go, station } = await mount();
    await go('/projet/ngx-statewise');
    station.togglePin('about');
    station.chooseChapter(2);
    station.hover('speakey');

    await go('/en/project/ngx-statewise');

    expect(station.view()).toBe('sheet');
    expect(station.slug()).toBe('ngx-statewise');
    expect(station.pins().about).toBe(true);
    expect(station.chapter()).toBe(2);
    expect(station.hovered()).toBe('speakey');
    expect(station.visited()).toEqual(['ngx-statewise']);
  });

  it('offers the same page in the other language, from the page bar', async () => {
    const { go, host } = await mount();

    await go('/projet/speakey');
    const english = host.querySelector('app-language-switch a');
    expect(english?.getAttribute('href')).toBe('/en/project/speakey');

    await go('/en/project/speakey');
    const french = host.querySelector('app-language-switch a');
    expect(french?.getAttribute('href')).toBe('/projet/speakey');
    expect(french?.textContent?.trim()).toBe('FR');
  });

  it('names the tab and links the other language in the head', async () => {
    const { go } = await mount();

    await go('/en/about');

    expect(document.title).toBe('About · Pierre-Marie Marchio');
    expect(href('link[rel="canonical"]')).toMatch(/\/en\/about$/);
    expect(href('link[hreflang="fr"]')).toMatch(/\/a-propos$/);
    expect(href('link[hreflang="x-default"]')).toMatch(/\/a-propos$/);
  });

  it.each([
    '/en',
    '/en/projects',
    '/en/about',
    '/en/project/bkone',
    '/en/inconnue',
  ])('shows no French on %s', async (url) => {
    const { go, host } = await mount();

    await go(url);

    const french = /[àâçéèêëîïôûùœ]/i;
    const words = [
      host.textContent ?? '',
      ...[...host.querySelectorAll('[aria-label], [title]')].flatMap(
        (element) =>
          element.getAttribute('lang') === 'fr'
            ? []
            : [
                element.getAttribute('aria-label') ?? '',
                element.getAttribute('title') ?? '',
              ],
      ),
    ]
      .join(' ')
      .replace('Français', '');
    expect(french.exec(words)).toBeNull();
  });
});

describe('translatePath', () => {
  it.each([
    ['/', 'en', '/en'],
    ['/en', 'fr', '/'],
    ['/projets', 'en', '/en/projects'],
    ['/en/projects', 'fr', '/projets'],
    ['/a-propos', 'en', '/en/about'],
    ['/projet/speakey', 'en', '/en/project/speakey'],
    ['/en/project/speakey', 'fr', '/projet/speakey'],
    ['/projets', 'fr', '/projets'],
    ['/inconnue', 'en', '/en/inconnue'],
    ['/en/inconnue', 'fr', '/inconnue'],
    ['/projets?x=1#y', 'en', '/en/projects'],
  ] as const)('reads %s in %s as %s', (url, lang, expected) => {
    expect(translatePath(url, lang)).toBe(expected);
  });
});
