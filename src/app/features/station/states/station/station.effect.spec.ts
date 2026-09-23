import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import {
  stationEscaped,
  stationRouteSynced,
  stationPinToggled,
  stationPreviewOpened,
  stationSelected,
  stationSteppedBack,
  stationWindowClosed,
} from './station.action';
import { StationEffect } from './station.effect';
import { StationState } from './station.state';
import { stationUpdater } from './station.updater';
import { provideTexts } from '@testing/texts';

describe('StationEffect', () => {
  let navigated: string[];
  let statewise: Statewise;
  let state: StationState;

  beforeEach(() => {
    navigated = [];

    TestBed.configureTestingModule({
      providers: [
        provideTexts(),
        provideStatewiseTesting({ effects: [StationEffect] }),
        {
          provide: Router,
          // A fake recording where the effect sent the reader, never an
          // actual navigation: the truths are about the URL asked for.
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
      injectStatewise(stationUpdater),
    );
    state = TestBed.inject(StationState);
  });

  describe('stationWindowClosed', () => {
    it('sends the reader home when the index closes while shown', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'index', slug: null }));

      await statewise.dispatchAsync(stationWindowClosed('index'));

      expect(navigated).toEqual(['/']);
    });

    it('does not navigate when the index is only pinned elsewhere', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(stationPinToggled('index'));

      await statewise.dispatchAsync(stationWindowClosed('index'));

      expect(navigated).toEqual([]);
    });

    it('sends the reader home when about closes while shown', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'about', slug: null }));

      await statewise.dispatchAsync(stationWindowClosed('about'));

      expect(navigated).toEqual(['/']);
    });

    it('does not navigate when about is only pinned elsewhere', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(stationPinToggled('about'));

      await statewise.dispatchAsync(stationWindowClosed('about'));

      expect(navigated).toEqual([]);
    });

    it('sends the reader back to the list when a sheet closes', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'sheet', slug: 'a' }));

      await statewise.dispatchAsync(stationWindowClosed('sheet'));

      expect(navigated).toEqual(['/projets']);
    });

    it('sends the reader back to the list when a not-found sheet closes', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'not-found', slug: null }));

      await statewise.dispatchAsync(stationWindowClosed('sheet'));

      expect(navigated).toEqual(['/projets']);
    });

    it('never navigates when the preview closes', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(stationPreviewOpened('a'));
      statewise.dispatch(stationPinToggled('preview'));

      await statewise.dispatchAsync(stationWindowClosed('preview'));

      expect(navigated).toEqual([]);
    });
  });

  describe('stationEscaped', () => {
    it('clears the selection without navigating when the index has one', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'index', slug: null }));
      statewise.dispatch(stationSelected('a'));

      await statewise.dispatchAsync(stationEscaped());

      expect(state.selection()).toBeNull();
      expect(navigated).toEqual([]);
    });

    it('sends the reader back to the list from a sheet', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'sheet', slug: 'a' }));

      await statewise.dispatchAsync(stationEscaped());

      expect(navigated).toEqual(['/projets']);
    });

    it('sends the reader back to the list from a not-found sheet', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'not-found', slug: null }));

      await statewise.dispatchAsync(stationEscaped());

      expect(navigated).toEqual(['/projets']);
    });

    it('sends the reader home from the index without a selection', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'index', slug: null }));

      await statewise.dispatchAsync(stationEscaped());

      expect(navigated).toEqual(['/']);
    });

    it('sends the reader home from about', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'about', slug: null }));

      await statewise.dispatchAsync(stationEscaped());

      expect(navigated).toEqual(['/']);
    });

    it('closes an open preview on home without navigating', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(stationPreviewOpened('a'));

      await statewise.dispatchAsync(stationEscaped());

      expect(state.preview()).toBeNull();
      expect(navigated).toEqual([]);
    });

    it('does nothing on home with nothing open', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'home', slug: null }));

      await statewise.dispatchAsync(stationEscaped());

      expect(navigated).toEqual([]);
      expect(state.preview()).toBeNull();
    });
  });

  describe('stationSteppedBack', () => {
    it('sends the reader back to the list from a sheet', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'sheet', slug: 'a' }));

      await statewise.dispatchAsync(stationSteppedBack());

      expect(navigated).toEqual(['/projets']);
    });

    it('clears the selection without navigating when the index has one', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'index', slug: null }));
      statewise.dispatch(stationSelected('a'));

      await statewise.dispatchAsync(stationSteppedBack());

      expect(state.selection()).toBeNull();
      expect(navigated).toEqual([]);
    });

    it('closes an open preview on home without navigating', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(stationPreviewOpened('a'));

      await statewise.dispatchAsync(stationSteppedBack());

      expect(state.preview()).toBeNull();
      expect(navigated).toEqual([]);
    });

    it('does nothing on a view with nothing to step back from', async () => {
      statewise.dispatch(stationRouteSynced({ view: 'about', slug: null }));

      await statewise.dispatchAsync(stationSteppedBack());

      expect(navigated).toEqual([]);
    });
  });
});
