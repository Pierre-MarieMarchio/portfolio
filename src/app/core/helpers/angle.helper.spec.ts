import { nearestTurn, onCurrentTurn, TAU } from './angle.helper';

describe('azimuth unrolling', () => {
  it('takes the short way round', () => {
    expect(nearestTurn(3 * TAU + 0.1, 0)).toBeCloseTo(0.1, 6);
    expect(nearestTurn(-0.1, 2 * TAU)).toBeCloseTo(2 * TAU - 0.1, 6);
  });

  it('puts a constant target back on the current turn', () => {
    expect(onCurrentTurn(0.3, 5 * TAU + 0.2)).toBeCloseTo(5 * TAU + 0.3, 6);
    expect(onCurrentTurn(0.3, 0.2)).toBeCloseTo(0.3, 6);
  });
});
