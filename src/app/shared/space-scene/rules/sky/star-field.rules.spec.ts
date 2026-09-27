import { starCount } from './star-field.rules';

const canvas = (width: number, height: number, ratio: number) =>
  [width * ratio, height * ratio, ratio] as const;

describe('starCount', () => {
  it('gives a phone the stars of a ratio of 2, whatever its canvas ratio', () => {
    const atTwo = starCount(...canvas(390, 844, 2), true);

    expect(starCount(...canvas(390, 844, 1.5), true)).toBe(atTwo);
    expect(atTwo).toBe(Math.round((390 * 844 * 2) / 3600));
  });

  it('keeps one star for 3600 px² divided by the ratio off the phone', () => {
    expect(starCount(...canvas(820, 1180, 2), false)).toBe(
      Math.round((820 * 2 * 1180 * 2) / (3600 * 2)),
    );
    expect(starCount(...canvas(1280, 800, 1), false)).toBe(
      Math.round((1280 * 800) / 3600),
    );
  });
});
