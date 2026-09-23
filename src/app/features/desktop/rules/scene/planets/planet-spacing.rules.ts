export interface ScreenPoint {
  sx: number;
  sy: number;
}

/**
 * On-screen repulsion, after the positions and before the drawing: four
 * passes guarantee a minimal gap. Two orbits may cross in projection; two
 * points never merge. Only the first `count` points take part.
 */
export const repel = (
  points: readonly ScreenPoint[],
  count: number,
  gap: number,
  passes = 4,
): void => {
  for (let pass = 0; pass < passes; pass++) {
    repelOnce(points, count, gap);
  }
};

const repelOnce = (
  points: readonly ScreenPoint[],
  count: number,
  gap: number,
): void => {
  for (let i = 0; i < count; i++) {
    const first = points[i];
    for (let j = i + 1; j < count; j++) {
      const second = points[j];
      if (first && second) {
        separate(first, second, gap);
      }
    }
  }
};

const separate = (
  first: ScreenPoint,
  second: ScreenPoint,
  gap: number,
): void => {
  let dx = second.sx - first.sx;
  let dy = second.sy - first.sy;
  let distance = Math.hypot(dx, dy);
  if (distance >= gap) {
    return;
  }
  if (distance < 0.001) {
    dx = 1;
    dy = 0;
    distance = 1;
  }
  const push = (gap - distance) / 2;
  first.sx -= (dx / distance) * push;
  first.sy -= (dy / distance) * push;
  second.sx += (dx / distance) * push;
  second.sy += (dy / distance) * push;
};

/** The mockup's gap between two planets, in CSS pixels. */
export const PLANET_GAP = 58;
