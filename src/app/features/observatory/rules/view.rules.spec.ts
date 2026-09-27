import { ObservatoryView, ObservatoryWindow } from '../models';
import { parentOf, stepBack, StepBackFrom, windowOf } from './view.rules';

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
