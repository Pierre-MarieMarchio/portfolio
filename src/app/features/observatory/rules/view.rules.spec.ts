import { ObservatoryPins, ObservatoryView, ObservatoryWindow } from '../models';
import {
  AddressOf,
  closeLabelsOf,
  closeTargetOf,
  viewAtAddress,
  DockFrom,
  dockedOf,
  keptOf,
  parentOf,
  sheetOnShowOf,
  SheetFrom,
  stepBack,
  StepBackFrom,
  windowOf,
} from './view.rules';

const from = (
  view: ObservatoryView,
  overrides: Partial<StepBackFrom> = {},
): StepBackFrom => ({ view, selection: null, preview: null, ...overrides });

describe('stepBack', () => {
  it.each<[ObservatoryView, string | null]>([
    ['home', null],
    ['index', 'home'],
    ['about', 'home'],
    ['sheet', 'index'],
    ['not-found', 'index'],
  ])('gives %s the parent %s', (view, parent) => {
    expect(parentOf(view)).toBe(parent);
  });

  it('lets the index selection go before leaving the index', () => {
    expect(stepBack(from('index', { selection: 'a' }))).toBe('deselect');
  });

  it('closes an open preview on the home page', () => {
    expect(stepBack(from('home', { preview: 'a' }))).toBe('close-preview');
  });

  it.each<ObservatoryView>(['home', 'index', 'about', 'sheet', 'not-found'])(
    'has nothing to step back from a bare %s view',
    (view) => {
      expect(stepBack(from(view))).toBeNull();
    },
  );

  it('never leaves the scene for another page, even from a sheet or the about window', () => {
    expect(
      stepBack(from('sheet', { selection: 'a', preview: 'a' })),
    ).toBeNull();
    expect(
      stepBack(from('about', { selection: 'a', preview: 'a' })),
    ).toBeNull();
    expect(
      stepBack(from('not-found', { selection: 'a', preview: 'a' })),
    ).toBeNull();
  });

  it('leaves a preview alone away from the home page', () => {
    expect(stepBack(from('index', { preview: 'a' }))).toBeNull();
  });
});

describe('windowOf', () => {
  it.each<[ObservatoryView, ObservatoryWindow | null]>([
    ['home', null],
    ['index', 'index'],
    ['about', 'about'],
    ['sheet', 'sheet'],
    ['not-found', 'sheet'],
  ])('shows %s in the window %s', (view, shown) => {
    expect(windowOf(view)).toBe(shown);
  });
});

describe('closeTargetOf', () => {
  it.each<[ObservatoryWindow, ObservatoryView, string | null]>([
    ['sheet', 'sheet', 'index'],
    ['sheet', 'not-found', 'index'],
    ['index', 'index', 'home'],
    ['about', 'about', 'home'],
    ['index', 'sheet', null],
    ['about', 'home', null],
    ['preview', 'home', null],
    ['preview', 'index', null],
  ])('closing %s on %s leads to %s', (window, view, target) => {
    expect(closeTargetOf(window, view)).toBe(target);
  });
});

describe('closeLabelsOf', () => {
  const CLOSE_TO = { home: 'Home', index: 'Projects' };

  it.each<
    [ObservatoryView, Record<'about' | 'index' | 'sheet' | 'preview', string>]
  >([
    ['sheet', { about: '', index: '', sheet: 'Projects', preview: '' }],
    ['not-found', { about: '', index: '', sheet: 'Projects', preview: '' }],
    ['index', { about: '', index: 'Home', sheet: '', preview: '' }],
    ['about', { about: 'Home', index: '', sheet: '', preview: '' }],
    ['home', { about: '', index: '', sheet: '', preview: '' }],
  ])('words only the window of %s with where closing leads', (view, labels) => {
    expect(closeLabelsOf(view, CLOSE_TO)).toEqual({
      about: labels['about'],
      index: labels['index'],
      sheet: labels['sheet'],
    });
  });
});

