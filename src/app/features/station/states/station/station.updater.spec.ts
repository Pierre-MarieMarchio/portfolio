import { TestBed } from '@angular/core/testing';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import {
  stationChapterChosen,
  stationEnglishAsked,
  stationFiltered,
  stationHovered,
  stationNavigated,
  stationPartChosen,
  stationPauseToggled,
  stationPinToggled,
  stationPreviewClosed,
  stationPreviewOpened,
  stationSelected,
  stationWindowClosed,
} from './station.action';
import { NO_PINS, StationState } from './station.state';
import { stationUpdater } from './station.updater';

/**
 * No effects are registered, so a dispatch runs the updater and nothing else.
 * What is under test is the state machine, not the navigation behind it.
 */
describe('stationUpdater', () => {
  let statewise: Statewise;
  let state: StationState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewiseTesting()],
    });

    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(stationUpdater),
    );
    state = TestBed.inject(StationState);
  });

  it('starts on the home view with every window unpinned', () => {
    expect(state.view()).toBe('home');
    expect(state.slug()).toBeNull();
    expect(state.pins()).toEqual(NO_PINS);
    expect(state.preview()).toBeNull();
    expect(state.selection()).toBeNull();
    expect(state.visited()).toEqual([]);
    expect(state.family()).toBe('all');
    expect(state.chapter()).toBe(0);
    expect(state.part()).toBe('00');
    expect(state.hovered()).toBeNull();
    expect(state.englishAsked()).toBe(false);
    expect(state.paused()).toBe(false);
  });

  describe('stationNavigated', () => {
    it('sets the view and keeps the slug only on a sheet', () => {
      statewise.dispatch(stationNavigated({ view: 'sheet', slug: 'skyted' }));

      expect(state.view()).toBe('sheet');
      expect(state.slug()).toBe('skyted');
    });

    it('drops a slug handed to a view other than sheet', () => {
      statewise.dispatch(stationNavigated({ view: 'index', slug: 'skyted' }));

      expect(state.view()).toBe('index');
      expect(state.slug()).toBeNull();
    });

    it('resets the chapter and the hovered project on every navigation', () => {
      statewise.dispatch(stationChapterChosen(3));
      statewise.dispatch(stationHovered('skyted'));

      statewise.dispatch(stationNavigated({ view: 'about', slug: null }));

      expect(state.chapter()).toBe(0);
      expect(state.hovered()).toBeNull();
    });

    it('closes the home preview on navigation when it is not pinned', () => {
      statewise.dispatch(stationPreviewOpened('skyted'));

      statewise.dispatch(stationNavigated({ view: 'index', slug: null }));

      expect(state.preview()).toBeNull();
    });

    it('keeps the preview open across navigation when it is pinned', () => {
      statewise.dispatch(stationPreviewOpened('skyted'));
      statewise.dispatch(stationPinToggled('preview'));

      statewise.dispatch(stationNavigated({ view: 'index', slug: null }));

      expect(state.preview()).toBe('skyted');
    });

    it('appends a sheet slug to the visited list once, in first-visit order', () => {
      statewise.dispatch(stationNavigated({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(stationNavigated({ view: 'sheet', slug: 'b' }));
      statewise.dispatch(stationNavigated({ view: 'sheet', slug: 'a' }));

      expect(state.visited()).toEqual(['a', 'b']);
    });

    it('selects the row of the sheet just left when arriving back on the index', () => {
      statewise.dispatch(stationNavigated({ view: 'sheet', slug: 'a' }));

      statewise.dispatch(stationNavigated({ view: 'index', slug: null }));

      expect(state.selection()).toBe('a');
    });

    it('leaves the selection untouched arriving on the index from a slug-less view', () => {
      statewise.dispatch(stationSelected('kept'));

      statewise.dispatch(stationNavigated({ view: 'home', slug: null }));
      statewise.dispatch(stationNavigated({ view: 'index', slug: null }));

      expect(state.selection()).toBe('kept');
    });

    it('never resets the family or the part filters', () => {
      statewise.dispatch(stationFiltered('personal'));
      statewise.dispatch(stationPartChosen('02'));

      statewise.dispatch(stationNavigated({ view: 'about', slug: null }));

      expect(state.family()).toBe('personal');
      expect(state.part()).toBe('02');
    });
  });

  describe('stationPinToggled', () => {
    it('flips only the given window', () => {
      statewise.dispatch(stationPinToggled('index'));

      expect(state.pins()).toEqual({ ...NO_PINS, index: true });

      statewise.dispatch(stationPinToggled('index'));

      expect(state.pins()).toEqual(NO_PINS);
    });
  });

  describe('stationWindowClosed', () => {
    it('unpins the window, staying false when it already was', () => {
      statewise.dispatch(stationWindowClosed('about'));

      expect(state.pins().about).toBe(false);
    });

    it('also closes the preview itself, not merely its pin', () => {
      statewise.dispatch(stationPreviewOpened('skyted'));
      statewise.dispatch(stationPinToggled('preview'));

      statewise.dispatch(stationWindowClosed('preview'));

      expect(state.pins().preview).toBe(false);
      expect(state.preview()).toBeNull();
    });

    it('leaves the preview slug alone when another window closes', () => {
      statewise.dispatch(stationPreviewOpened('skyted'));

      statewise.dispatch(stationWindowClosed('index'));

      expect(state.preview()).toBe('skyted');
    });
  });

  it('stationSelected sets the selection and clears the hovered project', () => {
    statewise.dispatch(stationHovered('other'));

    statewise.dispatch(stationSelected('picked'));

    expect(state.selection()).toBe('picked');
    expect(state.hovered()).toBeNull();

    statewise.dispatch(stationSelected(null));

    expect(state.selection()).toBeNull();
  });

  it('stationFiltered sets the family filter', () => {
    statewise.dispatch(stationFiltered('personal'));

    expect(state.family()).toBe('personal');
  });

  describe('stationChapterChosen', () => {
    it('sets the chapter', () => {
      statewise.dispatch(stationChapterChosen(2));

      expect(state.chapter()).toBe(2);
    });

    it('clamps a negative chapter to zero', () => {
      statewise.dispatch(stationChapterChosen(-1));

      expect(state.chapter()).toBe(0);
    });
  });

  it('stationPartChosen sets the part', () => {
    statewise.dispatch(stationPartChosen('03'));

    expect(state.part()).toBe('03');
  });

  it('stationPreviewOpened sets the preview and clears the hovered project', () => {
    statewise.dispatch(stationHovered('other'));

    statewise.dispatch(stationPreviewOpened('skyted'));

    expect(state.preview()).toBe('skyted');
    expect(state.hovered()).toBeNull();
  });

  it('stationPreviewClosed clears the preview', () => {
    statewise.dispatch(stationPreviewOpened('skyted'));

    statewise.dispatch(stationPreviewClosed());

    expect(state.preview()).toBeNull();
  });

  it('stationHovered sets the hovered project', () => {
    statewise.dispatch(stationHovered('skyted'));

    expect(state.hovered()).toBe('skyted');

    statewise.dispatch(stationHovered(null));

    expect(state.hovered()).toBeNull();
  });

  it('stationEnglishAsked sets the flag, staying true once asked', () => {
    statewise.dispatch(stationEnglishAsked());

    expect(state.englishAsked()).toBe(true);

    statewise.dispatch(stationEnglishAsked());

    expect(state.englishAsked()).toBe(true);
  });

  it('stationPauseToggled flips the paused flag', () => {
    statewise.dispatch(stationPauseToggled());

    expect(state.paused()).toBe(true);

    statewise.dispatch(stationPauseToggled());

    expect(state.paused()).toBe(false);
  });
  /** Closing the preview forgets what is open, not what was read. */
  it('keeps the body last previewed as the reading, through a close', () => {
    statewise.dispatch(stationPreviewOpened('a'));
    statewise.dispatch(stationPreviewOpened('b'));
    statewise.dispatch(stationPreviewClosed());

    expect(state.preview()).toBeNull();
    expect(state.reading()).toBe('b');
  });
});
