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
import { provideRecordingRouter } from '@testing/fixtures/observatory.fixture';
import { provideTexts } from '@testing/fixtures/texts.fixture';

describe('ObservatoryEffect', () => {
  let navigated: string[];
  let statewise: Statewise;
  let state: ObservatoryState;

  beforeEach(() => {
    navigated = [];

    TestBed.configureTestingModule({
      providers: [
        provideTexts(),
        provideStatewiseTesting({ effects: [ObservatoryEffect] }),
        provideRecordingRouter(navigated),
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

  describe('observatoryEscaped', () => {
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

  describe('observatorySteppedBack', () => {
    it('sends the reader back to the list from a sheet', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));

      await statewise.dispatchAsync(observatorySteppedBack());

      expect(navigated).toEqual(['/projets']);
    });

    it('does nothing on a view with nothing to step back from', async () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));

      await statewise.dispatchAsync(observatorySteppedBack());

      expect(navigated).toEqual([]);
    });
  });
});
