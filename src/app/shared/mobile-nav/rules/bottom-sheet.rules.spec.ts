import type { SheetDetent, SheetStop } from '../models/bottom-sheet.model';
import {
  detentAfter,
  isDismissedBy,
  speedOf,
  stopOf,
  stopsOf,
} from './bottom-sheet.rules';

const THREE: readonly SheetStop[] = [
  { detent: 'folded', at: 0 },
  { detent: 'half', at: 260 },
  { detent: 'full', at: 660 },
];

const TWO: readonly SheetStop[] = [
  { detent: 'folded', at: 0 },
  { detent: 'half', at: 300 },
];

describe('detentAfter', () => {
  it.each<[SheetDetent, number, number, SheetDetent]>([
    ['half', 0, 0, 'half'],
    ['half', -63, 0, 'half'],
    ['half', -64, 0, 'folded'],
    ['half', -30, -0.7, 'folded'],
    ['half', -30, -0.5, 'half'],
    ['half', 47, 0, 'half'],
    ['half', 48, 0, 'full'],
    ['half', 20, 0.7, 'full'],
    ['full', -48, 0, 'half'],
    ['full', -40, 0.2, 'full'],
    ['full', -40, -0.8, 'half'],
    ['full', -500, -0.8, 'folded'],
    ['full', -600, 0, 'folded'],
    ['full', -420, 0, 'half'],
    ['folded', 47, 0, 'folded'],
    ['folded', 48, 0, 'half'],
    ['folded', 30, 0.7, 'half'],
    ['folded', 400, 0.7, 'full'],
    ['folded', 600, 0, 'full'],
    ['full', 30, 1, 'full'],
    ['folded', -10, -1, 'folded'],
  ])(
    'three stops: from %s, after %d px and %d px/ms, goes to %s',
    (from, travel, vy, to) => {
      expect(detentAfter(from, travel, vy, THREE)).toBe(to);
    },
  );

  it.each<[SheetDetent, number, number, SheetDetent]>([
    ['half', -64, 0, 'folded'],
    ['half', 40, 1, 'half'],
    ['folded', 48, 0, 'half'],
  ])(
    'two stops: from %s, after %d px and %d px/ms, goes to %s',
    (from, travel, vy, to) => {
      expect(detentAfter(from, travel, vy, TWO)).toBe(to);
    },
  );

  it('stays where it was when there is no stop to go to', () => {
    expect(detentAfter('half', 200, 1, [])).toBe('half');
  });
});

describe('stopsOf', () => {
  it.each<[readonly SheetDetent[], number, readonly SheetStop[]]>([
    [['folded', 'half', 'full'], 660, THREE],
    [
      ['folded', 'half', 'full'],
      200,
      [
        { detent: 'folded', at: 0 },
        { detent: 'full', at: 200 },
      ],
    ],
    [
      ['folded', 'half'],
      900,
      [...TWO.slice(0, 1), { detent: 'half', at: 260 }],
    ],
    [['folded', 'half'], 0, [{ detent: 'half', at: 0 }]],
  ])(
    'places %j over a scroll of %d px, a stop that would sit on the next one merged into it',
    (detents, end, stops) => {
      expect(stopsOf(detents, { peek: 40, half: 300, end })).toEqual(stops);
    },
  );
});

describe('stopOf', () => {
  it('finds the stop of a detent, or the top one for a detent merged away', () => {
    expect(stopOf(THREE, 'half')).toEqual({ detent: 'half', at: 260 });
    expect(stopOf([{ detent: 'full', at: 200 }], 'half')).toEqual({
      detent: 'full',
      at: 200,
    });
    expect(stopOf([], 'half')).toBeNull();
  });
});

describe('speedOf', () => {
  it.each([
    [[], 100, 0],
    [[{ top: 100, at: 90 }], 100, 0],
    [
      [
        { top: 0, at: 0 },
        { top: 100, at: 50 },
        { top: 180, at: 100 },
      ],
      100,
      1.6,
    ],
    [
      [
        { top: 0, at: 0 },
        { top: 100, at: 20 },
      ],
      200,
      0,
    ],
    [
      [
        { top: 300, at: 60 },
        { top: 240, at: 100 },
      ],
      110,
      -1.5,
    ],
  ])(
    'reads the samples %j, let go at %d ms, as %d px/ms over the last 80 ms',
    (samples, at, speed) => {
      expect(speedOf(samples, at)).toBeCloseTo(speed);
    },
  );
});

describe('isDismissedBy', () => {
  it.each<[SheetDetent, number, number, boolean]>([
    ['folded', 0, 64, true],
    ['folded', 0, 200, true],
    ['folded', 0, 63, false],
    ['folded', 0, -100, false],
    ['folded', 30, 100, false],
    ['half', 260, 100, false],
    ['full', 660, 100, false],
  ])(
    'three stops: from %s, at %d px, after a pull of %d px, is %s',
    (origin, top, pull, dismissed) => {
      expect(isDismissedBy(THREE, origin, top, pull)).toBe(dismissed);
    },
  );

  it('never dismisses a sheet without stops', () => {
    expect(isDismissedBy([], 'folded', 0, 200)).toBe(false);
  });

  it('takes the lowest of two stops for the one to dismiss from', () => {
    expect(isDismissedBy(TWO, 'folded', 0, 80)).toBe(true);
    expect(isDismissedBy(TWO, 'half', 300, 80)).toBe(false);
  });
});
