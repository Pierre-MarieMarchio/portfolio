import { Dims, Frame, referenceRadius, verticalFactor } from './camera';
import { orbitRank } from './math';
import { ORBIT_RATE } from './constants';

/**
 * One point of the matter. Six families: 0 the travelled sphere (volume
 * without outlining the object), 1 and 2 the lensed arcs (the secondary
 * image of the disk, folded over and under the shadow), 3 the front band
 * (the disk itself), 4 a diffuse veil, 5 the photon ring. Every field is
 * always present so that the points share one shape.
 */
export interface Grain {
  readonly fam: 0 | 1 | 2 | 3 | 4 | 5;
  readonly u: number;
  readonly ang: number;
  readonly alpha0: number;
  readonly w: number;
  readonly g: number;
  readonly grain: number;
  readonly accent: boolean;
  readonly depart: number;
  readonly ph: number;
  readonly lat: number;
  readonly gr2: number;
  readonly ph2: number;
  readonly ph3: number;
  /** Written by the placement, read by the drawing of the same frame. */
  dx: number;
  dy: number;
  z: number;
  rho: number;
  behind: boolean;
}

/** One planet: a body per project, outside the disk, on its own orbit. */
export interface Orbit {
  /** Place between the first and the last orbit (Titius-Bode). */
  readonly k: number;
  /** Radius in object radii, fitted to the frame at every draw. */
  rb: number;
  readonly inc: number;
  readonly ang: number;
  /** Angular speed, Kepler: further out, slower. */
  v: number;
}

export interface Projected {
  x: number;
  y: number;
  z: number;
}

/**
 * Planets, not grains of the disk: each has its own orbit, out of the disk,
 * strictly in its plane (`inc = 0`: the least tilt widens the ellipse and
 * breaks the coplanarity). The golden angle between bodies keeps them from
 * ever lining up in a regular crown or coming back to the same alignment.
 */
export const placeOrbits = (n: number): Orbit[] => {
  const jitter = [0, 0.21, -0.14, 0.32, -0.26, 0.11, -0.19];
  const orbits: Orbit[] = [];
  for (let i = 0; i < n; i++) {
    orbits.push({
      k: orbitRank(i, n),
      rb: 1.6,
      inc: 0,
      ang: 0.62 + i * 2.39996 + (jitter[i % 7] ?? 0),
      v: 0.075,
    });
  }
  return orbits;
};

/** How open the disk looks from an elevation: 0 edge-on, 1 from above. */
export const opening = (elev: number): number => 0.05 + 0.62 * elev;

/** Where the scene's rotation stands for one frame. */
export interface ScenePose {
  readonly phase: number;
  readonly elev: number;
  readonly azim: number;
}

export interface GrainPose extends ScenePose {
  readonly entry: number;
}

type GrainPlacer = (p: Grain, pose: GrainPose, out: Projected) => void;

const turnOf = (p: Grain, pose: GrainPose): number =>
  pose.phase * p.w * ORBIT_RATE + pose.azim;

const farOf = (p: Grain, pose: GrainPose): number =>
  1 + (p.depart - 1) * (1 - pose.entry);

// The travelled sphere gives the hole its volume without outlining it.
const placeSphere: GrainPlacer = (p, pose, out) => {
  const far = farOf(p, pose);
  const lon = p.ang + turnOf(p, pose);
  const cl = Math.cos(p.lat);
  const r = (1 + p.g) * far;
  const x = cl * Math.cos(lon);
  const z = cl * Math.sin(lon);
  const y = Math.sin(p.lat);
  const yt = y * 0.94 - z * 0.26;
  const sx = x * r;
  const sy = yt * r;
  p.rho = Math.min(1, Math.hypot(sx, sy) / r);
  p.z = z;
  out.x = sx;
  out.y = sy;
};

// The rim spins on itself, each photon at its speed, with a faint
// breathing of the radius: it lives, it is not drawn.
const placeRing: GrainPlacer = (p, pose, out) => {
  const far = farOf(p, pose);
  const phase = pose.phase;
  const a5 = p.ang + turnOf(p, pose) + 0.02 * Math.sin(phase * 0.17 + p.ph2);
  const r5 =
    (0.958 +
      p.g +
      0.0065 * Math.sin(phase * 0.23 + p.ph) +
      0.0042 * Math.sin(phase * 0.41 + p.ph3 + p.gr2)) *
    far;
  // Shifted right by the exact gap to the shadow's radius: the right edge
  // of the ring merges with the shadow's, the offset reads on the left,
  // the side where the light is folded back.
  out.x = Math.cos(a5) * r5 + 0.045 * far;
  out.y = Math.sin(a5) * r5;
};

