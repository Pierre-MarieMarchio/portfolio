import { TestBed } from '@angular/core/testing';
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
import { ObservatoryView, ObservatoryWindow } from '../../models';
import { ObservatoryEffect } from './observatory.effect';
import { ObservatoryState } from './observatory.state';
import { observatoryUpdater } from './observatory.updater';
import {
  provideSessionHistoryDouble,
  SessionHistoryDouble,
} from '@testing/doubles/session-history.double';
import { provideRecordingRouter } from '@testing/fixtures/observatory.fixture';
import { provideTexts } from '@testing/fixtures/texts.fixture';

const arrive = (
  history: SessionHistoryDouble,
  place: number,
  address: string,
): void => {
  history.place = place;
  history.addresses[place] = address;
};

describe('ObservatoryEffect', () => {
  let navigated: string[];
  let history: SessionHistoryDouble;
  let statewise: Statewise;
  let state: ObservatoryState;

  beforeEach(() => {
    navigated = [];
    history = new SessionHistoryDouble();

    TestBed.configureTestingModule({
      providers: [
        provideTexts(),
        provideStatewiseTesting({ effects: [ObservatoryEffect] }),
        provideRecordingRouter(navigated),
        provideSessionHistoryDouble(history),
      ],
    });

    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(observatoryUpdater),
    );
    state = TestBed.inject(ObservatoryState);
  });

  it.each<{
    case: string;
    view: ObservatoryView;
    slug?: string;
    pinned?: ObservatoryWindow[];
    preview?: string;
    window: ObservatoryWindow;
    navigated: string[];
  }>([
    {
      case: 'sends the reader home when the index closes while shown',
      view: 'index',
      window: 'index',
      navigated: ['/'],
    },
    {
      case: 'does not navigate when the index is only pinned elsewhere',
      view: 'sheet',
      slug: 'a',
      pinned: ['index'],
      window: 'index',
      navigated: [],
    },
    {
      case: 'sends the reader home when about closes while shown',
      view: 'about',
      window: 'about',
      navigated: ['/'],
    },
    {
      case: 'does not navigate when about is only pinned elsewhere',
      view: 'home',
      pinned: ['about'],
      window: 'about',
      navigated: [],
    },
    {
      case: 'sends the reader back to the list when a sheet closes',
      view: 'sheet',
      slug: 'a',
      window: 'sheet',
      navigated: ['/projets'],
    },
    {
      case: 'sends the reader back to the list when a not-found sheet closes',
      view: 'not-found',
      window: 'sheet',
      navigated: ['/projets'],
    },
    {
      case: 'never navigates when the preview closes',
      view: 'home',
      preview: 'a',
      pinned: ['preview'],
      window: 'preview',
      navigated: [],
    },
  ])(
    'on observatoryWindowClosed, $case',
    async ({ view, slug, pinned = [], preview, window, navigated: to }) => {
      statewise.dispatch(observatoryRouteSynced({ view, slug: slug ?? null }));
      if (preview) {
        statewise.dispatch(observatoryPreviewOpened(preview));
      }
      for (const pin of pinned) {
        statewise.dispatch(observatoryPinToggled(pin));
      }

      await statewise.dispatchAsync(observatoryWindowClosed(window));

      expect(navigated).toEqual(to);
    },
  );

  describe('observatoryWindowClosed, through the history', () => {
    it('steps back to the list instead of adding an entry when the list lies just below', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));
      arrive(history, 1, '/projets');
      arrive(history, 2, '/projet/a');

      await statewise.dispatchAsync(observatoryWindowClosed('sheet'));

      expect(history.steps).toEqual([1]);
      expect(navigated).toEqual([]);
    });

    it('replaces the sheet by the list when the list does not lie below', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));
      arrive(history, 1, '/a-propos');
      arrive(history, 2, '/projet/a');

      await statewise.dispatchAsync(observatoryWindowClosed('sheet'));

      expect(history.steps).toEqual([]);
      expect(navigated).toEqual(['/projets']);
    });

    it('steps back home from the list the same way', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'index', slug: null }));
      arrive(history, 0, '/');
      arrive(history, 1, '/projets');

      await statewise.dispatchAsync(observatoryWindowClosed('index'));

      expect(history.steps).toEqual([1]);
      expect(navigated).toEqual([]);
    });
  });

  describe('observatoryEscaped', () => {
    it('clears the selection without navigating when the index has one', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'index', slug: null }));
      statewise.dispatch(observatorySelected('a'));

      await statewise.dispatchAsync(observatoryEscaped());

      expect(state.selected()).toBeNull();
      expect(navigated).toEqual([]);
    });

    it('closes an open preview on home without navigating', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(observatoryPreviewOpened('a'));

      await statewise.dispatchAsync(observatoryEscaped());

      expect(state.preview()).toBeNull();
      expect(navigated).toEqual([]);
    });

    it.each(['home', 'index', 'about', 'sheet', 'not-found'] as const)(
      'never navigates away from %s',
      async (view) => {
        statewise.dispatch(observatoryRouteSynced({ view, slug: 'a' }));

        await statewise.dispatchAsync(observatoryEscaped());

        expect(navigated).toEqual([]);
      },
    );
  });

  describe('observatorySteppedBack', () => {
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

    it('never navigates away from a sheet', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));

      await statewise.dispatchAsync(observatorySteppedBack());

      expect(navigated).toEqual([]);
    });

    it('does nothing on a view with nothing to step back from', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));

      await statewise.dispatchAsync(observatorySteppedBack());

      expect(navigated).toEqual([]);
    });
  });
});
