import { Frame, referenceRadius, verticalFactor } from './camera';
import { gaussian, orbitRank, TAU } from './math';
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
 * A RESERVE of `n` points, not the final scene: the drawing takes a share
 * that rises with the zoom. Rebuilding the scene at each change of scale
 * would redistribute every point at random, and the matter would jump.
 */
export const buildScene = (n: number, rnd: () => number): Grain[] => {
  const gauss = gaussian(rnd);
  const grains: Grain[] = [];
  const add = (
    fam: Grain['fam'],
    u: number,
    ang: number,
    alpha0: number,
    w: number,
    g: number,
    extra: Partial<Grain> = {},
  ): void => {
    grains.push({
      fam,
      u,
      ang,
      alpha0,
      w,
      g,
      grain: 0.8 + rnd() * 0.4,
      accent: rnd() < (fam === 0 ? 0.3 : 0.08),
      depart: 2 + rnd() * 3,
      ph: rnd() * TAU,
      lat: 0,
      gr2: 0,
      ph2: 0,
      ph3: 0,
      dx: 0,
      dy: 0,
      z: 0,
      rho: 0,
      behind: false,
      ...extra,
    });
  };

  const nA = Math.round(n * 0.13);
  for (let i = 0; i < nA; i++) {
    const lat = Math.asin(rnd() * 2 - 1);
    const ang = rnd() * TAU;
    const alpha0 = 0.16 + rnd() * 0.12;
    add(0, 0, ang, alpha0, 0.075, gauss() * 0.01, {
      lat,
      grain: 0.8 + rnd() * 0.4,
      accent: rnd() < 0.06,
    });
  }

  // The upper crescent carries most of the light: three points in four go
  // there, and the density collapses fast away from the ring. The lensed
  // arcs are thick BANDS, not threads.
  const nH = Math.round(n * 0.58);
  for (let i = 0; i < nH; i++) {
    // Two ring thicknesses, not two halves.
    const high = rnd() < 0.62;
    const u = Math.min(1, Math.abs(gauss()) * (high ? 0.44 : 0.52));
    const ang = rnd() * TAU;
    const fall = Math.exp(-u * u * 3.4);
    const base =
      (high ? 0.16 : 0.07) +
      (high ? 0.78 : 0.4) * fall * (0.84 + 0.16 * Math.sin(ang * 3.1 + u * 9));
    add(high ? 1 : 2, u, ang, base, 0.12 / (1 + 2 * u), gauss() * 0.012);
  }

  const nB = Math.round(n * 0.3);
  for (let i = 0; i < nB; i++) {
    const u = Math.pow(rnd(), 1.5);
    const ang = rnd() * TAU;
    add(
      3,
      u,
      ang,
      0.05 + 0.42 * Math.exp(-u * 2.1),
      0.22 / Math.pow(1 + 1.6 * u, 1.4),
      gauss(),
    );
  }

  const nV = Math.max(0, n - nA - nH - nB);
  for (let i = 0; i < nV; i++) {
    const u = Math.abs(gauss()) * 0.55;
    add(4, u, rnd() * TAU, 0.035 * Math.exp(-u * 1.6), 0.025, gauss() * 0.2);
  }

  // The photon ring: the rim light traces grazing the horizon. A perfect
  // circle, very thin, dense: it gives the shadow its sharp edge, and it
  // never flattens with the disk.
  const nP = Math.round(n * 0.16);
  for (let i = 0; i < nP; i++) {
    const ang = rnd() * TAU;
    const alpha0 = 0.34 + rnd() * 0.3;
    // The speed of the rest of the matter, barely scattered.
    const w = 0.072 + rnd() * 0.012;
    // The radial scatter makes the thickness: kept thin.
    const g = gauss() * 0.0062;
    add(5, 0, ang, alpha0, w, g, {
      gr2: gauss() * 0.4,
      ph2: rnd() * TAU,
      ph3: rnd() * TAU,
      grain: 0.85 + rnd() * 0.3,
      accent: false,
    });
  }

  grains.sort((a, b) => a.fam - b.fam);
  return grains;
};

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

/**
 * Where grain `p` sits, in object radii, before roll and flattening.
 * `phase` is the rotation phase, already slowed in the loop: never
 * modulated here, or multiplying the total would jump several turns. The
 * azimuth adds AFTER the grain's own speed: the same offset for every point.
 */