const placeVeil: GrainPlacer = (p, pose, out) => {
  const far = farOf(p, pose);
  const ang = p.ang + turnOf(p, pose);
  const r = (1.15 + p.u * 2.6) * far;
  out.x = Math.cos(ang) * r;
  out.y = Math.sin(ang) * r * 0.42;
};

// The disk itself: its opening on screen is the camera's elevation.
const placeBand: GrainPlacer = (p, pose, out) => {
  const far = farOf(p, pose);
  const u = Math.min(2.6, p.u * far);
  const a = p.ang + turnOf(p, pose);
  const rb = (0.94 + u * 2.6) * (1 + (far - 1) * 0.5);
  const sinA = Math.sin(a);
  p.behind = sinA < 0;
  out.x = Math.cos(a) * rb;
  out.y =
    0.04 + sinA * rb * opening(pose.elev) + p.g * 0.038 * Math.exp(-u * 0.9);
};

// The lensed arcs make a closed RING, the secondary image of the disk,
// that the matter runs through in the disk's direction. A point goes from
// top to bottom, and its position decides its light, never its label.
const placeArc: GrainPlacer = (p, pose, out) => {
  const far = farOf(p, pose);
  const u = Math.min(2.6, p.u * far);
  const a = p.ang + turnOf(p, pose);
  const sa = Math.sin(a);
  const rr = 0.95 + u * 0.34 + p.g * 0.7 + (p.fam === 2 ? 0.05 : 0);
  const wing = 1 + u * 3.2 * Math.pow(1 - Math.abs(sa), 1.9);
  out.x = Math.cos(a) * rr * wing;
  out.y = sa * rr * 0.98 + (p.fam === 2 ? 0.035 : -0.012);
};

const PLACERS: Readonly<Record<Grain['fam'], GrainPlacer>> = {
  0: placeSphere,
  1: placeArc,
  2: placeArc,
  3: placeBand,
  4: placeVeil,
  5: placeRing,
};

/**
 * Where grain `p` sits, in object radii, before roll and flattening.
 * `phase` is the rotation phase, already slowed in the loop: never
 * modulated here, or multiplying the total would jump several turns. The
 * azimuth adds AFTER the grain's own speed: the same offset for every point.
 */
export const placeGrain = (p: Grain, pose: GrainPose, out: Projected): void => {
  PLACERS[p.fam](p, pose, out);
};

/**
 * A circular orbit projected like the disk: the in-plane part is squashed
 * by the camera's opening, the out-of-plane part stays vertical.
 */
export const positionOrbit = (
  orbit: Pick<Orbit, 'ang' | 'rb' | 'inc' | 'v'>,
  pose: ScenePose,
  out: Projected,
): Projected => {
  const a = orbit.ang + pose.phase * orbit.v * ORBIT_RATE + pose.azim;
  const ci = Math.cos(orbit.inc);
  const si = Math.sin(orbit.inc);
  const z = Math.sin(a) * orbit.rb * ci;
  out.x = Math.cos(a) * orbit.rb;
  out.y = 0.04 + z * opening(pose.elev) + Math.sin(a) * orbit.rb * si;
  out.z = z;
  return out;
};

/**
 * The orbits fitted to the room really left, never to constants, and on the
 * HOME framing, never the current one: a camera move must not shift the
 * orbits against the hole. The outer orbit holds in the free band AND stays
 * out of the disk; no floor above the room, or the outer orbit would leave
 * the frame.
 *
 * Where there is not the room for both (a phone, some 375px wide), the frame
 * wins: the orbits shrink with it, in the same proportions. The floor of 4.6
 * used to hold even there, and put the outer orbit and its planet's button
 * off the screen.
 */
export const fitOrbits = (
  orbits: readonly Orbit[],
  dims: Dims,
  home: Frame,
  freeHalf: number | null,
): void => {
  const { w, h, dpr } = dims;
  const cx = w * home.x;
  const cy = h * home.y;
  const radius = referenceRadius(w, h, home.s);
  const maxH = (Math.min(cx, w - cx) - 74 * dpr) / radius;
  const half = freeHalf === null ? Math.min(cy, h - cy) : freeHalf * dpr;
  const maxV = (half - 30 * dpr) / (radius * verticalFactor(home.ev, home.i));
  // The disk fades out near 2.4 radii: the orbits keep well beyond it so
  // the object has air around it. It is the radius that rises, not the
  // scale that drops.
  const room = Math.min(maxH, maxV);
  const isRoomy = room >= 4.6;
  const rMax = isRoomy ? Math.min(6.9, room) : Math.max(0, room);
  const rMin = isRoomy
    ? Math.max(4.1, Math.min(rMax * 0.74, 4.9))
    : rMax * 0.74;
  for (const orbit of orbits) {
    orbit.rb = rMin + orbit.k * (rMax - rMin);
    orbit.v = 0.075 * Math.pow(1.3 / orbit.rb, 1.5);
  }
};
