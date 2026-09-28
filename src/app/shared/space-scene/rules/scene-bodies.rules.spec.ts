import {
  fitOrbits,
  ORBIT_REFERENCE_COUNT,
  orbitRank,
  placeOrbits,
  positionOrbit,
} from './scene-bodies.rules';
import { flattening, rollFlatten } from './camera/projection.rules';
import {
  Frame,
  REST_FRAME,
  referenceRadius,
} from './camera/camera-frames.rules';
import { measureRest } from './camera/rest-frame.rules';

const firstFour = (count: number) =>
  [0, 1, 2, 3].map((i) => orbitRank(i, count));

describe('orbitRank (Titius-Bode)', () => {
  const ranks = Array.from({ length: 7 }, (_, i) => orbitRank(i, 7));

  it('puts the first orbit at 0 and the last at 1', () => {
    expect(ranks[0]).toBe(0);
    expect(ranks[6]).toBeCloseTo(1, 10);
  });

  it('moves every orbit further out than the one before', () => {
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThan(ranks[i - 1] ?? Infinity);
    }
  });

  it('widens the gaps outwards instead of spacing the rings evenly', () => {
    const gaps = ranks.slice(1).map((rank, i) => rank - (ranks[i] ?? 0));
    expect(gaps.at(-1)).toBeGreaterThan(2 * (gaps[0] ?? Infinity));
  });

  it('answers 0 for a lone body rather than dividing by nothing', () => {
    expect(orbitRank(0, 1)).toBe(0);
  });

  it('spreads three bodies from the first orbit to the last, as few as they are', () => {
    expect([0, 1, 2].map((i) => orbitRank(i, 3))).toEqual([
      0,
      expect.closeTo(0.54, 2),
      1,
    ]);
  });

  it('keeps the first orbits where they are, however many bodies follow', () => {
    expect(firstFour(12)).toEqual(firstFour(ORBIT_REFERENCE_COUNT));
    expect(firstFour(20)).toEqual(firstFour(ORBIT_REFERENCE_COUNT));
  });

  it('shares the outer band among the bodies past the reference, out to the edge', () => {
    const twelve = Array.from({ length: 12 }, (_, i) => orbitRank(i, 12));

    for (let i = 1; i < twelve.length; i++) {
      expect(twelve[i]).toBeGreaterThan(twelve[i - 1] ?? Infinity);
    }
    expect(twelve.at(-1)).toBeCloseTo(1, 10);
    const outer = twelve.slice(5);
    const gaps = outer.slice(1).map((rank, i) => rank - (outer[i] ?? 0));
    for (const gap of gaps) {
      expect(gap).toBeCloseTo(gaps[0] ?? 0, 10);
    }
  });
});

const restOf = (w: number, h: number): { frame: Frame; freeHalf: number } => {
  const measure = measureRest({ width: w, height: h }, 44, 90);
  return {
    frame: { ...REST_FRAME, ...measure },
    freeHalf: measure.freeHalf,
  };
};

const fitted = (w: number, h: number): number[] => {
  const { frame, freeHalf } = restOf(w, h);
  const orbits = placeOrbits(7);
  fitOrbits(orbits, { w, h, dpr: 1 }, frame, { freeHalf });
  return orbits.map((orbit) => orbit.rb);
};

const room = (w: number, h: number): number => {
  const { frame } = restOf(w, h);
  const cx = w * frame.x;
  return (Math.min(cx, w - cx) - 74) / referenceRadius(w, h, frame.s);
};

describe('fitOrbits', () => {
  it('keeps the orbits well out of the disk where there is room', () => {
    const outer = Math.max(...fitted(1280, 800));

    expect(outer).toBeGreaterThanOrEqual(4.6);
    expect(outer).toBeLessThanOrEqual(6.9);
  });

  it('keeps the outer orbit in the frame on a phone', () => {
    expect(room(375, 667)).toBeLessThan(4.6);
    expect(Math.max(...fitted(375, 667))).toBeLessThanOrEqual(
      room(375, 667) + 1e-9,
    );
  });

  it.each([1, 3])(
    'keeps the widest orbit within the width of a 360 × 780 portrait (dpr %i)',
    (dpr) => {
      const w = 360 * dpr;
      const h = 780 * dpr;
      const { frame, freeHalf } = restOf(360, 780);
      const orbits = placeOrbits(7);
      fitOrbits(orbits, { w, h, dpr }, frame, { freeHalf });
      const view = {
        flatten: flattening(frame.ev),
        cr: Math.cos(frame.i),
        sr: Math.sin(frame.i),
      };
      const radius = referenceRadius(w, h, frame.s);
      const xs = orbits.flatMap((orbit) =>
        Array.from({ length: 84 }, (_, k) => {
          const point = positionOrbit(
            orbit,
            { phase: 0, elev: frame.ev, azim: (k / 84) * 2 * Math.PI },
            { x: 0, y: 0, z: 0 },
          );
          const { nx } = rollFlatten(point, view, { nx: 0, ny: 0 });
          return w * frame.x + nx * radius;
        }),
      );
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...xs)).toBeLessThanOrEqual(w);
    },
  );

  it('keeps every orbit of a phone clear of its grown disc, the outer ones free to leave the screen', () => {
    const { frame, freeHalf } = restOf(375, 667);
    const orbits = placeOrbits(7);
    const todayReach = fitOrbits(
      orbits,
      { w: 375, h: 667, dpr: 1, isPhone: true },
      frame,
      { freeHalf },
    );
    const radii = orbits.map((orbit) => orbit.rb);

    expect(Math.min(...radii)).toBeGreaterThanOrEqual(3.2);
    expect(Math.max(...radii)).toBeGreaterThanOrEqual(4.8);
    expect(todayReach).toBeCloseTo(Math.max(...fitted(375, 667)), 6);
  });

  it('keeps the inner orbit inside the outer one, whatever the room', () => {
    for (const [w, h] of [
      [1280, 800],
      [924, 540],
      [375, 667],
      [320, 480],
    ] as const) {
      const radii = fitted(w, h);
      expect(Math.min(...radii)).toBeLessThan(Math.max(...radii));
    }
  });
});
