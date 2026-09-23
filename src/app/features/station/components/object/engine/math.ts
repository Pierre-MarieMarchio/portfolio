/*
 * The pure pieces of the object: no canvas, no DOM, no clock. Each one is a
 * choice the mockup justifies (docs/maquette/objet-canvas.md) and a spec
 * holds, so that porting it again cannot "improve" it by accident.
 */

export const TAU = 6.2832;

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const clamp01 = (value: number): number => clamp(value, 0, 1);

/** Progress of `t` through the window [a, b], clamped to 0..1. */
export const progress = (t: number, a: number, b: number): number =>
  clamp01((t - a) / (b - a));

export const smoothstep = (p: number): number => p * p * (3 - 2 * p);

export const easeOut = (x: number): number => 1 - Math.pow(1 - clamp01(x), 3);

/**
 * The share of the remaining distance covered in `dt` seconds, for a motion
 * that halves what is left every `halfLife` seconds. Never a fixed lerp
 * coefficient: the motion would then depend on the frame rate.
 */
export const halfLifeStep = (dt: number, halfLife: number): number =>
  1 - Math.pow(0.5, dt / halfLife);

/**
 * Titius-Bode. Each orbit moves out by a factor of 1.42 plus an offset of
 * its own: equidistant rings make a shooting target, a real system breathes.
 * Answers the rank's place between the first orbit (0) and the last (1);
 * the home rule reads this same function, so a marker cannot drift from its
 * planet.
 */
export const orbitRank = (index: number, count: number): number => {
  const offsets = [0, 0.1, -0.06, 0.13, -0.04, 0.07];
  const spread = (k: number): number =>
    Math.pow(1.42, k) + (offsets[k % 6] ?? 0);
  const first = spread(0);
  const last = spread(count - 1);
  return last > first ? (spread(index) - first) / (last - first) : 0;
};

/**
 * How lit point `index` of the reserve is when `share` of it is drawn, 0 to
 * 1. Deterministic on purpose: a lit point stays lit as long as the camera
 * does not back off. A random draw would make the whole population flicker.
 * Each point fades in over the last 2% of the share instead of switching on:
 * during the approach the share rises and some fifteen points a frame came
 * on at once, a sparkle on the disk.
 */
export const litAmount = (index: number, share: number): number =>
  share >= 1 ? 1 : clamp((share * 1000 - ((index * 7919) % 1000)) / 20, 0, 1);

/**
 * Brings an azimuth to within half a turn of `reference`, so the camera
 * always takes the short way round.
 */
export const nearestTurn = (azimuth: number, reference: number): number => {
  let az = azimuth;
  while (az - reference > Math.PI) {
    az -= TAU;
  }
  while (reference - az > Math.PI) {
    az += TAU;
  }
  return az;
};

/**
 * Puts a target azimuth back on the camera's current turn. Every preview
 * unrolls the azimuth by a further quarter turn; without this, going back
 * to a constant framing would make the camera catch up every revolution
 * accumulated so far.
 */
export const onCurrentTurn = (target: number, current: number): number => {
  const turns = Math.round((current - target) / TAU);
  return turns ? target + turns * TAU : target;
};

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
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const a = points[i];
        const b = points[j];
        if (!a || !b) {
          continue;
        }
        let dx = b.sx - a.sx;
        let dy = b.sy - a.sy;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d >= gap) {
          continue;
        }
        if (d < 0.001) {
          dx = 1;
          dy = 0;
          d = 1;
        }
        const push = (gap - d) / 2;
        a.sx -= (dx / d) * push;
        a.sy -= (dy / d) * push;
        b.sx += (dx / d) * push;
        b.sy += (dy / d) * push;
      }
    }
  }
};

/** The mockup's gap between two planets, in CSS pixels. */
export const PLANET_GAP = 58;

/**
 * Standard normal deviates by the polar Box-Muller method, drawn from `rnd`:
 * radial spreads follow a Gaussian so that no orbit reads as a line.
 */
export const gaussian = (rnd: () => number): (() => number) => {
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const value = spare;
      spare = null;
      return value;
    }
    let u: number;
    let v: number;
    let s: number;
    do {
      u = rnd() * 2 - 1;
      v = rnd() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    const m = Math.sqrt((-2 * Math.log(s)) / s);
    spare = v * m;
    return u * m;
  };
};
