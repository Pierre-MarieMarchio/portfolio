import { ObservatoryPins, ObservatoryView, ObservatoryWindow } from '../models';
import {
  DockFrom,
  dockedOf,
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
    it('leaves a sheet for the list', () => {
      expect(stepBack('void', from('sheet'))).toEqual({
        kind: 'navigate',
        to: 'index',
      });
    });

    it('lets the index row go', () => {
      expect(stepBack('void', from('index', { selection: 'a' }))).toEqual({
        kind: 'deselect',
      });
    });

    it('closes the home preview', () => {
      expect(stepBack('void', from('home', { preview: 'a' }))).toEqual({
        kind: 'close-preview',
      });
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
