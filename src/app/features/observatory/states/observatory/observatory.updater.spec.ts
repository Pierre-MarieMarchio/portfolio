import { TestBed } from '@angular/core/testing';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import {
  observatoryChapterChosen,
  observatoryHeldSheetClosed,
  observatoryHeldSheetEdited,
  observatoryFiltered,
  observatoryHovered,
  observatoryPinToggled,
  observatoryPreviewClosed,
  observatoryPreviewOpened,
  observatoryRouteSynced,
  observatorySectionChosen,
  observatorySelected,
  observatoryWindowClosed,
  observatoryWindowMinimized,
  observatoryWindowPrepared,
  observatoryWindowsRestored,
} from './observatory.action';
import { NO_PINS, NONE_MINIMIZED, ObservatoryState } from './observatory.state';
import { observatoryUpdater } from './observatory.updater';

describe('observatoryUpdater', () => {
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

  const arrive = (slug: string, canHoldSheets = true): void => {
    statewise.dispatch(
      observatoryRouteSynced({ view: 'sheet', slug, canHoldSheets }),
    );
  };

  const leave = (view: 'index' | 'about' | 'home'): void => {
    statewise.dispatch(
      observatoryRouteSynced({ view, slug: null, canHoldSheets: true }),
    );
  };

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
    expect(state.lastSheet()).toBeNull();
    expect(state.seen()).toEqual([]);
  });

  describe('observatoryRouteSynced', () => {
    it('remembers the last sheet opened once the reader leaves it', () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'b' }));

      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));

      expect(state.lastSheet()).toBe('b');
    });

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

    it('notes each window the reader has seen once, in first-visit order', () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));
      statewise.dispatch(observatoryRouteSynced({ view: 'home', slug: null }));
      statewise.dispatch(
        observatoryRouteSynced({ view: 'not-found', slug: null }),
      );
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));

      expect(state.seen()).toEqual(['about', 'sheet']);
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

  it('observatoryWindowPrepared notes a window as seen before the reader opens it, once', () => {
    statewise.dispatch(observatoryWindowPrepared('index'));
    statewise.dispatch(observatoryRouteSynced({ view: 'index', slug: null }));
    statewise.dispatch(observatoryWindowPrepared('about'));

    expect(state.seen()).toEqual(['index', 'about']);
    expect(state.view()).toBe('index');
  });

  describe('observatoryPinToggled', () => {
    it('flips only the given window', () => {
      statewise.dispatch(observatoryPinToggled('index'));

      expect(state.pins()).toEqual({ ...NO_PINS, index: true });

      statewise.dispatch(observatoryPinToggled('index'));

      expect(state.pins()).toEqual(NO_PINS);
    });
  });

  describe('observatoryWindowMinimized', () => {
    it('starts with no window minimized', () => {
      expect(state.minimized()).toEqual(NONE_MINIMIZED);
    });

    it('minimizes only the given window, leaving its pin alone', () => {
      statewise.dispatch(observatoryPinToggled('index'));

      statewise.dispatch(observatoryWindowMinimized('index'));

      expect(state.minimized()).toEqual({ ...NONE_MINIMIZED, index: true });
      expect(state.pins().index).toBe(true);
    });
  });

  describe('observatoryWindowsRestored', () => {
    it('restores the given windows and no other', () => {
      statewise.dispatch(observatoryWindowMinimized('index'));
      statewise.dispatch(observatoryWindowMinimized('sheet'));
      statewise.dispatch(observatoryWindowMinimized('about'));

      statewise.dispatch(observatoryWindowsRestored(['index', 'sheet']));

      expect(state.minimized()).toEqual({ ...NONE_MINIMIZED, about: true });
    });
  });

  describe('a minimized window and the route', () => {
    it('is restored when the reader arrives on its view', () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'index', slug: null }));
      statewise.dispatch(observatoryPinToggled('index'));
      statewise.dispatch(observatoryWindowMinimized('index'));
      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));

      expect(state.minimized().index).toBe(true);

      statewise.dispatch(observatoryRouteSynced({ view: 'index', slug: null }));

      expect(state.minimized().index).toBe(false);
    });

    it('stays minimized while pinned, and is forgotten once the reader leaves an unpinned window', () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));
      statewise.dispatch(observatoryWindowMinimized('about'));
      statewise.dispatch(observatoryPinToggled('about'));
      statewise.dispatch(observatoryWindowMinimized('sheet'));

      statewise.dispatch(observatoryRouteSynced({ view: 'home', slug: null }));

      expect(state.minimized()).toEqual({ ...NONE_MINIMIZED, about: true });
    });

    it('is restored by the window closing', () => {
      statewise.dispatch(observatoryWindowMinimized('sheet'));

      statewise.dispatch(observatoryWindowClosed('sheet'));

      expect(state.minimized().sheet).toBe(false);
    });
  });

  describe('observatoryWindowClosed', () => {
    it('unpins the window, staying unpinned when it already was', () => {
      statewise.dispatch(observatoryPinToggled('about'));

      statewise.dispatch(observatoryWindowClosed('about'));
      expect(state.pins().about).toBe(false);

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

  it('observatorySelected sets the selection and clears the hovered project', () => {
    statewise.dispatch(observatoryHovered('other'));

    statewise.dispatch(observatorySelected('picked'));

    expect(state.selected()).toBe('picked');
    expect(state.hovered()).toBeNull();

    statewise.dispatch(observatorySelected(null));

    expect(state.selected()).toBeNull();
  });

  it('observatoryFiltered sets the family filter', () => {
    statewise.dispatch(observatoryFiltered('personal'));

    expect(state.family()).toBe('personal');
  });

  describe('observatoryChapterChosen', () => {
    it('sets the chapter', () => {
      statewise.dispatch(observatoryChapterChosen(2));

      expect(state.chapter()).toBe(2);
    });

    it('clamps a negative chapter to zero', () => {
      statewise.dispatch(observatoryChapterChosen(-1));

      expect(state.chapter()).toBe(0);
    });
  });

  it('observatorySectionChosen sets the section', () => {
    statewise.dispatch(observatorySectionChosen(3));

    expect(state.section()).toBe(3);
  });

  it('observatoryPreviewOpened sets the preview and clears the hovered project', () => {
    statewise.dispatch(observatoryHovered('other'));

    statewise.dispatch(observatoryPreviewOpened('skyted'));

    expect(state.preview()).toBe('skyted');
    expect(state.hovered()).toBeNull();
  });

  it('observatoryPreviewClosed clears the preview', () => {
    statewise.dispatch(observatoryPreviewOpened('skyted'));

    statewise.dispatch(observatoryPreviewClosed());

    expect(state.preview()).toBeNull();
  });

  it('observatoryHovered sets the hovered project', () => {
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

  describe('the place kept for the projects tab', () => {
    it('keeps the sheet being read, with its chapter, once the reader leaves it', () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(observatoryChapterChosen(2));

      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));

      expect(state.resume()).toEqual({ slug: 'a', chapter: 2 });
    });

    it('reopens the sheet on the chapter it was left at', () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(observatoryChapterChosen(2));
      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));

      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));

      expect(state.chapter()).toBe(2);
    });

    it('opens another sheet on its first chapter', () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(observatoryChapterChosen(2));
      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));

      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'b' }));

      expect(state.chapter()).toBe(0);
    });

    it('forgets the sheet once the reader is back on the list', () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(observatoryChapterChosen(2));

      statewise.dispatch(observatoryRouteSynced({ view: 'index', slug: null }));
      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));

      expect(state.resume()).toBeNull();
      expect(state.chapter()).toBe(0);
    });

    it('follows the chapters chosen on the sheet being read, and no other view', () => {
      statewise.dispatch(observatoryRouteSynced({ view: 'sheet', slug: 'a' }));
      statewise.dispatch(observatoryRouteSynced({ view: 'about', slug: null }));

      statewise.dispatch(observatoryChapterChosen(3));

      expect(state.resume()).toEqual({ slug: 'a', chapter: 0 });
    });
  });

  describe('sheets held beside the one being read', () => {
    it('starts with none held, in the first window', () => {
      expect(state.held()).toEqual([]);
      expect(state.sheetKey()).toBe(0);
    });

    it('parks a pinned sheet with its chapter when the reader opens another project', () => {
      arrive('a');
      statewise.dispatch(observatoryChapterChosen(2));
      statewise.dispatch(observatoryPinToggled('sheet'));

      arrive('b');

      expect(state.held()).toEqual([
        { key: 0, slug: 'a', chapter: 2, minimized: false },
      ]);
      expect(state.sheetKey()).toBe(1);
      expect(state.slug()).toBe('b');
      expect(state.chapter()).toBe(0);
    });

    it('keeps the chapter of the pinned sheet when the reader comes back to it from the list', () => {
      arrive('a');
      statewise.dispatch(observatoryChapterChosen(2));
      statewise.dispatch(observatoryPinToggled('sheet'));
      leave('index');

      arrive('a');

      expect(state.chapter()).toBe(2);
      expect(state.held()).toEqual([]);
      expect(state.pins().sheet).toBe(true);
    });

    it('opens the new project unpinned and unminimized, in a window of its own', () => {
      arrive('a');
      statewise.dispatch(observatoryPinToggled('sheet'));
      statewise.dispatch(observatoryWindowMinimized('sheet'));

      arrive('b');

      expect(state.pins().sheet).toBe(false);
      expect(state.minimized().sheet).toBe(false);
      expect(state.held()[0]?.minimized).toBe(true);
    });

    it('leaves an unpinned sheet alone: the next project takes its window', () => {
      arrive('a');

      arrive('b');

      expect(state.held()).toEqual([]);
      expect(state.sheetKey()).toBe(0);
    });

    it('keeps a pinned sheet where it is while the reader changes page, and parks it at the next project', () => {
      arrive('a');
      statewise.dispatch(observatoryChapterChosen(3));
      statewise.dispatch(observatoryPinToggled('sheet'));

      leave('home');

      expect(state.held()).toEqual([]);
      expect(state.pins().sheet).toBe(true);
      expect(state.chapter()).toBe(3);

      arrive('b');

      expect(state.held()).toEqual([
        { key: 0, slug: 'a', chapter: 3, minimized: false },
      ]);
    });

    it('forgets the chapter of an unpinned sheet when the reader leaves it', () => {
      arrive('a');
      statewise.dispatch(observatoryChapterChosen(3));

      leave('home');

      expect(state.chapter()).toBe(0);
    });

    it('parks several sheets, each in its own window', () => {
      arrive('a');
      statewise.dispatch(observatoryPinToggled('sheet'));
      arrive('b');
      statewise.dispatch(observatoryPinToggled('sheet'));
      leave('home');

      arrive('c');

      expect(state.held().map(({ key, slug }) => [key, slug])).toEqual([
        [0, 'a'],
        [1, 'b'],
      ]);
      expect(state.sheetKey()).toBe(2);
    });

    it('brings a parked sheet back when the reader opens it again: pinned, on its chapter, no duplicate', () => {
      arrive('a');
      statewise.dispatch(observatoryChapterChosen(2));
      statewise.dispatch(observatoryPinToggled('sheet'));
      arrive('b');

      arrive('a');

      expect(state.held()).toEqual([]);
      expect(state.sheetKey()).toBe(0);
      expect(state.pins().sheet).toBe(true);
      expect(state.chapter()).toBe(2);
      expect(state.slug()).toBe('a');
    });

    it('restores a reduced sheet that the reader opens again', () => {
      arrive('a');
      statewise.dispatch(observatoryPinToggled('sheet'));
      statewise.dispatch(observatoryWindowMinimized('sheet'));
      arrive('b');
      statewise.dispatch(
        observatoryHeldSheetEdited({ key: 0, minimized: true }),
      );

      arrive('a');

      expect(state.minimized().sheet).toBe(false);
    });

    it('parks the pinned sheet it leaves while bringing another one back', () => {
      arrive('a');
      statewise.dispatch(observatoryPinToggled('sheet'));
      arrive('b');
      statewise.dispatch(observatoryPinToggled('sheet'));
      arrive('c');

      arrive('a');

      expect(state.held().map(({ slug }) => slug)).toEqual(['b']);
      expect(state.sheetKey()).toBe(0);
      expect(state.pins().sheet).toBe(true);
    });

    it('holds nothing where the format keeps a single sheet: the pinned window turns to the next project', () => {
      arrive('a', false);
      statewise.dispatch(observatoryPinToggled('sheet'));

      arrive('b', false);

      expect(state.held()).toEqual([]);
      expect(state.pins().sheet).toBe(true);
      expect(state.sheetKey()).toBe(0);
    });

    it('does not park the sheet on a route that is not a sheet', () => {
      arrive('a');
      statewise.dispatch(observatoryPinToggled('sheet'));

      leave('about');
      leave('index');

      expect(state.held()).toEqual([]);
      expect(state.sheetKey()).toBe(0);
    });

    describe('observatoryHeldSheetEdited', () => {
      beforeEach(() => {
        arrive('a');
        statewise.dispatch(observatoryPinToggled('sheet'));
        arrive('b');
        statewise.dispatch(observatoryPinToggled('sheet'));
        arrive('c');
      });

      it('reduces only the given sheet', () => {
        statewise.dispatch(
          observatoryHeldSheetEdited({ key: 1, minimized: true }),
        );

        expect(state.held().map(({ minimized }) => minimized)).toEqual([
          false,
          true,
        ]);
      });

      it('moves only the given sheet to a chapter', () => {
        statewise.dispatch(observatoryHeldSheetEdited({ key: 0, chapter: 2 }));

        expect(state.held().map(({ chapter }) => chapter)).toEqual([2, 0]);
        expect(state.chapter()).toBe(0);
      });

      it('ignores a key that names no held sheet', () => {
        statewise.dispatch(observatoryHeldSheetEdited({ key: 9, chapter: 2 }));

        expect(state.held().map(({ chapter }) => chapter)).toEqual([0, 0]);
      });
    });

    it('observatoryHeldSheetClosed removes only the given sheet, leaving the one being read', () => {
      arrive('a');
      statewise.dispatch(observatoryPinToggled('sheet'));
      arrive('b');
      statewise.dispatch(observatoryPinToggled('sheet'));
      arrive('c');

      statewise.dispatch(observatoryHeldSheetClosed(0));

      expect(state.held().map(({ slug }) => slug)).toEqual(['b']);
      expect(state.slug()).toBe('c');
    });

    it('restores every reduced held sheet along with the sheet windows', () => {
      arrive('a');
      statewise.dispatch(observatoryPinToggled('sheet'));
      arrive('b');
      statewise.dispatch(observatoryPinToggled('sheet'));
      arrive('c');
      statewise.dispatch(
        observatoryHeldSheetEdited({ key: 0, minimized: true }),
      );
      statewise.dispatch(
        observatoryHeldSheetEdited({ key: 1, minimized: true }),
      );

      statewise.dispatch(observatoryWindowsRestored(['index']));

      expect(state.held().every(({ minimized }) => minimized)).toBe(true);

      statewise.dispatch(observatoryWindowsRestored(['sheet']));

      expect(state.held().some(({ minimized }) => minimized)).toBe(false);
    });
  });
});
