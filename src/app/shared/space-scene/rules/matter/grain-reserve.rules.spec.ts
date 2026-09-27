import { litAmount, litShare } from './grain-reserve.rules';

const litAt = (share: number): number[] =>
  Array.from({ length: 5000 }, (_, i) => i).filter(
    (i) => litAmount(i, share) > 0,
  );

describe('litAmount (deterministic draw)', () => {
  it('fades a point in as the share rises past it, never switching it on', () => {
    const index = 7;
    const key = (index * 7919) % 1000;
    const at = (share: number): number => litAmount(index, share);
    expect(at(key / 1000)).toBe(0);
    expect(at((key + 10) / 1000)).toBeCloseTo(0.5, 5);
    expect(at((key + 20) / 1000)).toBe(1);
    expect(at(1)).toBe(1);
  });

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

describe('litShare', () => {
  const instants: readonly (readonly [number, number, number])[] = [
    [0.42, 0.42, 0],
    [0.42, 0.42, 0.2],
    [0.42, 0.42, 1],
    [0.42, 0.9, 1],
    [0.3, 1.2, 0.6],
    [0, 0.5, 1],
  ];

  it('lights 0.6 times the share on a phone, at every instant', () => {
    for (const [homeScale, scale, grow] of instants) {
      expect(litShare(homeScale, scale, grow, true)).toBeCloseTo(
        0.6 * litShare(homeScale, scale, grow, false),
        10,
      );
    }
  });

  it('keeps the share of every other format', () => {
    expect(litShare(0.42, 0.42, 1, false)).toBeCloseTo(1 / 1.9, 10);
    expect(litShare(0.42, 0.42, 0, false)).toBeCloseTo(0.03, 10);
  });
});
