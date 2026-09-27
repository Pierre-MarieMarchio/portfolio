import {
  groupAlpha,
  groupWidth,
  isAccentGroup,
  TRAIL_ALPHAS,
  TRAIL_GROUPS,
  TRAIL_HEAD,
  TRAIL_TAIL_LIGHT,
  TRAIL_WIDTHS,
  trailGroup,
} from './trail-steps.rules';

const alphaOf = (alpha: number): number =>
  groupAlpha(trailGroup(false, alpha, 1));

const gradientAt = (alpha: number, along: number): number =>
  along <= TRAIL_HEAD
    ? alpha
    : alpha * (1 - (along - TRAIL_HEAD) / (1 - TRAIL_HEAD));

const brightnesses = Array.from({ length: 400 }, (_, i) => 0.8 * 0.99 ** i);

describe('trail steps', () => {
  it('rounds a trail up to the nearest step, never down', () => {
    const faintest = TRAIL_ALPHAS.at(-1) ?? 0;
    for (const alpha of brightnesses.filter((a) => a >= faintest)) {
      const step = alphaOf(alpha);
      expect(step).toBeGreaterThanOrEqual(alpha);
      expect(TRAIL_ALPHAS.some((level) => level >= alpha && level < step)).toBe(
        false,
      );
    }
  });

  it('draws head and tail no paler than the gradient at their mid-length', () => {
    const headMiddle = TRAIL_HEAD / 2;
    const tailMiddle = (TRAIL_HEAD + 1) / 2;
    for (const alpha of brightnesses.filter((a) => a >= 0.02)) {
      expect(alphaOf(alpha)).toBeGreaterThanOrEqual(
        gradientAt(alpha, headMiddle),
      );
      expect(alphaOf(alpha * TRAIL_TAIL_LIGHT)).toBeGreaterThanOrEqual(
        gradientAt(alpha, tailMiddle) - 1e-12,
      );
    }
  });

  it('drops only a trail fainter than half the faintest step', () => {
    const faintest = TRAIL_ALPHAS.at(-1) ?? 0;
    expect(trailGroup(false, faintest * 0.49, 1)).toBe(-1);
    expect(trailGroup(true, 0, 1)).toBe(-1);
    expect(alphaOf(faintest * 0.51)).toBe(faintest);
  });

  it('rounds the width to the nearest step, within bounds', () => {
    expect(groupWidth(trailGroup(false, 0.8, 0.4))).toBe(0.6);
    expect(groupWidth(trailGroup(false, 0.8, 1.3))).toBe(1.2);
    expect(groupWidth(trailGroup(true, 0.2, 40))).toBe(TRAIL_WIDTHS.at(-1));
  });

  it('gives every tone, brightness and width its own group', () => {
    const groups = new Set<number>();
    for (const isAccent of [false, true]) {
      for (const alpha of TRAIL_ALPHAS) {
        for (const width of TRAIL_WIDTHS) {
          const group = trailGroup(isAccent, alpha, width);
          groups.add(group);
          expect(isAccentGroup(group)).toBe(isAccent);
          expect(groupAlpha(group)).toBe(alpha);
          expect(groupWidth(group)).toBe(width);
        }
      }
    }

    expect(groups.size).toBe(TRAIL_GROUPS);
    expect(Math.min(...groups)).toBe(0);
    expect(Math.max(...groups)).toBe(TRAIL_GROUPS - 1);
  });
});
