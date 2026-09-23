import { TestBed } from '@angular/core/testing';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import {
  desktopChapterChosen,
  desktopFiltered,
  desktopHovered,
  desktopPinToggled,
  desktopPreviewClosed,
  desktopPreviewOpened,
  desktopRouteSynced,
  desktopSectionChosen,
  desktopSelected,
  desktopWindowClosed,
} from './desktop.action';
import { NO_PINS, DesktopState } from './desktop.state';
import { desktopUpdater } from './desktop.updater';

/**
 * No effects are registered, so a dispatch runs the updater and nothing else.
 * What is under test is the state machine, not the navigation behind it.
 */
describe('stationUpdater', () => {
  let statewise: Statewise;
  let state: DesktopState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewiseTesting()],
    });

    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(desktopUpdater),
    );
    state = TestBed.inject(DesktopState);
  });

  it('starts on the home view with every window unpinned', () => {
    expect(state.view()).toBe('home');
    expect(state.slug()).toBeNull();
    expect(state.pins()).toEqual(NO_PINS);
    expect(state.preview()).toBeNull();
    expect(state.selected()).toBeNull();
    expect(state.visited()).toEqual([]);
    expect(state.family()).toBe('all');
    expect(state.chapter()).toBe(0);
    expect(state.section()).toBe(0);
    expect(state.hovered()).toBeNull();
  });

  describe('stationRouteSynced', () => {
    /** The language switch lands on the same view: the reader has not moved. */
    it('resets nothing when the view and its slug are the same', () => {
      statewise.dispatch(desktopRouteSynced({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(desktopChapterChosen(2));
      statewise.dispatch(desktopHovered('b'));

      statewise.dispatch(desktopRouteSynced({ view: 'sheet', slug: 'a' }));

      expect(state.chapter()).toBe(2);
      expect(state.hovered()).toBe('b');
    });

    it('sets the view and keeps the slug only on a sheet', () => {
      statewise.dispatch(desktopRouteSynced({ view: 'sheet', slug: 'skyted' }));

      expect(state.view()).toBe('sheet');
      expect(state.slug()).toBe('skyted');
    });

    it('drops a slug handed to a view other than sheet', () => {
      statewise.dispatch(desktopRouteSynced({ view: 'index', slug: 'skyted' }));

      expect(state.view()).toBe('index');
      expect(state.slug()).toBeNull();
    });

    it('resets the chapter and the hovered project on every navigation', () => {
      statewise.dispatch(desktopChapterChosen(3));
      statewise.dispatch(desktopHovered('skyted'));

      statewise.dispatch(desktopRouteSynced({ view: 'about', slug: null }));

      expect(state.chapter()).toBe(0);
      expect(state.hovered()).toBeNull();
    });

    it('closes the home preview on navigation when it is not pinned', () => {
      statewise.dispatch(desktopPreviewOpened('skyted'));

      statewise.dispatch(desktopRouteSynced({ view: 'index', slug: null }));

      expect(state.preview()).toBeNull();
    });

    it('keeps the preview open across navigation when it is pinned', () => {
      statewise.dispatch(desktopPreviewOpened('skyted'));
      statewise.dispatch(desktopPinToggled('preview'));

      statewise.dispatch(desktopRouteSynced({ view: 'index', slug: null }));

      expect(state.preview()).toBe('skyted');
    });

    it('appends a sheet slug to the visited list once, in first-visit order', () => {
      statewise.dispatch(desktopRouteSynced({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(desktopRouteSynced({ view: 'sheet', slug: 'b' }));
      statewise.dispatch(desktopRouteSynced({ view: 'sheet', slug: 'a' }));

      expect(state.visited()).toEqual(['a', 'b']);
    });

    it('selects the row of the sheet just left when arriving back on the index', () => {
      statewise.dispatch(desktopRouteSynced({ view: 'sheet', slug: 'a' }));

      statewise.dispatch(desktopRouteSynced({ view: 'index', slug: null }));

      expect(state.selected()).toBe('a');
    });

    it('leaves the selection untouched arriving on the index from a slug-less view', () => {
      statewise.dispatch(desktopSelected('kept'));

      statewise.dispatch(desktopRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(desktopRouteSynced({ view: 'index', slug: null }));

      expect(state.selected()).toBe('kept');
    });

    it('never resets the family or the section filters', () => {
      statewise.dispatch(desktopFiltered('personal'));
      statewise.dispatch(desktopSectionChosen(2));

      statewise.dispatch(desktopRouteSynced({ view: 'about', slug: null }));

      expect(state.family()).toBe('personal');
      expect(state.section()).toBe(2);
    });
  });

  describe('stationPinToggled', () => {
    it('flips only the given window', () => {
      statewise.dispatch(desktopPinToggled('index'));

      expect(state.pins()).toEqual({ ...NO_PINS, index: true });

      statewise.dispatch(desktopPinToggled('index'));

      expect(state.pins()).toEqual(NO_PINS);
    });
  });

  describe('stationWindowClosed', () => {
    it('unpins the window, staying false when it already was', () => {
      statewise.dispatch(desktopWindowClosed('about'));

      expect(state.pins().about).toBe(false);
    });

    it('also closes the preview itself, not merely its pin', () => {
      statewise.dispatch(desktopPreviewOpened('skyted'));
      statewise.dispatch(desktopPinToggled('preview'));

      statewise.dispatch(desktopWindowClosed('preview'));

      expect(state.pins().preview).toBe(false);
      expect(state.preview()).toBeNull();
    });

    it('leaves the preview slug alone when another window closes', () => {
      statewise.dispatch(desktopPreviewOpened('skyted'));

      statewise.dispatch(desktopWindowClosed('index'));

      expect(state.preview()).toBe('skyted');
    });
  });

  it('stationSelected sets the selection and clears the hovered project', () => {
    statewise.dispatch(desktopHovered('other'));

    statewise.dispatch(desktopSelected('picked'));

    expect(state.selected()).toBe('picked');
    expect(state.hovered()).toBeNull();

    statewise.dispatch(desktopSelected(null));

    expect(state.selected()).toBeNull();
  });

  it('stationFiltered sets the family filter', () => {
    statewise.dispatch(desktopFiltered('personal'));

    expect(state.family()).toBe('personal');
  });

  describe('stationChapterChosen', () => {
    it('sets the chapter', () => {
      statewise.dispatch(desktopChapterChosen(2));

      expect(state.chapter()).toBe(2);
    });

    it('clamps a negative chapter to zero', () => {
      statewise.dispatch(desktopChapterChosen(-1));

      expect(state.chapter()).toBe(0);
    });
  });

  it('stationSectionChosen sets the section', () => {
    statewise.dispatch(desktopSectionChosen(3));

    expect(state.section()).toBe(3);
  });

  it('stationPreviewOpened sets the preview and clears the hovered project', () => {
    statewise.dispatch(desktopHovered('other'));

    statewise.dispatch(desktopPreviewOpened('skyted'));

    expect(state.preview()).toBe('skyted');
    expect(state.hovered()).toBeNull();
  });

  it('stationPreviewClosed clears the preview', () => {
    statewise.dispatch(desktopPreviewOpened('skyted'));

    statewise.dispatch(desktopPreviewClosed());

    expect(state.preview()).toBeNull();
  });

  it('stationHovered sets the hovered project', () => {
    statewise.dispatch(desktopHovered('skyted'));

    expect(state.hovered()).toBe('skyted');

    statewise.dispatch(desktopHovered(null));

    expect(state.hovered()).toBeNull();
  });

  /** Closing the preview forgets what is open, not what was read. */
  it('keeps the body last previewed as the last preview, through a close', () => {
    statewise.dispatch(desktopPreviewOpened('a'));
    statewise.dispatch(desktopPreviewOpened('b'));
    statewise.dispatch(desktopPreviewClosed());

    expect(state.preview()).toBeNull();
    expect(state.lastPreview()).toBe('b');
  });
});
