import { seededRandom } from '@testing/doubles/seeded-random.double';
import { gaussian } from './random.helper';

describe('gaussian', () => {
  it('draws standard normal deviates', () => {
    const next = gaussian(seededRandom(42));
    const values = Array.from({ length: 20_000 }, next);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    expect(mean).toBeCloseTo(0, 1);
    expect(Math.sqrt(variance)).toBeCloseTo(1, 1);
  });
});
