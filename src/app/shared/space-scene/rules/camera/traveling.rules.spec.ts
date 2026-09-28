import { crossingPace, TRAVELING_END } from './traveling.rules';

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