export const placeGrain = (
  p: Grain,
  phase: number,
  entry: number,
  elev: number,
  azim: number,
  out: Projected,
): void => {
  const turn = phase * p.w * ORBIT_RATE + azim;
  const far = 1 + (p.depart - 1) * (1 - entry);
  if (p.fam === 0) {
    // The travelled sphere gives the hole its volume without outlining it.
    const lon = p.ang + turn;
    const cl = Math.cos(p.lat);
    const r = (1 + p.g) * far;
    const x = cl * Math.cos(lon);
    const z = cl * Math.sin(lon);
    const y = Math.sin(p.lat);
    const yt = y * 0.94 - z * 0.26;
    const sx = x * r;
    const sy = yt * r;
    p.rho = Math.min(1, Math.sqrt(sx * sx + sy * sy) / r);
    p.z = z;
    out.x = sx;
    out.y = sy;
    return;
  }
  if (p.fam === 5) {
    // The rim spins on itself, each photon at its speed, with a faint
    // breathing of the radius: it lives, it is not drawn.
    const a5 = p.ang + turn + 0.02 * Math.sin(phase * 0.17 + p.ph2);
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
    return;
  }
  if (p.fam === 4) {
    const ang = p.ang + turn;
    const r = (1.15 + p.u * 2.6) * far;
    out.x = Math.cos(ang) * r;
    out.y = Math.sin(ang) * r * 0.42;
    return;
  }
  const u = Math.min(2.6, p.u * far);
  const a = p.ang + turn;
  if (p.fam === 3) {
    // The disk itself: its opening on screen is the camera's elevation.
    const rb = (0.94 + u * 2.6) * (1 + (far - 1) * 0.5);
    const sinA = Math.sin(a);
    p.behind = sinA < 0;
    out.x = Math.cos(a) * rb;
    out.y = 0.04 + sinA * rb * opening(elev) + p.g * 0.038 * Math.exp(-u * 0.9);
    return;
  }
  // The lensed arcs make a closed RING, the secondary image of the disk,
  // that the matter runs through in the disk's direction. A point goes from
  // top to bottom, and its position decides its light, never its label.
  const sa = Math.sin(a);
  const rr = 0.95 + u * 0.34 + p.g * 0.7 + (p.fam === 2 ? 0.05 : 0);
  const wing = 1 + u * 3.2 * Math.pow(1 - Math.abs(sa), 1.9);
  out.x = Math.cos(a) * rr * wing;
  out.y = sa * rr * 0.98 + (p.fam === 2 ? 0.035 : -0.012);
};

/**
 * A circular orbit projected like the disk: the in-plane part is squashed
 * by the camera's opening, the out-of-plane part stays vertical.
 */
export const positionOrbit = (
  orbit: Pick<Orbit, 'ang' | 'rb' | 'inc' | 'v'>,
  phase: number,
  elev: number,
  azim: number,
  out: Projected,
): Projected => {
  const a = orbit.ang + phase * orbit.v * ORBIT_RATE + azim;
  const ci = Math.cos(orbit.inc);
  const si = Math.sin(orbit.inc);
  const z = Math.sin(a) * orbit.rb * ci;
  out.x = Math.cos(a) * orbit.rb;
  out.y = 0.04 + z * opening(elev) + Math.sin(a) * orbit.rb * si;
  out.z = z;
  return out;
};

/**
 * The orbits fitted to the room really left, never to constants, and on the
 * HOME framing, never the current one: a camera move must not shift the
 * orbits against the hole. The outer orbit holds in the free band AND stays
 * out of the disk; no floor above the room, or the outer orbit would leave
 * the frame.
 */
export const fitOrbits = (
  orbits: readonly Orbit[],
  w: number,
  h: number,
  home: Frame,
  freeHalf: number | null,
  dpr: number,
): void => {
  const cx = w * home.x;
  const cy = h * home.y;
  const R = referenceRadius(w, h, home.s);
  const maxH = (Math.min(cx, w - cx) - 74 * dpr) / R;
  const half = freeHalf !== null ? freeHalf * dpr : Math.min(cy, h - cy);
  const maxV = (half - 30 * dpr) / (R * verticalFactor(home.ev, home.i));
  // The disk fades out near 2.4 radii: the orbits keep well beyond it so
  // the object has air around it. It is the radius that rises, not the
  // scale that drops.
  const rMax = Math.max(4.6, Math.min(6.9, maxH, maxV));
  const rMin = Math.max(4.1, Math.min(rMax * 0.74, 4.9));
  for (const orbit of orbits) {
    orbit.rb = rMin + orbit.k * (rMax - rMin);
    orbit.v = 0.075 * Math.pow(1.3 / orbit.rb, 1.5);
  }
};
