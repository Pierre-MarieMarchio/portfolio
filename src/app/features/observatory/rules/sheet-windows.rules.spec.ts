import type { HeldSheet } from '../models';
import {
  handOverSheet,
  type AddressSheet,
  type HandOverFrom,
  sheetIdOf,
  sheetWindowsOf,
} from './sheet-windows.rules';

const held = (key: number, slug: string, isReduced = false): HeldSheet => ({
  key,
  slug,
  chapter: key,
  minimized: isReduced,
});

const from = (overrides: Partial<HandOverFrom> = {}): HandOverFrom => ({
  key: 0,
  held: [],
  slug: 'a',
  chapter: 2,
  isPinned: false,
  isMinimized: false,
  ...overrides,
});

describe('handOverSheet', () => {
  it('changes nothing while the arriving sheet is the one already shown', () => {
    const next = handOverSheet(from({ isPinned: true }), 'a');

    expect(next).toEqual({ key: 0, held: [], chapter: null });
  });

  it('changes nothing when the shown sheet is not pinned: it is reused in place', () => {
    const next = handOverSheet(from({ held: [held(3, 'z')] }), 'b');

    expect(next).toEqual({ key: 0, held: [held(3, 'z')], chapter: null });
  });

  it('parks a pinned sheet, with its own chapter and reduced state, and opens the next one in a new window', () => {
    const next = handOverSheet(
      from({ key: 1, isPinned: true, isMinimized: true }),
      'b',
    );

    expect(next.held).toEqual([
      { key: 1, slug: 'a', chapter: 2, minimized: true },
    ]);
    expect(next.key).toBe(2);
    expect(next.chapter).toBeNull();
  });

  it('gives the new window a key no other window has', () => {
    const next = handOverSheet(
      from({ key: 1, isPinned: true, held: [held(5, 'x')] }),
      'b',
    );

    expect(next.key).toBe(6);
    expect(next.held.map((sheet) => sheet.key)).toEqual([5, 1]);
  });

  it('brings a parked sheet back as the shown one, in its own window, at its own chapter', () => {
    const next = handOverSheet(
      from({ key: 4, held: [held(1, 'p'), held(2, 'q')] }),
      'q',
    );

    expect(next.key).toBe(2);
    expect(next.held).toEqual([held(1, 'p')]);
    expect(next.chapter).toBe(2);
  });

  it('parks the pinned sheet shown while bringing another one back, without duplicating either', () => {
    const next = handOverSheet(
      from({ key: 4, slug: 'b', isPinned: true, held: [held(1, 'p')] }),
      'p',
    );

    expect(next.key).toBe(1);
    expect(next.held.map((sheet) => sheet.slug)).toEqual(['b']);
    expect(next.held[0]?.key).toBe(4);
    expect(next.chapter).toBe(1);
  });
});

describe('sheetWindowsOf', () => {
  const address: AddressSheet = {
    slug: 'b',
    chapter: 1,
    isPinned: false,
    isShown: true,
    isKept: true,
    isCurrent: true,
    closeLabel: 'Back to the projects',
  };

  it('lists the parked sheets then the shown one, ordered by key so no window moves in the DOM', () => {
    const windows = sheetWindowsOf([held(0, 'a'), held(2, 'c')], 1, address);

    expect(windows.map((window) => window.key)).toEqual([0, 1, 2]);
    expect(windows.map((window) => window.slug)).toEqual(['a', 'b', 'c']);
  });

  it('gives every window its own stack id, built from its key', () => {
    const windows = sheetWindowsOf([held(0, 'a')], 1, address);

    expect(windows.map((window) => window.id)).toEqual([
      sheetIdOf(0),
      sheetIdOf(1),
    ]);
    expect(new Set(windows.map((window) => window.id)).size).toBe(2);
  });

  it('registers only the shown sheet as the window of the view', () => {
    const windows = sheetWindowsOf([held(0, 'a')], 1, address);

    expect(windows.map((window) => window.slot)).toEqual([null, 'sheet']);
  });

  it('keeps a parked sheet pinned, shown unless reduced, and never the heading of the page', () => {
    const [parked, reduced] = sheetWindowsOf(
      [held(0, 'a'), held(1, 'c', true)],
      2,
      address,
    );

    expect(parked).toMatchObject({
      isPinned: true,
      isShown: true,
      isCurrent: false,
      content: 'detail',
      closeLabel: '',
    });
    expect(reduced?.isShown).toBe(false);
  });

  it('carries the address of the shown sheet as it is', () => {
    const [shown] = sheetWindowsOf([], 3, {
      ...address,
      isPinned: true,
      isShown: false,
    });

    expect(shown).toMatchObject({
      key: 3,
      slug: 'b',
      chapter: 1,
      isPinned: true,
      isShown: false,
      isCurrent: true,
      closeLabel: 'Back to the projects',
    });
  });

  it('shows nothing of the shown sheet until it has been kept, and a not-found window when it names no project', () => {
    const [unkept] = sheetWindowsOf([], 0, { ...address, isKept: false });
    const [lost] = sheetWindowsOf([], 0, { ...address, slug: null });

    expect(unkept?.content).toBeNull();
    expect(lost?.content).toBe('not-found');
    expect(lost?.slug).toBe('');
  });
});
