import { progress, smoothstep } from './math';

/**
 * The opening crossing, 0 → 9.2 s, as offsets on the camera. Computed once
 * per frame and read by the object AND the sky: the two must move in step,
 * or the depth comes apart.
 */
export interface Traveling {
  /** Apparent size, the inverse of the distance. */
  readonly grow: number;
  readonly dEv: number;
  readonly dAz: number;
  readonly dRoll: number;
  readonly dx: number;
  readonly dy: number;
  /** Emergence of the matter, 0 → 1. */
  readonly matter: number;
  readonly light: number;
  /** Rotation speed multiplier: the disk spins faster from afar. */
  readonly spin: number;
  /**
   * How fast the approach goes, 0 to 1 at its peak: the sky keeps flowing
   * with it after the tunnel, and comes to rest when the object has landed.
   */
  readonly coast: number;
}

/** Reduced motion: the object sits at its final state, no crossing. */
export const ARRIVED: Traveling = {
  grow: 1,
  dEv: 0,
  dAz: 0,
  dRoll: 0,
  dx: 0,
  dy: 0,
  matter: 1,
  light: 1,
  spin: 1,
  coast: 0,
};

/** The approach, from afar to the object's place. */
const APPROACH_FROM = 4.2;
const APPROACH_TO = 9.6;

/** When the crossing is over and the loop may rest. */
export const TRAVELING_END = 9.7;

/**
 * The approach's easing: the integral of a Beta(5, 4) bell, in closed form.
 * A slow rise, while the object is still a dot, then a long landing. The
 * cubic ease-in-out it replaces packed the whole arrival into a third of a
 * second: seen as a size, 1 / distance, the object grew fastest at 8.45 s
 * and all but stopped by 8.8 s, a braking jolt. Here the growth dies over
 * more than a second, and up to 8 s the sizes are the old ones.
 */
const approach = (p: number): number => {
  const q = 1 - p;
  return p ** 5 * (56 * q ** 3 + 28 * p * q ** 2 + 8 * p ** 2 * q + p ** 3);
};

/** The approach's speed, its bell, 1 at its peak (p = 4/7). */
const approachSpeed = (p: number): number =>
  (p ** 4 * (1 - p) ** 3) / ((4 / 7) ** 4 * (3 / 7) ** 3);

export const traveling = (time: number, reduced: boolean): Traveling => {
  if (reduced) {
    return ARRIVED;
  }
  const t = Number.isFinite(time) ? time : 0;
  // THE DISTANCE, NOT THE SIZE. An object coming from afar does not grow
  // steadily: its apparent diameter is the inverse of its distance. So the
  // distance is animated, from 58 radii to 1, and the size follows. Easing
  // the size instead grows fast then slow, exactly the opposite of an
  // approach, hence an image that seems to pop up in front of us. Here the
  // object stays a dot for seconds, then unfolds at the end of the run.
  // The distance falls on a LOG scale, 58 radii to 1: the eye reads a
  // zoom in ratios, so an even fall of the log is an even approach, and
  // the landing is the easing's alone.
  const pA = progress(t, APPROACH_FROM, APPROACH_TO);
  const distance = Math.pow(58, 1 - approach(pA));
  const pD = progress(t, 4.2, 8.8);
  const qI = smoothstep(progress(t, 5.4, 8.8));
  const qO = smoothstep(progress(t, 6.0, 8.8));
  const pC = progress(t, 5.6, 8.8);
  const back = 1 + 1.32 * Math.pow(qI - 1, 3) + 0.32 * Math.pow(qI - 1, 2);
  const outQ = 1 - Math.pow(1 - qO, 4);
  const sine = 0.5 - 0.5 * Math.cos(Math.PI * pC);
  // EMERGENCE OF THE MATTER follows the whole approach, and the power 1.8
  // crushes its start: at fifty radii the points pile up on a few pixels
  // without their drawn size shrinking, so they add up, and a far object at
  // full light would shine brighter than its arrival.
  const mA = progress(t, 3.8, 8.0);
  // DRIFT. A real camera is never perfectly servoed: three slow
  // oscillations of mutually prime periods add to the four motions and die
  // with them. Without them the curves are right and the result is a
  // machine.
  const envelope = Math.pow(Math.sin(Math.PI * pC), 2);
  const w1 = Math.sin(t * 0.23 + 0.6);
  const w2 = Math.sin(t * 0.41 + 2.1);
  const w3 = Math.sin(t * 0.13 + 4.2);
  return {
    grow: 1 / distance,
    dEv: -(1 - outQ),
    dAz: -1.05 * (1 - back) + (0.055 * w1 + 0.021 * w2) * envelope,
    dRoll: -0.19 * (1 - sine) + 0.03 * w2 * envelope,
    dx: -0.075 * (1 - sine) + 0.013 * w3 * envelope,
    dy: 0.052 * (1 - sine) + 0.01 * w1 * envelope,
    spin: 1 + 4.2 * (1 - smoothstep(pD)),
    matter: Math.pow(smoothstep(mA), 1.8),
    light: Math.pow(1 / distance, 0.95),
    coast: approachSpeed(pA),
  };
};
