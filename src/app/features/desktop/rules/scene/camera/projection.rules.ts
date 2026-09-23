import {
  JOURNEY_ELEVATION,
  MIN_ELEVATION,
} from '../../../models/scene-constants.model';

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

export interface ScreenHole {
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
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
 * How the plane is seen for one frame: how much of its depth is kept, and
 * the roll's cosine and sine.
 */
export interface PlaneView {
  readonly flatten: number;
  readonly cr: number;
  readonly sr: number;
}

/**
 * A point of the plane on screen: its depth flattened, then turned by the
 * roll. `out` is filled, not allocated: this runs for every planet and every
 * sample of an orbit, each frame.
 */
export function rollFlatten(
  point: { readonly x: number; readonly y: number },
  view: PlaneView,
  out: Rolled,
): Rolled {
  const py = point.y * view.flatten;
  out.nx = point.x * view.cr - py * view.sr;
  out.ny = point.x * view.sr + py * view.cr;
  return out;
}
