import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { ObservatoryEffect } from './observatory.effect';
import { ObservatoryManager } from './observatory.manager';
import { resizeTo } from '@testing/doubles/browser.double';
import { provideRecordingRouter } from '@testing/fixtures/observatory.fixture';
import { provideTexts } from '@testing/fixtures/texts.fixture';

describe('ObservatoryManager', () => {
  let navigated: string[];
  let manager: ObservatoryManager;

  beforeEach(() => {
    navigated = [];

    TestBed.configureTestingModule({
      providers: [
        provideTexts(),
        provideStatewise({ effects: [ObservatoryEffect] }),
        provideRecordingRouter(navigated),
      ],
    });

    manager = TestBed.inject(ObservatoryManager);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const holdTwo = (): void => {
    manager.syncRoute('sheet', 'a');
    manager.togglePin('sheet');
    manager.syncRoute('sheet', 'b');
    manager.togglePin('sheet');
    manager.syncRoute('sheet', 'c');
  };

  it('exposes its state read-only', () => {
    expect('set' in manager.view).toBe(false);
    expect('set' in manager.slug).toBe(false);
    expect('set' in manager.pins).toBe(false);
    expect('set' in manager.preview).toBe(false);
    expect('set' in manager.lastPreview).toBe(false);
    expect('set' in manager.selected).toBe(false);
    expect('set' in manager.visited).toBe(false);
    expect('set' in manager.family).toBe(false);
    expect('set' in manager.chapter).toBe(false);
    expect('set' in manager.section).toBe(false);
    expect('set' in manager.hovered).toBe(false);
    expect('set' in manager.lastSheet).toBe(false);
    expect('set' in manager.resume).toBe(false);
  });

  it('says which sheet to resume', () => {
    manager.syncRoute('sheet', 'skyted');
    manager.chooseChapter(1);
    manager.syncRoute('home');

    expect(manager.resume()).toEqual({ slug: 'skyted', chapter: 1 });
  });

  it('docks the pinned sheet it last showed once the reader opens another view', () => {
    manager.syncRoute('sheet', 'a');
    manager.togglePin('sheet');

    manager.syncRoute('about');

    expect(manager.docked()).toEqual(['sheet']);
    expect(manager.lastSheet()).toBe('a');
  });

  describe('minimizing', () => {
    it('hides the window without closing it: it stays open, pinned and kept', () => {
      manager.syncRoute('index');
      manager.togglePin('index');

      manager.minimize('index');

      expect(manager.showsList()).toBe(false);
      expect(manager.opensList()).toBe(true);
      expect(manager.pins().index).toBe(true);
      expect(manager.kept()).toEqual(['index']);
      expect(manager.view()).toBe('index');
    });

    it('shows it again once restored', () => {
      manager.syncRoute('sheet', 'a');
      manager.minimize('sheet');

      expect(manager.showsSheet()).toBe(false);
      expect(manager.opensSheet()).toBe(true);

      manager.restore(['sheet']);

      expect(manager.showsSheet()).toBe(true);
    });

    it('does nothing on the phone, where no window is minimized', () => {
      resizeTo(390, 844);
      manager.syncRoute('about');
      manager.minimize('about');

      expect(manager.minimized().about).toBe(false);
      expect(manager.showsAbout()).toBe(true);
    });

    it('exposes its state read-only', () => {
      expect('set' in manager.minimized).toBe(false);
    });
  });

  it('keeps the windows the reader has seen, and shows only those of the view or pinned', () => {
    manager.syncRoute('about');
    manager.syncRoute('sheet', 'a');
    manager.syncRoute('home');

    expect(manager.kept()).toEqual(['about', 'sheet']);
    expect(manager.showsAbout()).toBe(false);
    expect(manager.showsSheet()).toBe(false);

    manager.syncRoute('not-found');
    expect(manager.showsSheet()).toBe(true);
  });

  it.each<{
    case: string;
    arrange: (manager: ObservatoryManager) => void;
    shows: 'showsList' | 'showsAbout' | 'showsSheet' | 'showsPreview';
    expected: boolean;
  }>([
    {
      case: 'the list when the index is the current view',
      arrange: (m) => m.syncRoute('index'),
      shows: 'showsList',
      expected: true,
    },
    {
      case: 'the list when the index is pinned over another view',
      arrange: (m) => {
        m.syncRoute('home');
        m.togglePin('index');
      },
      shows: 'showsList',
      expected: true,
    },
    {
      case: 'no list otherwise',
      arrange: (m) => m.syncRoute('home'),
      shows: 'showsList',
      expected: false,
    },
    {
      case: 'about when it is the current view',
      arrange: (m) => m.syncRoute('about'),
      shows: 'showsAbout',
      expected: true,
    },
    {
      case: 'about when it is pinned over another view',
      arrange: (m) => {
        m.syncRoute('home');
        m.togglePin('about');
      },
      shows: 'showsAbout',
      expected: true,
    },
    {
      case: 'no about otherwise',
      arrange: (m) => m.syncRoute('home'),
      shows: 'showsAbout',
      expected: false,
    },
    {
      case: 'the sheet when it is the current view',
      arrange: (m) => m.syncRoute('sheet', 'skyted'),
      shows: 'showsSheet',
      expected: true,
    },
    {
      case: 'the sheet when it is pinned over another view',
      arrange: (m) => {
        m.syncRoute('sheet', 'skyted');
        m.togglePin('sheet');
        m.syncRoute('index');
      },
      shows: 'showsSheet',
      expected: true,
    },
    {
      case: 'no sheet otherwise',
      arrange: (m) => m.syncRoute('index'),
      shows: 'showsSheet',
      expected: false,
    },
    {
      case: 'the preview on home once one is open',
      arrange: (m) => {
        m.syncRoute('home');
        m.togglePreview('skyted');
      },
      shows: 'showsPreview',
      expected: true,
    },
    {
      case: 'the preview away from home when it is pinned',
      arrange: (m) => {
        m.syncRoute('index');
        m.togglePreview('skyted');
        m.togglePin('preview');
      },
      shows: 'showsPreview',
      expected: true,
    },
    {
      case: 'no preview away from home when it is not pinned',
      arrange: (m) => {
        m.syncRoute('index');
        m.togglePreview('skyted');
      },
      shows: 'showsPreview',
      expected: false,
    },
    {
      case: 'no preview when nothing is open, even on home',
      arrange: (m) => m.syncRoute('home'),
      shows: 'showsPreview',
      expected: false,
    },
  ])('shows $case', ({ arrange, shows, expected }) => {
    arrange(manager);

    expect(manager[shows]()).toBe(expected);
  });

  it.each<{
    case: string;
    act: (manager: ObservatoryManager) => void;
    read: (manager: ObservatoryManager) => unknown;
    expected: unknown;
  }>([
    {
      case: 'syncRoute dispatches the address change',
      act: (m) => m.syncRoute('sheet', 'skyted'),
      read: (m) => [m.view(), m.slug()],
      expected: ['sheet', 'skyted'],
    },
    {
      case: 'togglePin dispatches the pin flip',
      act: (m) => m.togglePin('about'),
      read: (m) => m.pins().about,
      expected: true,
    },
    {
      case: 'select dispatches the selection',
      act: (m) => m.select('skyted'),
      read: (m) => m.selected(),
      expected: 'skyted',
    },
    {
      case: 'filter dispatches the family filter',
      act: (m) => m.filter('personal'),
      read: (m) => m.family(),
      expected: 'personal',
    },
    {
      case: 'chooseChapter dispatches the chapter',
      act: (m) => m.chooseChapter(2),
      read: (m) => m.chapter(),
      expected: 2,
    },
    {
      case: 'chooseSection dispatches the section',
      act: (m) => m.chooseSection(2),
      read: (m) => m.section(),
      expected: 2,
    },
    {
      case: 'hover dispatches the hovered project',
      act: (m) => m.hover('skyted'),
      read: (m) => m.hovered(),
      expected: 'skyted',
    },
  ])('$case', ({ act, read, expected }) => {
    act(manager);

    expect(read(manager)).toEqual(expected);
  });

  describe('canStepBack', () => {
    it('is true on an index with a row open, and on a home page with a preview', () => {
      manager.syncRoute('index');
      manager.select('skyted');
      expect(manager.canStepBack()).toBe(true);

      manager.syncRoute('home');
      manager.openPreview('skyted');
      expect(manager.canStepBack()).toBe(true);
    });

    it('is false where the void would close nothing, even on a sheet or about', () => {
      manager.syncRoute('home');
      expect(manager.canStepBack()).toBe(false);
      manager.syncRoute('index');
      expect(manager.canStepBack()).toBe(false);
      manager.syncRoute('about');
      expect(manager.canStepBack()).toBe(false);
      manager.syncRoute('sheet', 'skyted');
      expect(manager.canStepBack()).toBe(false);
    });
  });

  describe('togglePreview', () => {
    it('closes the preview when called again with the same slug', () => {
      manager.togglePreview('skyted');

      manager.togglePreview('skyted');

      expect(manager.preview()).toBeNull();
    });

    it('switches to another slug rather than closing', () => {
      manager.togglePreview('skyted');

      manager.togglePreview('other');

      expect(manager.preview()).toBe('other');
    });
  });

  it('opens the preview, never closing it, even called again with the slug already open', () => {
    manager.openPreview('skyted');

    manager.openPreview('skyted');

    expect(manager.preview()).toBe('skyted');
  });

  it('resolves close, once the effect has navigated home from the index', async () => {
    manager.syncRoute('index');
    await manager.close('index');

    expect(navigated).toEqual(['/']);
  });

  it.each<{
    case: string;
    act: (manager: ObservatoryManager) => Promise<void>;
  }>([
    {
      case: 'escape, once the effect has deselected the index row',
      act: async (m) => {
        m.syncRoute('index');
        m.select('skyted');
        await m.escape();
      },
    },
    {
      case: 'stepBack, once the effect has deselected the index row',
      act: async (m) => {
        m.syncRoute('index');
        m.select('skyted');
        await m.stepBack();
      },
    },
  ])('resolves $case, never navigating', async ({ act }) => {
    await act(manager);

    expect(manager.selected()).toBeNull();
    expect(navigated).toEqual([]);
  });

  describe('sheets held beside the one being read', () => {
    it('parks a pinned sheet when another project opens', () => {
      manager.syncRoute('sheet', 'a');
      manager.togglePin('sheet');

      manager.syncRoute('sheet', 'b');

      expect(manager.held().map(({ slug }) => slug)).toEqual(['a']);
      expect(manager.pins().sheet).toBe(false);
      expect(manager.slug()).toBe('b');
    });

    it('exposes the key of the window being read, and the held ones as read-only state', () => {
      holdTwo();

      expect(manager.sheetKey()).toBe(2);
      expect('set' in manager.held).toBe(false);
      expect('set' in manager.sheetKey).toBe(false);
    });

    it('holds nothing on the phone, where one sheet turns to the next project', () => {
      resizeTo(390, 844);
      manager.syncRoute('sheet', 'a');
      manager.togglePin('sheet');

      manager.syncRoute('sheet', 'b');

      expect(manager.held()).toEqual([]);
      expect(manager.pins().sheet).toBe(true);
    });

    it('shows no held sheet on the phone, even those held before the screen turned', () => {
      holdTwo();

      resizeTo(390, 844);

      expect(manager.held()).toEqual([]);
    });

    it('closes a held sheet without leaving the page', async () => {
      holdTwo();

      await manager.closeSheet(0);

      expect(manager.held().map(({ slug }) => slug)).toEqual(['b']);
      expect(manager.slug()).toBe('c');
      expect(navigated).toEqual([]);
    });

    it('closes the sheet being read as the window does: unpinned, then back to the list', async () => {
      holdTwo();

      await manager.closeSheet(manager.sheetKey());

      expect(navigated).toEqual(['/projets']);
      expect(manager.held()).toHaveLength(2);
    });

    it('unpins a held sheet by closing it', () => {
      holdTwo();

      manager.togglePinSheet(1);

      expect(manager.held().map(({ slug }) => slug)).toEqual(['a']);
    });

    it('pins the sheet being read like the window', () => {
      holdTwo();

      manager.togglePinSheet(manager.sheetKey());

      expect(manager.pins().sheet).toBe(true);
      expect(manager.held()).toHaveLength(2);
    });

    it('reduces a held sheet alone, and the sheet being read alone', () => {
      holdTwo();

      manager.minimizeSheet(0);

      expect(manager.held().map(({ minimized }) => minimized)).toEqual([
        true,
        false,
      ]);
      expect(manager.showsSheet()).toBe(true);

      manager.minimizeSheet(manager.sheetKey());

      expect(manager.showsSheet()).toBe(false);
      expect(manager.held().map(({ minimized }) => minimized)).toEqual([
        true,
        false,
      ]);
    });

    it('moves a held sheet to a chapter without moving the one being read', () => {
      holdTwo();

      manager.chooseSheetChapter(1, 2);

      expect(manager.held().map(({ chapter }) => chapter)).toEqual([0, 2]);
      expect(manager.chapter()).toBe(0);

      manager.chooseSheetChapter(manager.sheetKey(), 1);

      expect(manager.chapter()).toBe(1);
      expect(manager.held().map(({ chapter }) => chapter)).toEqual([0, 2]);
    });

    it('makes the sheet being read the heading of the page only while it is the view', () => {
      manager.syncRoute('sheet', 'a');
      manager.togglePin('sheet');

      expect(manager.headsSheet()).toBe(true);

      manager.syncRoute('home');

      expect(manager.headsSheet()).toBe(false);
      expect(manager.opensSheet()).toBe(true);
    });

    it('keeps the pinned sheet as the heading on the phone, as it always was', () => {
      resizeTo(390, 844);
      manager.syncRoute('sheet', 'a');
      manager.togglePin('sheet');

      manager.syncRoute('home');

      expect(manager.headsSheet()).toBe(true);
    });
  });
});
