import { JOURNEY_ELEVATION, MIN_ELEVATION } from './constants';

/**
 * How the object's plane is drawn on screen. Written once, here: the disk,
 * the orbits, the comets and the aim of the camera all project through it,
 * and a copy that drifted would put a planet off its orbit.
 */

/** A point of the plane on screen, in object radii from the centre. */
export interface Rolled {
  nx: number;
  ny: number;
}

/** How much the plane's depth is kept on screen, at an elevation. */
export const flattening = (elev: number): number => 0.88 + 0.34 * elev;

/**
 * The elevation the camera shows while it travels: the journey's slice,
 * handed over to the resting elevation as the crossing ends (`dEv` from -1
 * to 0).
 */
export const travelingElevation = (resting: number, dEv: number): number =>
  Math.max(MIN_ELEVATION, resting + (JOURNEY_ELEVATION - resting) * -dEv);

/**
 * A point of the plane on screen: its depth flattened, then turned by the
 * roll (`cr`, `sr` its cosine and sine). `out` is filled, not allocated:
 * this runs for every planet and every sample of an orbit, each frame.
 */
export function rollFlatten(
  x: number,
  y: number,
  flatten: number,
  cr: number,
  sr: number,
  out: Rolled,
): Rolled {
  const py = y * flatten;
  out.nx = x * cr - py * sr;
  out.ny = x * sr + py * cr;
  return out;
}
