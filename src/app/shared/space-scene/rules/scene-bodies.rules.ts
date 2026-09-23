import {
  Dims,
  Frame,
  orbitAngle,
  referenceRadius,
  verticalFactor,
} from './camera/camera-frames.rules';
import { DISK_LIFT, ORBIT_RATE } from '../models/scene-constants.model';
import { opening } from './camera/projection.rules';

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
  dx: number;
  dy: number;
  z: number;
  rho: number;
  behind: boolean;
}

export interface Orbit {
  readonly k: number;
  rb: number;
  readonly inc: number;
  readonly ang: number;
  v: number;
}

export interface Projected {
  x: number;
  y: number;
  z: number;
}

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

interface ScenePose {
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

const placeBand: GrainPlacer = (p, pose, out) => {
  const far = farOf(p, pose);
  const u = Math.min(2.6, p.u * far);
  const a = p.ang + turnOf(p, pose);
  const rb = (0.94 + u * 2.6) * (1 + (far - 1) * 0.5);
  const sinA = Math.sin(a);
  p.behind = sinA < 0;
  out.x = Math.cos(a) * rb;
  out.y =
    DISK_LIFT +
    sinA * rb * opening(pose.elev) +
    p.g * 0.038 * Math.exp(-u * 0.9);
};

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

export const placeGrain = (p: Grain, pose: GrainPose, out: Projected): void => {
  PLACERS[p.fam](p, pose, out);
};

export const positionOrbit = (
  orbit: Pick<Orbit, 'ang' | 'rb' | 'inc' | 'v'>,
  pose: ScenePose,
  out: Projected,
): Projected => {
  const a = orbitAngle(orbit, pose.phase) + pose.azim;
  const ci = Math.cos(orbit.inc);
  const si = Math.sin(orbit.inc);
  const z = Math.sin(a) * orbit.rb * ci;
  out.x = Math.cos(a) * orbit.rb;
  out.y = DISK_LIFT + z * opening(pose.elev) + Math.sin(a) * orbit.rb * si;
  out.z = z;
  return out;
};

export const fitOrbits = (
  orbits: readonly Orbit[],
  dims: Dims,
  rest: Frame,
  freeHalf: number | null,
): void => {
  const { w, h, dpr } = dims;
  const cx = w * rest.x;
  const cy = h * rest.y;
  const radius = referenceRadius(w, h, rest.s);
  const maxH = (Math.min(cx, w - cx) - 74 * dpr) / radius;
  const half = freeHalf === null ? Math.min(cy, h - cy) : freeHalf * dpr;
  const maxV = (half - 30 * dpr) / (radius * verticalFactor(rest.ev, rest.i));
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

export const ORBIT_REFERENCE_COUNT = 7;

export const orbitRank = (order: number, count: number): number => {
  const offsets = [0, 0.1, -0.06, 0.13, -0.04, 0.07];
  const spread = (k: number): number =>
    Math.pow(1.42, k) + (offsets[k % 6] ?? 0);
  const drawn = Math.min(count, ORBIT_REFERENCE_COUNT);
  const first = spread(0);
  const last = spread(drawn - 1);
  const rank = (k: number): number =>
    last > first ? (spread(k) - first) / (last - first) : 0;
  const settled = drawn - 1;
  if (count <= ORBIT_REFERENCE_COUNT || order < settled) {
    return rank(order);
  }
  const from = rank(settled - 1);
  const extra = count - settled;
  return from + ((1 - from) * (order - settled + 1)) / extra;
};
