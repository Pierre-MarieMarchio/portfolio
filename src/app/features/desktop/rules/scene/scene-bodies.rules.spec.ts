import { ORBIT_REFERENCE_COUNT, orbitRank } from './scene-bodies.rules';

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

  /** The mockup's system, kept exactly: its seven orbits are the export's. */
  it('spreads three bodies from the first orbit to the last, as few as they are', () => {
    expect([0, 1, 2].map((i) => orbitRank(i, 3))).toEqual([
      0,
      expect.closeTo(0.54, 2),
      1,
    ]);
  });

  /** Twelve used to stack the featured four within 5% of the first orbit. */
  it('keeps the featured orbits where they are, however many bodies follow', () => {
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
