import { TestBed } from '@angular/core/testing';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import {
  observatoryChapterChosen,
  observatoryFiltered,
  observatoryHovered,
  observatoryPinToggled,
  observatoryPreviewClosed,
  observatoryPreviewOpened,
  observatoryRouteSynced,
  observatorySectionChosen,
  observatorySelected,
  observatoryWindowClosed,
} from './observatory.action';
import { NO_PINS, ObservatoryState } from './observatory.state';
import { observatoryUpdater } from './observatory.updater';

describe('stationUpdater', () => {
  let statewise: Statewise;
  let state: ObservatoryState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewiseTesting()],
    });

    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(observatoryUpdater),
    );
    state = TestBed.inject(ObservatoryState);
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
    it('resets nothing when the view and its slug are the same', () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(observatoryChapterChosen(2));
      statewise.dispatch(observatoryHovered('b'));

      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));

      expect(state.chapter()).toBe(2);
      expect(state.hovered()).toBe('b');
    });

    it('sets the view and keeps the slug only on a sheet', () => {
      statewise.dispatch(
        observatoryRouteSynced({ view: 'sheet', slug: 'skyted' }),
      );

      expect(state.view()).toBe('sheet');
      expect(state.slug()).toBe('skyted');
    });

    it('drops a slug handed to a view other than sheet', () => {
      statewise.dispatch(
        observatoryRouteSynced({ view: 'index', slug: 'skyted' }),
      );

      expect(state.view()).toBe('index');
      expect(state.slug()).toBeNull();
    });

    it('resets the chapter and the hovered project on every navigation', () => {
      statewise.dispatch(observatoryChapterChosen(3));
      statewise.dispatch(observatoryHovered('skyted'));

      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));

      expect(state.chapter()).toBe(0);
      expect(state.hovered()).toBeNull();
    });

    it('closes the home preview on navigation when it is not pinned', () => {
      statewise.dispatch(observatoryPreviewOpened('skyted'));

      statewise.dispatch(observatoryRouteSynced({ view: 'index', slug: null }));

      expect(state.preview()).toBeNull();
    });

    it('keeps the preview open across navigation when it is pinned', () => {
      statewise.dispatch(observatoryPreviewOpened('skyted'));
      statewise.dispatch(observatoryPinToggled('preview'));

      statewise.dispatch(observatoryRouteSynced({ view: 'index', slug: null }));

      expect(state.preview()).toBe('skyted');
    });

    it('appends a sheet slug to the visited list once, in first-visit order', () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'b' }));
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));

      expect(state.visited()).toEqual(['a', 'b']);
    });

    it('selects the row of the sheet just left when arriving back on the index', () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));

      statewise.dispatch(observatoryRouteSynced({ view: 'index', slug: null }));

      expect(state.selected()).toBe('a');
    });

    it('leaves the selection untouched arriving on the index from a slug-less view', () => {
      statewise.dispatch(observatorySelected('kept'));

      statewise.dispatch(observatoryRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(observatoryRouteSynced({ view: 'index', slug: null }));

      expect(state.selected()).toBe('kept');
    });

    it('never resets the family or the section filters', () => {
      statewise.dispatch(observatoryFiltered('personal'));
      statewise.dispatch(observatorySectionChosen(2));

      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));

      expect(state.family()).toBe('personal');
      expect(state.section()).toBe(2);
    });
  });

  describe('stationPinToggled', () => {
    it('flips only the given window', () => {
      statewise.dispatch(observatoryPinToggled('index'));

      expect(state.pins()).toEqual({ ...NO_PINS, index: true });

      statewise.dispatch(observatoryPinToggled('index'));

      expect(state.pins()).toEqual(NO_PINS);
    });
  });

  describe('stationWindowClosed', () => {
    it('unpins the window, staying false when it already was', () => {
      statewise.dispatch(observatoryWindowClosed('about'));

      expect(state.pins().about).toBe(false);
    });

    it('also closes the preview itself, not merely its pin', () => {
      statewise.dispatch(observatoryPreviewOpened('skyted'));
      statewise.dispatch(observatoryPinToggled('preview'));

      statewise.dispatch(observatoryWindowClosed('preview'));

      expect(state.pins().preview).toBe(false);
      expect(state.preview()).toBeNull();
    });

    it('leaves the preview slug alone when another window closes', () => {
      statewise.dispatch(observatoryPreviewOpened('skyted'));

      statewise.dispatch(observatoryWindowClosed('index'));

      expect(state.preview()).toBe('skyted');
    });
  });

  it('stationSelected sets the selection and clears the hovered project', () => {
    statewise.dispatch(observatoryHovered('other'));

    statewise.dispatch(observatorySelected('picked'));

    expect(state.selected()).toBe('picked');
    expect(state.hovered()).toBeNull();

    statewise.dispatch(observatorySelected(null));

    expect(state.selected()).toBeNull();
  });

  it('stationFiltered sets the family filter', () => {
    statewise.dispatch(observatoryFiltered('personal'));

    expect(state.family()).toBe('personal');
  });

  describe('stationChapterChosen', () => {
    it('sets the chapter', () => {
      statewise.dispatch(observatoryChapterChosen(2));

      expect(state.chapter()).toBe(2);
    });

    it('clamps a negative chapter to zero', () => {
      statewise.dispatch(observatoryChapterChosen(-1));

      expect(state.chapter()).toBe(0);
    });
  });

  it('stationSectionChosen sets the section', () => {
    statewise.dispatch(observatorySectionChosen(3));

    expect(state.section()).toBe(3);
  });

  it('stationPreviewOpened sets the preview and clears the hovered project', () => {
    statewise.dispatch(observatoryHovered('other'));

    statewise.dispatch(observatoryPreviewOpened('skyted'));

    expect(state.preview()).toBe('skyted');
    expect(state.hovered()).toBeNull();
  });

  it('stationPreviewClosed clears the preview', () => {
    statewise.dispatch(observatoryPreviewOpened('skyted'));

    statewise.dispatch(observatoryPreviewClosed());

    expect(state.preview()).toBeNull();
  });

  it('stationHovered sets the hovered project', () => {
    statewise.dispatch(observatoryHovered('skyted'));

    expect(state.hovered()).toBe('skyted');

    statewise.dispatch(observatoryHovered(null));

    expect(state.hovered()).toBeNull();
  });

  it('keeps the body last previewed as the last preview, through a close', () => {
    statewise.dispatch(observatoryPreviewOpened('a'));
    statewise.dispatch(observatoryPreviewOpened('b'));
    statewise.dispatch(observatoryPreviewClosed());

    expect(state.preview()).toBeNull();
    expect(state.lastPreview()).toBe('b');
  });
});