describe('dockedOf', () => {
  const NONE: ObservatoryPins = {
    about: false,
    index: false,
    sheet: false,
    preview: false,
  };
  const dock = (
    view: ObservatoryView,
    pinned: readonly ObservatoryWindow[],
    overrides: Partial<DockFrom> = {},
  ): readonly ObservatoryWindow[] =>
    dockedOf({
      view,
      pins: Object.fromEntries(
        Object.keys(NONE).map((window) => [
          window,
          pinned.includes(window as ObservatoryWindow),
        ]),
      ) as ObservatoryPins,
      preview: null,
      lastSheet: null,
      ...overrides,
    });

  it('docks nothing while nothing is pinned', () => {
    expect(dock('about', [])).toEqual([]);
  });

  it('docks a pinned window the reader has left', () => {
    expect(dock('about', ['index'])).toEqual(['index']);
  });

  it('keeps the window of the current view open, pinned or not', () => {
    expect(dock('index', ['index'])).toEqual([]);
    expect(dock('not-found', ['sheet'], { lastSheet: 'a' })).toEqual([]);
  });

  it('docks the pinned sheet once left, if it has a project to reopen', () => {
    expect(dock('about', ['sheet'], { lastSheet: 'a' })).toEqual(['sheet']);
    expect(dock('about', ['sheet'])).toEqual([]);
  });

  it('keeps the preview open on the home page, and docks it elsewhere', () => {
    expect(dock('home', ['preview', 'about'], { preview: 'a' })).toEqual([
      'about',
    ]);
    expect(dock('index', ['preview'], { preview: 'a' })).toEqual(['preview']);
    expect(dock('index', ['preview'])).toEqual([]);
  });

  it('lists the docked windows in a fixed order', () => {
    expect(
      dock('home', ['preview', 'sheet', 'index', 'about'], {
        preview: 'a',
        lastSheet: 'b',
      }),
    ).toEqual(['about', 'index', 'sheet']);
  });
});

describe('keptOf', () => {
  const NONE: ObservatoryPins = {
    about: false,
    index: false,
    sheet: false,
    preview: false,
  };

  it('mounts nothing before the reader opens a window', () => {
    expect(keptOf({ view: 'home', pins: NONE, seen: [] })).toEqual([]);
  });

  it('keeps every window the reader has seen, in a fixed order', () => {
    expect(
      keptOf({ view: 'home', pins: NONE, seen: ['sheet', 'about'] }),
    ).toEqual(['about', 'sheet']);
  });

  it('keeps the window of the current view and the pinned ones, seen or not', () => {
    expect(
      keptOf({ view: 'not-found', pins: { ...NONE, index: true }, seen: [] }),
    ).toEqual(['index', 'sheet']);
  });

  it('leaves the preview to its own rule', () => {
    expect(
      keptOf({ view: 'home', pins: { ...NONE, preview: true }, seen: [] }),
    ).toEqual([]);
  });
});

const FRENCH: AddressOf = (view) =>
  ({ home: '/', index: '/projets', about: '/a-propos', sheet: '/projet' })[
    view
  ];
const ENGLISH: AddressOf = (view) =>
  ({
    home: '/en',
    index: '/en/projects',
    about: '/en/about',
    sheet: '/en/project',
  })[view];

describe('viewAtAddress', () => {
  it.each<[string, AddressOf, ObservatoryView, string | null]>([
    ['/', FRENCH, 'home', null],
    ['', FRENCH, 'home', null],
    ['/?from=mail', FRENCH, 'home', null],
    ['/projets', FRENCH, 'index', null],
    ['/projets/', FRENCH, 'index', null],
    ['/a-propos#contact', FRENCH, 'about', null],
    ['/projet/skyted-voice', FRENCH, 'sheet', 'skyted-voice'],
    ['/en', ENGLISH, 'home', null],
    ['/en/', ENGLISH, 'home', null],
    ['/en/projects', ENGLISH, 'index', null],
    ['/en/about', ENGLISH, 'about', null],
    ['/en/project/skyted-voice/', ENGLISH, 'sheet', 'skyted-voice'],
  ])('reads %s as the view it addresses', (path, addresses, view, slug) => {
    expect(viewAtAddress(path, addresses)).toEqual({ view, slug });
  });

  it.each([
    ['/nowhere', FRENCH],
    ['/projet', FRENCH],
    ['/projet/a/b', FRENCH],
    ['/projets/more', FRENCH],
    ['/en/nowhere', ENGLISH],
  ])('reads %s as an unknown address', (path, addresses) => {
    expect(viewAtAddress(path, addresses)).toEqual({
      view: 'not-found',
      slug: null,
    });
  });
});

describe('sheetOnShowOf', () => {
  const base: SheetFrom = {
    isShown: true,
    isNotFound: false,
    slug: 'alpha',
    chapter: 2,
  };
  const previous = { slug: 'beta', chapter: 1 };

  it('takes the first value as it comes', () => {
    expect(sheetOnShowOf(base, undefined)).toEqual({
      slug: 'alpha',
      chapter: 2,
    });
  });

  it('follows the sheet while it is shown', () => {
    expect(sheetOnShowOf(base, previous)).toEqual({
      slug: 'alpha',
      chapter: 2,
    });
  });

  it('keeps the previous value once the sheet is hidden', () => {
    expect(sheetOnShowOf({ ...base, isShown: false }, previous)).toBe(previous);
  });

  it('keeps the previous value when the slug is null away from a 404', () => {
    expect(sheetOnShowOf({ ...base, slug: null }, previous)).toBe(previous);
  });

  it('shows a null slug on a real 404', () => {
    expect(
      sheetOnShowOf({ ...base, slug: 'ghost', isNotFound: true }, previous),
    ).toEqual({ slug: null, chapter: 2 });
  });
});
