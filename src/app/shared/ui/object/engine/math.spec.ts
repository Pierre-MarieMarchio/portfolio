import {
  gaussian,
  halfLifeStep,
  isLit,
  nearestTurn,
  onCurrentTurn,
  orbitRank,
  PLANET_GAP,
  repel,
  ScreenPoint,
  TAU,
} from './math';

/** A seeded generator, so a statistical spec never flakes. */
const seeded = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const distance = (a: ScreenPoint, b: ScreenPoint): number =>
  Math.hypot(a.sx - b.sx, a.sy - b.sy);

describe('object math', () => {
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
  });

  describe('halfLifeStep', () => {
    it('covers half the way in one half-life', () => {
      expect(halfLifeStep(0.55, 0.55)).toBeCloseTo(0.5, 10);
    });

    it('lands at the same place whatever the frame rate', () => {
      const run = (frames: number): number => {
        let value = 0;
        for (let i = 0; i < frames; i++) {
          value += (1 - value) * halfLifeStep(1 / frames, 0.55);
        }
        return value;
      };
      expect(run(30)).toBeCloseTo(run(144), 10);
    });
  });

  describe('isLit (deterministic draw)', () => {
    const litAt = (share: number): number[] =>
      Array.from({ length: 5000 }, (_, i) => i).filter((i) => isLit(i, share));

    it('lights the same points every time', () => {
      expect(litAt(0.4)).toEqual(litAt(0.4));
    });

    it('keeps every lit point lit when the share rises', () => {
      const low = new Set(litAt(0.3));
      const high = new Set(litAt(0.6));
      expect([...low].every((i) => high.has(i))).toBe(true);
    });

    it('lights about the share asked for, and all of them at 1', () => {
      expect(litAt(0.5).length / 5000).toBeCloseTo(0.5, 1);
      expect(litAt(1)).toHaveLength(5000);
    });
  });

  describe('repel', () => {
    it('pulls two merged planets 58 px apart', () => {
      const points = [
        { sx: 100, sy: 100 },
        { sx: 100, sy: 100 },
      ];
      repel(points, 2, PLANET_GAP);
      const [a, b] = points;
      if (!a || !b) {
        throw new Error('expected two points');
      }
      expect(distance(a, b)).toBeGreaterThanOrEqual(PLANET_GAP - 0.001);
    });

    it('leaves points already far enough apart, and points past the count', () => {
      const points = [
        { sx: 0, sy: 0 },
        { sx: 200, sy: 0 },
        { sx: 0, sy: 1 },
      ];
      repel(points, 2, PLANET_GAP);
      expect(points).toEqual([
        { sx: 0, sy: 0 },
        { sx: 200, sy: 0 },
        { sx: 0, sy: 1 },
      ]);
    });

    it('spreads a crowd until no pair is much closer than the gap', () => {
      const points = Array.from({ length: 4 }, (_, i) => ({
        sx: 300 + i * 5,
        sy: 200 + i * 3,
      }));
      repel(points, 4, PLANET_GAP);
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i];
          const b = points[j];
          if (a && b) {
            expect(distance(a, b)).toBeGreaterThan(PLANET_GAP * 0.8);
          }
        }
      }
    });
  });

  describe('azimuth unrolling', () => {
    it('takes the short way round', () => {
      expect(nearestTurn(3 * TAU + 0.1, 0)).toBeCloseTo(0.1, 6);
      expect(nearestTurn(-0.1, 2 * TAU)).toBeCloseTo(2 * TAU - 0.1, 6);
    });

    it('puts a constant target back on the current turn', () => {
      expect(onCurrentTurn(0.3, 5 * TAU + 0.2)).toBeCloseTo(5 * TAU + 0.3, 6);
      expect(onCurrentTurn(0.3, 0.2)).toBe(0.3);
    });
  });

  it('draws standard normal deviates', () => {
    const next = gaussian(seeded(42));
    const values = Array.from({ length: 20000 }, next);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    expect(mean).toBeCloseTo(0, 1);
    expect(Math.sqrt(variance)).toBeCloseTo(1, 1);
  });
});
