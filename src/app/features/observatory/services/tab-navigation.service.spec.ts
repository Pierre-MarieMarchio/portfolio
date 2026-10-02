import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NavigationSkipped,
  NavigationSkippedCode,
  Router,
} from '@angular/router';
import { Subject } from 'rxjs';
import { provideStatewise } from 'ngx-statewise';
import {
  provideSessionHistoryDouble,
  SessionHistoryDouble,
} from '@testing/doubles/session-history.double';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import type { ObservatoryWindow } from '../models';
import { ObservatoryManager } from '../states';
import { HomeSheetService } from './home-sheet.service';
import { TabNavigationService } from './tab-navigation.service';
import { ViewWindowsService } from './view-windows.service';

const mount = (
  options: { scrolled?: readonly ObservatoryWindow[]; isPhone?: boolean } = {},
) => {
  const { scrolled = [], isPhone = true } = options;
  const navigateByUrl = vi.fn(() => Promise.resolve(true));
  const history = new SessionHistoryDouble();
  const events = new Subject<unknown>();
  const windows = {
    bringToFront: vi.fn(),
    scrollToTop: vi.fn((window: ObservatoryWindow | null) =>
      scrolled.includes(window as ObservatoryWindow),
    ),
  };
  const homeSheet = {
    isPhone: signal(isPhone),
    isShown: signal(true),
    settle: vi.fn(),
  };
  TestBed.configureTestingModule({
    providers: [
      provideTexts(),
      provideStatewise(),
      provideSessionHistoryDouble(history),
      {
        provide: Router,
        useValue: { navigateByUrl, events, url: '/projet/skyted' },
      },
      { provide: ViewWindowsService, useValue: windows },
      { provide: HomeSheetService, useValue: homeSheet },
      TabNavigationService,
    ],
  });
  const observatory = TestBed.inject(ObservatoryManager);
  const tabs = TestBed.inject(TabNavigationService);
  return {
    observatory,
    tabs,
    navigateByUrl,
    events,
    history,
    windows,
    homeSheet,
  };
};

const touch = (): void => {
  window.dispatchEvent(new Event('click'));
};

