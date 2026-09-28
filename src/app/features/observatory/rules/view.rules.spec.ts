import { ObservatoryPins, ObservatoryView, ObservatoryWindow } from '../models';
import {
  AddressOf,
  closeTargetOf,
  viewAtAddress,
  DockFrom,
  dockedOf,
  keptOf,
  parentOf,
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

  describe('with Escape', () => {
    it('lets the index row go before leaving the index', () => {
      expect(stepBack('escape', from('index', { selection: 'a' }))).toEqual({
        kind: 'deselect',
      });
    });

    it.each<[ObservatoryView, string]>([
      ['index', 'home'],
      ['about', 'home'],
      ['sheet', 'index'],
      ['not-found', 'index'],
    ])('leaves %s for %s', (view, to) => {
      expect(stepBack('escape', from(view))).toEqual({ kind: 'navigate', to });
    });

    it('closes the home preview, and does nothing on a bare home page', () => {
      expect(stepBack('escape', from('home', { preview: 'a' }))).toEqual({
        kind: 'close-preview',
      });
      expect(stepBack('escape', from('home'))).toBeNull();
    });
  });

  describe('with a click in the void', () => {
    it.each<[string, StepBackFrom, ReturnType<typeof stepBack>]>([
      [
        'leaves a sheet for the list',
        from('sheet'),
        { kind: 'navigate', to: 'index' },
      ],
      [
        'lets the index row go',
        from('index', { selection: 'a' }),
        { kind: 'deselect' },
      ],
      [
        'closes the home preview',
        from('home', { preview: 'a' }),
        { kind: 'close-preview' },
      ],
    ])('%s', (_case, state, step) => {
      expect(stepBack('void', state)).toEqual(step);
    });

    it.each<ObservatoryView>(['home', 'index', 'about', 'not-found'])(
      'has nothing to close on a bare %s view',
      (view) => {
        expect(stepBack('void', from(view))).toBeNull();
      },
    );

    it('leaves a pinned preview alone away from the home page', () => {
      expect(stepBack('void', from('about', { preview: 'a' }))).toBeNull();
    });
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
