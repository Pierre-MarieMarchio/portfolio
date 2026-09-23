import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import {
  desktopEscaped,
  desktopRouteSynced,
  desktopPinToggled,
  desktopPreviewOpened,
  desktopSelected,
  desktopSteppedBack,
  desktopWindowClosed,
} from './desktop.action';
import { DesktopEffect } from './desktop.effect';
import { DesktopState } from './desktop.state';
import { desktopUpdater } from './desktop.updater';
import { provideTexts } from '@testing/fixtures/texts.fixture';

describe('StationEffect', () => {
  let navigated: string[];
  let statewise: Statewise;
  let state: DesktopState;

  beforeEach(() => {
    navigated = [];

    TestBed.configureTestingModule({
      providers: [
        provideTexts(),
        provideStatewiseTesting({ effects: [DesktopEffect] }),
        {
          provide: Router,
          useValue: {
            navigateByUrl: (url: string) => {
              navigated.push(url);
              return Promise.resolve(true);
            },
          },
        },
      ],
    });

    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(desktopUpdater),
    );
    state = TestBed.inject(DesktopState);
  });

  describe('stationWindowClosed', () => {
    it('sends the reader home when the index closes while shown', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'index', slug: null }));

      await statewise.dispatchAsync(desktopWindowClosed('index'));

      expect(navigated).toEqual(['/']);
    });

    it('does not navigate when the index is only pinned elsewhere', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(desktopPinToggled('index'));

      await statewise.dispatchAsync(desktopWindowClosed('index'));

      expect(navigated).toEqual([]);
    });

    it('sends the reader home when about closes while shown', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'about', slug: null }));

      await statewise.dispatchAsync(desktopWindowClosed('about'));

      expect(navigated).toEqual(['/']);
    });

    it('does not navigate when about is only pinned elsewhere', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(desktopPinToggled('about'));

      await statewise.dispatchAsync(desktopWindowClosed('about'));

      expect(navigated).toEqual([]);
    });

    it('sends the reader back to the list when a sheet closes', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'sheet', slug: 'a' }));

      await statewise.dispatchAsync(desktopWindowClosed('sheet'));

      expect(navigated).toEqual(['/projets']);
    });

    it('sends the reader back to the list when a not-found sheet closes', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'not-found', slug: null }));

      await statewise.dispatchAsync(desktopWindowClosed('sheet'));

      expect(navigated).toEqual(['/projets']);
    });

    it('never navigates when the preview closes', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(desktopPreviewOpened('a'));
      statewise.dispatch(desktopPinToggled('preview'));

      await statewise.dispatchAsync(desktopWindowClosed('preview'));

      expect(navigated).toEqual([]);
    });
  });

  describe('stationEscaped', () => {
    it('clears the selection without navigating when the index has one', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'index', slug: null }));
      statewise.dispatch(desktopSelected('a'));

      await statewise.dispatchAsync(desktopEscaped());

      expect(state.selected()).toBeNull();
      expect(navigated).toEqual([]);
    });

    it('sends the reader back to the list from a sheet', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'sheet', slug: 'a' }));

      await statewise.dispatchAsync(desktopEscaped());

      expect(navigated).toEqual(['/projets']);
    });

    it.each([
      {
        way: 'back to the list from a not-found sheet',
        view: 'not-found',
        path: '/projets',
      },
      {
        way: 'home from the index without a selection',
        view: 'index',
        path: '/',
      },
      { way: 'home from about', view: 'about', path: '/' },
    ] as const)('sends the reader $way', async ({ view, path }) => {
      statewise.dispatch(desktopRouteSynced({ view, slug: null }));

      await statewise.dispatchAsync(desktopEscaped());

      expect(navigated).toEqual([path]);
    });

    it('closes an open preview on home without navigating', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(desktopPreviewOpened('a'));

      await statewise.dispatchAsync(desktopEscaped());

      expect(state.preview()).toBeNull();
      expect(navigated).toEqual([]);
    });

    it('does nothing on home with nothing open', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'home', slug: null }));

      await statewise.dispatchAsync(desktopEscaped());

      expect(navigated).toEqual([]);
      expect(state.preview()).toBeNull();
    });
  });

  describe('stationSteppedBack', () => {
    it('sends the reader back to the list from a sheet', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'sheet', slug: 'a' }));

      await statewise.dispatchAsync(desktopSteppedBack());

      expect(navigated).toEqual(['/projets']);
    });

    it('clears the selection without navigating when the index has one', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'index', slug: null }));
      statewise.dispatch(desktopSelected('a'));

      await statewise.dispatchAsync(desktopSteppedBack());

      expect(state.selected()).toBeNull();
      expect(navigated).toEqual([]);
    });

    it('closes an open preview on home without navigating', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(desktopPreviewOpened('a'));

      await statewise.dispatchAsync(desktopSteppedBack());

      expect(state.preview()).toBeNull();
      expect(navigated).toEqual([]);
    });

    it('does nothing on a view with nothing to step back from', async () => {
      statewise.dispatch(desktopRouteSynced({ view: 'about', slug: null }));

      await statewise.dispatchAsync(desktopSteppedBack());

      expect(navigated).toEqual([]);
    });
  });
});
