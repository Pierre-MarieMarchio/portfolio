import {
  ARRIVED,
  crossingPace,
  traveling,
  TRAVELING_END,
} from './traveling.rules';

const growthRate = (t: number): number =>
  (traveling(t + 0.01, false).grow - traveling(t - 0.01, false).grow) / 0.02;

describe('crossingPace', () => {
  it('plays what is left of the crossing within the time it is given', () => {
    expect(crossingPace(3, 0.9) * 0.9).toBeCloseTo(TRAVELING_END - 3, 9);
    expect(crossingPace(0, 0.9) * 0.9).toBeCloseTo(TRAVELING_END, 9);
  });

  it('never plays the crossing slower than its own clock', () => {
    expect(crossingPace(TRAVELING_END - 0.5, 0.9)).toBe(1);
  });

  it('leaves a finished crossing at its own pace', () => {
    expect(crossingPace(TRAVELING_END, 0.9)).toBe(1);
    expect(crossingPace(12, 0.9)).toBe(1);
  });
});

describe('traveling', () => {
  it('animates the distance: a dot for seconds, then it unfolds, the old sizes kept until the landing', () => {
    expect(traveling(0, false).grow).toBeCloseTo(1 / 58, 6);
    expect(traveling(6.5, false).grow).toBeLessThan(0.5);
    expect(traveling(7, false).grow).toBeCloseTo(0.089, 2);
    expect(traveling(8, false).grow).toBeCloseTo(0.467, 2);
    expect(traveling(9.6, false).grow).toBeCloseTo(1, 6);
  });

  it('lands instead of braking: the growth dies over more than a second', () => {
    let peak = 0;
    let peakAt = 0;
    for (let t = 6; t <= 9.6; t += 0.01) {
      if (growthRate(t) > peak) {
        peak = growthRate(t);
        peakAt = t;
      }
    }
    let quiet = peakAt;
    while (quiet < 9.6 && growthRate(quiet) > 0.1 * peak) {
      quiet += 0.01;
    }
    expect(quiet - peakAt).toBeGreaterThan(0.9);
  });

  it('never shrinks the object on the way in', () => {
    let last = 0;
    for (let t = 0; t <= 9.7; t += 0.05) {
      const grow = traveling(t, false).grow;
      expect(grow).toBeGreaterThanOrEqual(last);
      last = grow;
    }
  });

  it('lets the matter emerge late: 5% at 5 s, full at 8 s', () => {
    expect(traveling(5, false).matter).toBeCloseTo(0.05, 1);
    expect(traveling(8, false).matter).toBe(1);
  });

  it('sits at its final state with reduced motion, and on a broken clock', () => {
    expect(traveling(0, true)).toBe(ARRIVED);
    expect(
      Object.values(traveling(NaN, false)).every((value) =>
        Number.isFinite(value),
      ),
    ).toBe(true);
  });
});
