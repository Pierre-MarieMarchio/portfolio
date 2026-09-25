import { clamp, nearestTurn } from '@app/core/helpers';
import {
  FALLBACK_VIEWPORT,
  ORBIT_RATE,
} from '../../models/scene-constants.model';
import { opening } from './projection.rules';

export interface Frame {
  readonly i: number;
  readonly s: number;
  readonly x: number;
  readonly y: number;
  readonly ev: number;
  readonly az: number;
}

export const REST_FRAME: Frame = {
  i: -0.33,
  s: 0.48,
  x: 0.53,
  y: 0.4,
  ev: 0.18,
  az: 0,
};

export const OVERVIEW_FRAME: Frame = {
  i: -0.1,
  s: 0.3,
  x: 0.3,
  y: 0.5,
  ev: 0.86,
  az: -0.3,
};

export const ASIDE_FRAME: Frame = {
  i: -0.95,
  s: 0.34,
  x: 0.2,
  y: 0.5,
  ev: 0.06,
  az: 0.62,
};

export const APPROACHES = [
  { s: 0.72, ev: 0.46, i: -0.26, x: 0.2, y: 0.46, cos: 0.58 },
  { s: 0.88, ev: 0.26, i: -0.2, x: 0.18, y: 0.52, cos: 0.74 },
  { s: 1.04, ev: 0.12, i: -0.14, x: 0.16, y: 0.58, cos: 0.9 },
  { s: 0.78, ev: 0.6, i: -0.34, x: 0.21, y: 0.44, cos: 0.66 },
] as const;

const CLOSE_UP_AIM = { x: 0.21, y: 0.66, s: 0.74, angle: 2.35 };

const unitRadius = (w: number, h: number): number => Math.min(w / 6.6, h / 3.2);

export const referenceRadius = (w: number, h: number, s: number): number =>
  unitRadius(w, h) * s;

export const verticalFactor = (ev: number, roll: number): number =>
  opening(ev) + Math.abs(Math.sin(roll));

const REST_SCALE_MAX = 0.42;

export interface RestMeasure {
  readonly y: number;
  readonly s: number;
  readonly i: number;
  readonly ev: number;
  readonly freeHalf: number;
}

const UPRIGHT_REST = { ev: 0.6, i: -0.45 } as const;

const uprightTilt = (
  roomFactor: number,
  flat: Pick<Frame, 'ev' | 'i'>,
): Pick<Frame, 'ev' | 'i'> => {
  const ev = Math.min(
    UPRIGHT_REST.ev,
    (roomFactor - Math.abs(Math.sin(UPRIGHT_REST.i)) - opening(0)) /
      (opening(1) - opening(0)),
  );
  return ev > flat.ev ? { ev, i: UPRIGHT_REST.i } : flat;
};

export const measureRest = (
  viewport: { readonly width: number; readonly height: number },
  headHeight: number | null,
  ruleHeight: number | null,
): RestMeasure => {
  const vh = viewport.height || FALLBACK_VIEWPORT.height;
  const vw = viewport.width || FALLBACK_VIEWPORT.width;
  const top = (headHeight ?? 72) + Math.min(40, vh * 0.05) + 18;
  const margin = Math.max(74, Math.min(92, vh * 0.09));
  const band = (ruleHeight ?? 56) + margin;
  const bottom = vh - band - 18;
  const freeHalf = Math.max(26, (bottom - top) / 2);
  const y = clamp((top + bottom) / 2 / vh, 0.14, 0.72);
  const tight = clamp(1 - freeHalf / 260, 0, 1);
  const i = REST_FRAME.i + 0.3 * tight;
  const flat = Math.max(0.12, REST_FRAME.ev - 0.16 * tight);
  const budget = (freeHalf - 30) / 6.6 / unitRadius(vw, vh);
  const fitted = budget / verticalFactor(flat, i);
  const s = clamp(fitted, 0.07, REST_SCALE_MAX);
  const tilt =
    vh > vw && fitted > REST_SCALE_MAX
      ? uprightTilt(budget / s, { ev: flat, i })
      : { ev: flat, i };
  return { y, s, i: tilt.i, ev: tilt.ev, freeHalf };
};

interface OrbitAim {
  readonly ang: number;
  readonly v: number;
  readonly rb: number;
}

export const orbitAngle = (
  orbit: Pick<OrbitAim, 'ang' | 'v'>,
  phase: number,
): number => orbit.ang + phase * orbit.v * ORBIT_RATE;

export interface Dims {
  readonly w: number;
  readonly h: number;
  readonly dpr: number;
}

export interface SkyBand {
  readonly top: number;
  readonly bottom: number;
}

export type BodyOffset = (
  azimuth: number,
  tilt: Pick<Frame, 'ev' | 'i'>,
) => { nx: number; ny: number };

type Approach = (typeof APPROACHES)[number];

type MutableFrame = { -readonly [K in keyof Frame]: Frame[K] };

interface ApproachArgs {
  readonly step: number;
  readonly rest: Frame;
  readonly viewportWidth: number;
  readonly dims: Dims | null;
  readonly orbit: OrbitAim | null;
  readonly panelLeft: number | null;
  readonly band: SkyBand | null;
  readonly phase: number;
  readonly azim: number;
  readonly offset: BodyOffset;
}

interface Aimed {
  readonly frame: MutableFrame;
  readonly dims: Dims;
  readonly orbit: OrbitAim;
}