describe('TabNavigationService', () => {
  describe('touching another tab', () => {
    it('adds an entry for the projects list from the home', () => {
      const { tabs, navigateByUrl } = mount();

      tabs.choose('/projets');

      expect(navigateByUrl).toHaveBeenCalledWith('/projets', {
        replaceUrl: false,
      });
    });

    it('replaces the entry when the reader is already on another tab', () => {
      const { tabs, observatory, navigateByUrl } = mount();
      observatory.syncRoute('about');

      tabs.choose('/projets');

      expect(navigateByUrl).toHaveBeenCalledWith('/projets', {
        replaceUrl: true,
      });
    });

    it('opens the sheet being read when the projects tab is touched again', () => {
      const { tabs, observatory, navigateByUrl } = mount();
      observatory.syncRoute('sheet', 'skyted');
      observatory.syncRoute('about');

      tabs.choose('/projets');

      expect(navigateByUrl).toHaveBeenCalledWith('/projet/skyted', {
        replaceUrl: true,
      });
    });

    it('opens the list when the sheet was left for the list before', () => {
      const { tabs, observatory, navigateByUrl } = mount();
      observatory.syncRoute('sheet', 'skyted');
      observatory.syncRoute('index');
      observatory.syncRoute('about');

      tabs.choose('/projets');

      expect(navigateByUrl).toHaveBeenCalledWith('/projets', {
        replaceUrl: true,
      });
    });

    it('opens about from a sheet', () => {
      const { tabs, observatory, navigateByUrl } = mount();
      observatory.syncRoute('sheet', 'skyted');

      tabs.choose('/a-propos');

      expect(navigateByUrl).toHaveBeenCalledWith('/a-propos', {
        replaceUrl: true,
      });
    });

    it('goes home by stepping back through the entries, never by adding one', () => {
      const { tabs, observatory, navigateByUrl, history } = mount();
      observatory.syncRoute('about');
      history.place = 2;

      tabs.choose('/');

      expect(history.steps).toEqual([2]);
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('goes home by replacing the entry when nothing lies below it', () => {
      const { tabs, observatory, navigateByUrl, history } = mount();
      observatory.syncRoute('about');

      tabs.choose('/');

      expect(history.steps).toEqual([]);
      expect(navigateByUrl).toHaveBeenCalledWith('/', { replaceUrl: true });
    });

    it('opens an address that is not a tab as it is', () => {
      const { tabs, navigateByUrl } = mount();

      tabs.choose('/ailleurs');

      expect(navigateByUrl).toHaveBeenCalledWith('/ailleurs', {
        replaceUrl: false,
      });
    });

    it('follows the address plainly outside the phone, the current tab included', () => {
      const { tabs, observatory, navigateByUrl, windows, homeSheet } = mount({
        isPhone: false,
        scrolled: ['about'],
      });
      observatory.syncRoute('about');

      tabs.choose('/a-propos');
      tabs.choose('/projets');

      expect(navigateByUrl.mock.calls).toEqual([['/a-propos'], ['/projets']]);
      expect(windows.scrollToTop).not.toHaveBeenCalled();
      expect(homeSheet.settle).not.toHaveBeenCalled();
    });
  });

  describe('touching the tab of a minimized window outside the phone', () => {
    it('restores the list and the sheet, in front, without leaving the page', () => {
      const { tabs, observatory, navigateByUrl, windows } = mount({
        isPhone: false,
      });
      observatory.syncRoute('sheet', 'skyted');
      observatory.togglePin('sheet');
      observatory.minimize('sheet');

      tabs.choose('/projets');

      expect(observatory.minimized().sheet).toBe(false);
      expect(windows.bringToFront.mock.calls).toEqual([['sheet']]);
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('restores a pinned window of the other tab, then goes to the tab', () => {
      const { tabs, observatory, navigateByUrl, windows } = mount({
        isPhone: false,
      });
      observatory.syncRoute('index');
      observatory.togglePin('index');
      observatory.minimize('index');
      observatory.syncRoute('about');

      tabs.choose('/projets');

      expect(observatory.minimized().index).toBe(false);
      expect(windows.bringToFront.mock.calls).toEqual([['index']]);
      expect(navigateByUrl).toHaveBeenCalledWith('/projets');
    });

    it('restores a reduced held sheet too, without leaving the page', () => {
      const { tabs, observatory, navigateByUrl, windows } = mount({
        isPhone: false,
      });
      observatory.syncRoute('sheet', 'a');
      observatory.togglePin('sheet');
      observatory.syncRoute('sheet', 'b');
      observatory.minimizeSheet(0);

      tabs.choose('/projets');

      expect(observatory.held().map(({ minimized }) => minimized)).toEqual([
        false,
      ]);
      expect(windows.bringToFront.mock.calls).toEqual([['sheet']]);
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('goes to the tab plainly when none of its windows is minimized', () => {
      const { tabs, observatory, navigateByUrl, windows } = mount({
        isPhone: false,
      });
      observatory.syncRoute('about');
      observatory.minimize('about');

      tabs.choose('/projets');

      expect(windows.bringToFront).not.toHaveBeenCalled();
      expect(navigateByUrl).toHaveBeenCalledWith('/projets');
    });
  });

  describe('following a link to the page already open', () => {
    const sameUrlSkipped = new NavigationSkipped(
      1,
      '/projet/skyted',
      '',
      NavigationSkippedCode.IgnoredSameUrlNavigation,
    );

    it('brings back the minimized window of the page, in front', () => {
      const { events, observatory, windows } = mount({ isPhone: false });
      observatory.syncRoute('sheet', 'skyted');
      observatory.minimize('sheet');

      events.next(sameUrlSkipped);

      expect(observatory.minimized().sheet).toBe(false);
      expect(windows.bringToFront.mock.calls).toEqual([['sheet']]);
    });

    it('leaves the other minimized windows alone', () => {
      const { events, observatory } = mount({ isPhone: false });
      observatory.syncRoute('index');
      observatory.togglePin('about');
      observatory.minimize('about');

      events.next(sameUrlSkipped);

      expect(observatory.minimized().about).toBe(true);
    });

    it('does nothing when no window of the page is minimized', () => {
      const { events, observatory, windows } = mount({ isPhone: false });
      observatory.syncRoute('index');

      events.next(sameUrlSkipped);

      expect(windows.bringToFront).not.toHaveBeenCalled();
    });

    it('ignores a navigation skipped for another reason', () => {
      const { events, observatory, windows } = mount({ isPhone: false });
      observatory.syncRoute('index');
      observatory.minimize('index');

      events.next(
        new NavigationSkipped(
          1,
          '/projets',
          '',
          NavigationSkippedCode.IgnoredByUrlHandlingStrategy,
        ),
      );

      expect(observatory.minimized().index).toBe(true);
      expect(windows.bringToFront).not.toHaveBeenCalled();
    });

    it('does nothing on the phone', () => {
      const { events, observatory, windows } = mount();
      observatory.syncRoute('index');

      events.next(sameUrlSkipped);

      expect(windows.bringToFront).not.toHaveBeenCalled();
    });
  });

  describe('minimizing a window', () => {
    it('hands the focus to the entry of its tab, then hides it', () => {
      const { tabs, observatory } = mount({ isPhone: false });
      observatory.syncRoute('sheet', 'skyted');
      const calls: string[] = [];
      const bar = { focusRoute: (route: string) => calls.push(route) };

      tabs.minimize('sheet', bar);
      tabs.minimize('about', bar);

      expect(calls).toEqual(['/projets', '/a-propos']);
      expect(observatory.minimized().sheet).toBe(true);
      expect(observatory.minimized().about).toBe(true);
    });
  });

  describe('minimizing a sheet window', () => {
    it('hands the focus to the projects entry, then hides only that sheet', () => {
      const { tabs, observatory } = mount({ isPhone: false });
      observatory.syncRoute('sheet', 'a');
      observatory.togglePin('sheet');
      observatory.syncRoute('sheet', 'b');
      const calls: string[] = [];
      const bar = { focusRoute: (route: string) => calls.push(route) };

      tabs.minimizeSheet(0, bar);

      expect(calls).toEqual(['/projets']);
      expect(observatory.held().map(({ minimized }) => minimized)).toEqual([
        true,
      ]);
      expect(observatory.minimized().sheet).toBe(false);

      tabs.minimizeSheet(observatory.sheetKey(), bar);

      expect(observatory.minimized().sheet).toBe(true);
    });
  });

  describe('touching the current tab', () => {
    it('takes a scrolled sheet back to the top and stays on it', () => {
      const { tabs, observatory, navigateByUrl, windows } = mount({
        scrolled: ['sheet'],
      });
      observatory.syncRoute('sheet', 'skyted');

      tabs.choose('/projets');

      expect(windows.scrollToTop).toHaveBeenCalledWith('sheet');
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('takes a scrolled about back to the top', () => {
      const { tabs, observatory, windows } = mount({ scrolled: ['about'] });
      observatory.syncRoute('about');

      tabs.choose('/a-propos');

      expect(windows.scrollToTop).toHaveBeenCalledWith('about');
    });

    it('goes back to the list from a sheet already at the top', () => {
      const { tabs, observatory, navigateByUrl } = mount();
      observatory.syncRoute('sheet', 'skyted');

      tabs.choose('/projets');

      expect(navigateByUrl).toHaveBeenCalledWith('/projets', {
        replaceUrl: true,
      });
    });

    it('does nothing on a root already at the top', () => {
      const { tabs, observatory, navigateByUrl, history, homeSheet } = mount();
      observatory.syncRoute('index');

      tabs.choose('/projets');

      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(history.steps).toEqual([]);
      expect(homeSheet.settle).not.toHaveBeenCalled();
    });

    it('lowers the home sheet to half and goes nowhere', () => {
      const { tabs, navigateByUrl, history, homeSheet } = mount();

      tabs.choose('/');

      expect(homeSheet.settle).toHaveBeenCalledWith('half');
      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(history.steps).toEqual([]);
    });
  });

  describe('keeping the home below the first page', () => {
    it('lays the home under a root page reached directly', () => {
      const { observatory, history } = mount();
      observatory.syncRoute('about');

      touch();

      expect(history.replaced).toEqual(['/']);
      expect(history.pushed).toEqual([
        { state: history.stateNow, address: '/projet/skyted' },
      ]);
    });

    it('lays the home and the list under a sheet reached directly', () => {
      const { observatory, history } = mount();
      observatory.syncRoute('sheet', 'skyted');

      touch();

      expect(history.replaced).toEqual(['/']);
      expect(history.pushed).toEqual([
        { state: null, address: '/projets' },
        { state: history.stateNow, address: '/projet/skyted' },
      ]);
    });

    it('lays them once, as the entry is no longer the first', () => {
      const { observatory, history } = mount();
      observatory.syncRoute('about');

      touch();
      touch();

      expect(history.replaced).toEqual(['/']);
      expect(history.pushed).toHaveLength(1);
    });

    it('leaves the history alone from the home, after the first entry, and outside the phone', () => {
      const first = mount();
      touch();
      first.observatory.syncRoute('about');
      first.history.place = 1;
      touch();
      expect(first.history.replaced).toEqual([]);
      expect(first.history.pushed).toEqual([]);
      TestBed.resetTestingModule();

      const outside = mount({ isPhone: false });
      outside.observatory.syncRoute('about');
      touch();
      expect(outside.history.replaced).toEqual([]);
      expect(outside.history.pushed).toEqual([]);
    });
  });

  describe('leaving the home', () => {
    it('poses again the project that was posed once the home is shown', () => {
      const { observatory, homeSheet } = mount();
      TestBed.tick();
      observatory.openPreview('skyted');
      touch();
      homeSheet.isShown.set(false);
      TestBed.tick();
      observatory.closePreview();

      homeSheet.isShown.set(true);
      TestBed.tick();

      expect(observatory.preview()).toBe('skyted');
    });

    it('poses nothing when nothing was posed at the last touch', () => {
      const { observatory, homeSheet } = mount();
      TestBed.tick();
      observatory.openPreview('skyted');
      touch();
      observatory.closePreview();
      touch();
      homeSheet.isShown.set(false);
      TestBed.tick();

      homeSheet.isShown.set(true);
      TestBed.tick();

      expect(observatory.preview()).toBeNull();
    });

    it('poses again the card shown at half, which only the hover held', () => {
      const { observatory, homeSheet } = mount();
      TestBed.tick();
      observatory.hover('skyted');
      touch();
      observatory.syncRoute('index');
      homeSheet.isShown.set(false);
      TestBed.tick();
      expect(observatory.hovered()).toBeNull();

      observatory.syncRoute('home');
      homeSheet.isShown.set(true);
      TestBed.tick();

      expect(observatory.hovered()).toBe('skyted');
      expect(observatory.preview()).toBeNull();
    });

    it('parks nothing outside the phone', () => {
      const { observatory, homeSheet } = mount({ isPhone: false });
      TestBed.tick();
      observatory.openPreview('skyted');
      touch();
      homeSheet.isShown.set(false);
      TestBed.tick();
      observatory.closePreview();

      homeSheet.isShown.set(true);
      TestBed.tick();

      expect(observatory.preview()).toBeNull();
    });
  });
});
