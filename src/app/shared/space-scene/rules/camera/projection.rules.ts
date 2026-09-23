import {
  JOURNEY_ELEVATION,
  MIN_ELEVATION,
} from '../../models/scene-constants.model';

export interface Rolled {
  nx: number;
  ny: number;
}

export interface ScreenHole {
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
}

export const holeDistance = (x: number, y: number, hole: ScreenHole): number =>
  Math.sqrt((x - hole.cx) * (x - hole.cx) + (y - hole.cy) * (y - hole.cy));

export const opening = (elev: number): number => 0.05 + 0.62 * elev;

export const flattening = (elev: number): number => 0.88 + 0.34 * elev;

export const travelingElevation = (resting: number, dEv: number): number =>
  Math.max(MIN_ELEVATION, resting + (JOURNEY_ELEVATION - resting) * -dEv);

export interface PlaneView {
  readonly flatten: number;
  readonly cr: number;
  readonly sr: number;
}

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