export const approachFrame = (args: ApproachArgs): Frame => {
  const approach =
    APPROACHES[clamp(args.step, 0, APPROACHES.length - 1)] ?? APPROACHES[0];
  const d = args.dims;
  const f = clamp(
    ((args.viewportWidth || FALLBACK_VIEWPORT.width) - 240) / 1000,
    0.74,
    1,
  );
  const frame = {
    i: approach.i,
    s: Math.max(0.3, approach.s * f),
    x: approach.x,
    y: approach.y,
    ev: approach.ev,
    az: args.rest.az,
  };
  const orbit = args.orbit;
  if (!d || !orbit) {
    return frame;
  }
  const aimed = { frame, dims: d, orbit };
  return args.band
    ? approachAboveBand(aimed, approach, args, args.band)
    : approachBesidePanel(aimed, approach, args);
};

const approachBesidePanel = (
  { frame, dims: d, orbit }: Aimed,
  approach: Approach,
  args: ApproachArgs,
): Frame => {
  const baseRadius = unitRadius(d.w, d.h);
  const cxPx = approach.x * d.w;
  const edge =
    args.panelLeft === null ? d.w * 0.54 : (args.panelLeft - 96) * d.dpr;
  const room = Math.max(150, edge - cxPx);
  const radius = shrinkToRoom(frame, baseRadius, room);
  frame.az = approachAzimuth(orbit, approach, room / (orbit.rb * radius), args);
  return frame;
};

const approachAboveBand = (
  { frame, dims: d, orbit }: Aimed,
  approach: Approach,
  args: ApproachArgs,
  band: SkyBand,
): Frame => {
  const room = d.w / 2;
  const radius = shrinkToRoom(frame, unitRadius(d.w, d.h), room);
  frame.az = approachAzimuth(orbit, approach, room / (orbit.rb * radius), args);
  return centreInBand(frame, args.offset(frame.az, frame), radius, {
    dims: d,
    band,
  });
};

const shrinkToRoom = (
  frame: MutableFrame,
  baseRadius: number,
  room: number,
): number => {
  const radius = baseRadius * frame.s;
  if (2.9 * radius > room) {
    frame.s = room / (2.9 * baseRadius);
    return baseRadius * frame.s;
  }
  return radius;
};

const approachAzimuth = (
  orbit: OrbitAim,
  approach: Approach,
  reach: number,
  args: Pick<ApproachArgs, 'phase' | 'azim'>,
): number => {
  const cosMin = Math.min(0.985, 2.9 / orbit.rb);
  const cosA = Math.max(cosMin, Math.min(0.985, Math.min(reach, approach.cos)));
  const angle = Math.acos(cosA);
  return nearestTurn(angle - orbitAngle(orbit, args.phase), args.azim);
};

const centreInBand = (
  frame: MutableFrame,
  offset: { readonly nx: number; readonly ny: number },
  radius: number,
  { dims: d, band }: { readonly dims: Dims; readonly band: SkyBand },
): Frame => {
  const middle = ((band.top + band.bottom) / 2) * d.dpr;
  frame.x = clamp(0.5 - (offset.nx * radius) / d.w, -1.2, 2.2);
  frame.y = clamp((middle - offset.ny * radius) / d.h, -1.2, 2.2);
  return frame;
};

interface CloseUpArgs {
  readonly rest: Frame;
  readonly dims: Dims | null;
  readonly orbit: OrbitAim | null;
  readonly panelLeft: number | null;
  readonly band: SkyBand | null;
  readonly phase: number;
  readonly azim: number;
  readonly offset: BodyOffset;
}

export const closeUpFrame = (args: CloseUpArgs): Frame => {
  const c = args.rest;
  const aim = CLOSE_UP_AIM;
  const frame = { i: c.i, s: aim.s, x: aim.x, y: aim.y, ev: c.ev, az: c.az };
  const d = args.dims;
  const orbit = args.orbit;
  if (!d || !orbit) {
    return frame;
  }
  frame.az = nearestTurn(aim.angle - orbitAngle(orbit, args.phase), args.azim);
  const aimed = { frame, dims: d, orbit };
  return args.band
    ? closeUpAboveBand(aimed, args, args.band)
    : closeUpBesidePanel(aimed, args);
};

const closeUpScale = (
  { dims: d, orbit }: Aimed,
  rest: Frame,
  useful: number,
): number => {
  const gap = Math.abs(Math.cos(CLOSE_UP_AIM.angle)) * (orbit.rb || 4.5) + 2.3;
  const sMax = useful / (unitRadius(d.w, d.h) * gap);
  return Math.max(rest.s * 1.25, Math.min(CLOSE_UP_AIM.s, sMax));
};

const closeUpBesidePanel = (aimed: Aimed, args: CloseUpArgs): Frame => {
  const { frame, dims: d } = aimed;
  const aim = CLOSE_UP_AIM;
  const edge =
    args.panelLeft === null ? d.w * 0.6 : (args.panelLeft - 22) * d.dpr;
  const useful = Math.max(200 * d.dpr, edge - 20 * d.dpr);
  frame.s = closeUpScale(aimed, args.rest, useful);
  const radius = unitRadius(d.w, d.h) * frame.s;
  const o = args.offset(frame.az, args.rest);
  frame.x = clamp(aim.x - (o.nx * radius) / d.w, -1.2, 2.2);
  frame.y = clamp(aim.y - (o.ny * radius) / d.h, -1.2, 2.2);
  return frame;
};

const closeUpAboveBand = (
  aimed: Aimed,
  args: CloseUpArgs,
  band: SkyBand,
): Frame => {
  const { frame, dims: d } = aimed;
  frame.s = closeUpScale(aimed, args.rest, d.w / 2 - 20 * d.dpr);
  const radius = unitRadius(d.w, d.h) * frame.s;
  return centreInBand(frame, args.offset(frame.az, args.rest), radius, {
    dims: d,
    band,
  });
};

export const isFiniteFrame = (frame: Frame): boolean =>
  Number.isFinite(frame.s) &&
  Number.isFinite(frame.ev) &&
  Number.isFinite(frame.az);
