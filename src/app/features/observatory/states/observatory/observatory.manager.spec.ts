import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { ObservatoryEffect } from './observatory.effect';
import { ObservatoryManager } from './observatory.manager';
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
  });

  it('docks the pinned sheet it last showed once the reader opens another view', () => {
    manager.syncRoute('sheet', 'a');
    manager.togglePin('sheet');

    manager.syncRoute('about');

    expect(manager.docked()).toEqual(['sheet']);
    expect(manager.lastSheet()).toBe('a');
  });

  it.each<{
    case: string;
    arrange: (manager: ObservatoryManager) => void;
    shows: 'showsList' | 'showsAbout' | 'showsPreview';
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
    it('is true on a sheet, an index with a row open, a home page with a preview', () => {
      manager.syncRoute('sheet', 'skyted');
      expect(manager.canStepBack()).toBe(true);

      manager.syncRoute('index');
      manager.select('skyted');
      expect(manager.canStepBack()).toBe(true);

      manager.syncRoute('home');
      manager.openPreview('skyted');
      expect(manager.canStepBack()).toBe(true);
    });

    it('is false where the void would close nothing', () => {
      manager.syncRoute('home');
      expect(manager.canStepBack()).toBe(false);
      manager.syncRoute('index');
      expect(manager.canStepBack()).toBe(false);
      manager.syncRoute('about');
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

  it.each<{
    case: string;
    act: (manager: ObservatoryManager) => Promise<void>;
    navigated: string;
  }>([
    {
      case: 'close, once the effect has navigated home from the index',
      act: async (m) => {
        m.syncRoute('index');
        await m.close('index');
      },
      navigated: '/',
    },
    {
      case: 'escape, once the effect has navigated back to the list from a sheet',
      act: async (m) => {
        m.syncRoute('sheet', 'skyted');
        await m.escape();
      },
      navigated: '/projets',
    },
    {
      case: 'stepBack, once the effect has navigated back to the list from a sheet',
      act: async (m) => {
        m.syncRoute('sheet', 'skyted');
        await m.stepBack();
      },
      navigated: '/projets',
    },
  ])('resolves $case', async ({ act, navigated: to }) => {
    await act(manager);

    expect(navigated).toEqual([to]);
  });
});
