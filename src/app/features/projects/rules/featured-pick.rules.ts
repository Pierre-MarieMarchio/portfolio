export type PickStep = -1 | 0 | 1;

const SWIPE_MIN_PX = 48;
const SWIPE_MIN_SLANT = 1.5;

export function neighbourOf(
  slugs: readonly string[],
  current: string | null,
  step: PickStep,
): string | null {
  const index = Math.max(0, slugs.indexOf(current ?? ''));
  return slugs[index + step] ?? null;
}

export function swipeStepOf(dx: number, dy: number): PickStep {
  const reach = Math.abs(dx);
  if (reach < SWIPE_MIN_PX || reach <= SWIPE_MIN_SLANT * Math.abs(dy)) {
    return 0;
  }
  return dx < 0 ? 1 : -1;
}

export function restingPickOf(
  slugs: readonly string[],
  reading: string | null,
): string | null {
  return reading !== null && slugs.includes(reading)
    ? reading
    : (slugs[0] ?? null);
}
