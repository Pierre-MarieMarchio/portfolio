import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import {
  observatoryEscaped,
  observatoryRouteSynced,
  observatoryPinToggled,
  observatoryPreviewOpened,
  observatorySelected,
  observatorySteppedBack,
  observatoryWindowClosed,
} from './observatory.action';
import { ObservatoryEffect } from './observatory.effect';
import { ObservatoryState } from './observatory.state';
import { observatoryUpdater } from './observatory.updater';
import { provideTexts } from '@testing/fixtures/texts.fixture';

describe('StationEffect', () => {
  let navigated: string[];
  let statewise: Statewise;
  let state: ObservatoryState;

  beforeEach(() => {
    navigated = [];

    TestBed.configureTestingModule({
      providers: [
        provideTexts(),
        provideStatewiseTesting({ effects: [ObservatoryEffect] }),
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
      injectStatewise(observatoryUpdater),
    );
    state = TestBed.inject(ObservatoryState);
  });

  describe('stationWindowClosed', () => {
    it('sends the reader home when the index closes while shown', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'index', slug: null }));

      await statewise.dispatchAsync(observatoryWindowClosed('index'));

      expect(navigated).toEqual(['/']);
    });

    it('does not navigate when the index is only pinned elsewhere', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(observatoryPinToggled('index'));

      await statewise.dispatchAsync(observatoryWindowClosed('index'));

      expect(navigated).toEqual([]);
    });

    it('sends the reader home when about closes while shown', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));

      await statewise.dispatchAsync(observatoryWindowClosed('about'));

      expect(navigated).toEqual(['/']);
    });

    it('does not navigate when about is only pinned elsewhere', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(observatoryPinToggled('about'));

      await statewise.dispatchAsync(observatoryWindowClosed('about'));

      expect(navigated).toEqual([]);
    });

    it('sends the reader back to the list when a sheet closes', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));

      await statewise.dispatchAsync(observatoryWindowClosed('sheet'));

      expect(navigated).toEqual(['/projets']);
    });

    it('sends the reader back to the list when a not-found sheet closes', async () => {
      statewise.dispatch(
        observatoryRouteSynced({ view: 'not-found', slug: null }),
      );

      await statewise.dispatchAsync(observatoryWindowClosed('sheet'));

      expect(navigated).toEqual(['/projets']);
    });

    it('never navigates when the preview closes', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(observatoryPreviewOpened('a'));
      statewise.dispatch(observatoryPinToggled('preview'));

      await statewise.dispatchAsync(observatoryWindowClosed('preview'));

      expect(navigated).toEqual([]);
    });
  });

  describe('stationEscaped', () => {
    it('clears the selection without navigating when the index has one', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'index', slug: null }));
      statewise.dispatch(observatorySelected('a'));

      await statewise.dispatchAsync(observatoryEscaped());

      expect(state.selected()).toBeNull();
      expect(navigated).toEqual([]);
    });

    it('sends the reader back to the list from a sheet', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));

      await statewise.dispatchAsync(observatoryEscaped());

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
      statewise.dispatch(observatoryRouteSynced({ view, slug: null }));

      await statewise.dispatchAsync(observatoryEscaped());

      expect(navigated).toEqual([path]);
    });

    it('closes an open preview on home without navigating', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(observatoryPreviewOpened('a'));

      await statewise.dispatchAsync(observatoryEscaped());

      expect(state.preview()).toBeNull();
      expect(navigated).toEqual([]);
    });

    it('does nothing on home with nothing open', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'home', slug: null }));

      await statewise.dispatchAsync(observatoryEscaped());

      expect(navigated).toEqual([]);
      expect(state.preview()).toBeNull();
    });
  });

  describe('stationSteppedBack', () => {
    it('sends the reader back to the list from a sheet', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));

      await statewise.dispatchAsync(observatorySteppedBack());

      expect(navigated).toEqual(['/projets']);
    });

    it('clears the selection without navigating when the index has one', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'index', slug: null }));
      statewise.dispatch(observatorySelected('a'));

      await statewise.dispatchAsync(observatorySteppedBack());

      expect(state.selected()).toBeNull();
      expect(navigated).toEqual([]);
    });

    it('closes an open preview on home without navigating', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(observatoryPreviewOpened('a'));

      await statewise.dispatchAsync(observatorySteppedBack());

      expect(state.preview()).toBeNull();
      expect(navigated).toEqual([]);
    });

    it('does nothing on a view with nothing to step back from', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));

      await statewise.dispatchAsync(observatorySteppedBack());

      expect(navigated).toEqual([]);
    });
  });
});
