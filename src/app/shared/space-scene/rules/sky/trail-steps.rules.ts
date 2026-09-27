import { clamp } from '@app/core/helpers';

export const TRAIL_ALPHAS = [0.8, 0.44, 0.24, 0.13, 0.07, 0.04, 0.022, 0.012];
export const TRAIL_WIDTHS = [0.6, 1.2, 1.8, 2.4];
export const TRAIL_GROUPS = 2 * TRAIL_ALPHAS.length * TRAIL_WIDTHS.length;
export const TRAIL_HEAD = 0.45;
export const TRAIL_TAIL_LIGHT = 0.5;

const PER_TONE = TRAIL_GROUPS / 2;
const WIDTH_STEPS = TRAIL_WIDTHS.length;
const FAINTEST = TRAIL_ALPHAS.length - 1;

const alphaStep = (alpha: number): number => {
  const below = TRAIL_ALPHAS.findIndex((level) => level < alpha);
  if (below >= 0) {
    return Math.max(0, below - 1);
  }
  return alpha >= (TRAIL_ALPHAS[FAINTEST] ?? 0) / 2 ? FAINTEST : -1;
};

export const trailGroup = (
  isAccent: boolean,
  alpha: number,
  cssWidth: number,
): number => {
  const step = alphaStep(alpha);
  if (step < 0) {
    return -1;
  }
  const tone = isAccent ? PER_TONE : 0;
  const thickness = clamp(Math.round(cssWidth / 0.6), 1, WIDTH_STEPS) - 1;
  return tone + step * WIDTH_STEPS + thickness;
};

export const isAccentGroup = (group: number): boolean => group >= PER_TONE;

export const groupAlpha = (group: number): number =>
  TRAIL_ALPHAS[Math.floor((group % PER_TONE) / WIDTH_STEPS)] ?? 0;

export const groupWidth = (group: number): number =>
  TRAIL_WIDTHS[group % WIDTH_STEPS] ?? 0;
