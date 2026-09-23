import { clamp, nearestTurn } from './math';
import { ORBIT_RATE } from './constants';

/**
 * One framing, six numbers: where the centre of the object sits in the frame
 * (`x`, `y`, as fractions), the scale (`s`, the camera's distance), the roll
 * (`i`), the elevation above the disk's plane (`ev`, 0 edge-on, 1 from
 * above) and the azimuth around its axis (`az`). The disk being a solid of
 * revolution, turning around it shifts every orbit by the same angle: a
 * camera move, never a rotation of the object itself.
 */
export interface Frame {
  readonly i: number;
  readonly s: number;
  readonly x: number;
  readonly y: number;
  readonly ev: number;
  readonly az: number;
}

/**
 * The home framing is not constant: the hole takes the band really left
 * free between the head and the rule, so its height and its scale follow
 * from a measure (see `measureHome`). This is where it starts.
 */
export const HOME_FRAME: Frame = {
  i: -0.33,
  s: 0.48,
  x: 0.53,
  y: 0.4,
  ev: 0.18,
  az: 0,
};

/**
 * The index: the camera climbs well above the plane and BACKS OFF, the
 * orbits become circles again and the whole system fits left of the table.
 * About: the instrument steps aside; the page looks at the person, not the
 * system, and the object recedes into a crescent.
 */
export const INDEX_FRAME: Frame = {
  i: -0.1,
  s: 0.3,
  x: 0.3,
  y: 0.5,
  ev: 0.86,
  az: -0.3,
};

export const ABOUT_FRAME: Frame = {
  i: -0.95,
  s: 0.34,
  x: 0.2,
  y: 0.5,
  ev: 0.06,
  az: 0.62,
};

/**
 * One approach per chapter of a sheet. Each says what is seen MORE from
 * closer: 01 the whole orbit, where the body comes from; 02 the camera goes
 * down into the plane, the body passes in front of the band; 03 closest,
 * the grain and the rim; 04 one notch back and up, its place in the system.
 */
export const SHEET_APPROACHES = [
  { s: 0.72, ev: 0.46, i: -0.26, x: 0.2, y: 0.46, cos: 0.58 },
  { s: 0.88, ev: 0.26, i: -0.2, x: 0.18, y: 0.52, cos: 0.74 },
  { s: 1.04, ev: 0.12, i: -0.14, x: 0.16, y: 0.58, cos: 0.9 },
  { s: 0.78, ev: 0.6, i: -0.34, x: 0.21, y: 0.44, cos: 0.66 },
] as const;

/**
 * The home preview. The angle decides the on-screen gap between the planet
 * and the hole: at π the planet is furthest (a whole orbit radius), and
 * zooming pushes the object behind the window. At 2.35 rad the gap drops to
 * two thirds, which lets the scale rise: both fit in the free band, large,
 * left of the card.
 */
export const PREVIEW_AIM = { x: 0.21, y: 0.66, s: 0.74, angle: 2.35 };

/** The object's radius in device pixels for a scale, on a w × h canvas. */
export const referenceRadius = (w: number, h: number, s: number): number =>
  Math.min(w / 6.6, h / 3.2) * s;

/** Vertical extent of an orbit, in object radii: disk opening plus roll. */
export const verticalFactor = (ev: number, roll: number): number =>
  0.05 + 0.62 * ev + Math.abs(Math.sin(roll));

export interface HomeMeasure {
  readonly y: number;
  readonly s: number;
  readonly i: number;
  readonly ev: number;
  /** Half the free band's height, in CSS pixels. */
  readonly freeHalf: number;
}

/**
 * The home framing from the band really left free between the head (its
 * measured height) and the rule. One invariant, not negotiable: the outer
 * orbit fits in the band AND stays out of the disk. When the band narrows,
 * the orbit does not go into the disk: the system lies down, the camera
 * goes towards the plane and the roll cancels, until the orbits are seen
 * almost edge-on. Their vertical extent collapses, the horizontal one stays
 * whole, and nothing overlaps.
 */
export const measureHome = (
  viewport: { readonly width: number; readonly height: number },
  headHeight: number | null,
  ruleHeight: number | null,
): HomeMeasure => {
  const vh = viewport.height || 800;
  const vw = viewport.width || 1200;
  const top = (headHeight ?? 72) + Math.min(40, vh * 0.05) + 18;
  const margin = Math.max(74, Math.min(92, vh * 0.09));
  const band = (ruleHeight ?? 56) + margin;
  const bottom = vh - band - 18;
  const freeHalf = Math.max(26, (bottom - top) / 2);
  const y = clamp((top + bottom) / 2 / vh, 0.14, 0.72);
  const tight = clamp(1 - freeHalf / 260, 0, 1);
  const i = -0.33 + 0.3 * tight;
  // Elevation floor: under 0.12 the view is so grazing that a planet in
  // transit projects into the disk's footprint. The invariant bears on what
  // is seen, not only on the radius.
  const ev = Math.max(0.12, 0.18 - 0.16 * tight);
  const fv = verticalFactor(ev, i);
  // 6.9 object radii: the outer orbit, the point's margin included. The
  // orbits being wider, the object backs off as much.
  const s = clamp(
    (freeHalf - 30) / (6.6 * fv) / Math.min(vw / 6.6, vh / 3.2),
    0.07,
    0.42,
  );
  return { y, s, i, ev, freeHalf };
};

export interface OrbitAim {
  readonly ang: number;
  readonly v: number;
  readonly rb: number;
}

export interface Dims {
  readonly w: number;
  readonly h: number;
  readonly dpr: number;
}

/**
 * A sheet's framing. The hole keeps LEFT; the body read comes out on its
 * RIGHT, in the band left free between the object and the panel. Two
 * invariants: the body stays out of the disk's footprint (2.9 radii at
 * least) and never goes under the text. If both cannot hold, the approach
 * gives way, not the legibility. The panel's left edge is measured in the
 * DOM, not guessed.
 */
export const sheetFrame = (args: {
  readonly chapter: number;
  readonly home: Frame;
  readonly viewportWidth: number;
  readonly dims: Dims | null;
  readonly orbit: OrbitAim | null;
  readonly panelLeft: number | null;
  readonly phase: number;
  readonly azim: number;
}): Frame => {
  const approach =
    SHEET_APPROACHES[clamp(args.chapter, 0, SHEET_APPROACHES.length - 1)] ??
    SHEET_APPROACHES[0];
  const d = args.dims;
  const f = clamp(((args.viewportWidth || 1200) - 240) / 1000, 0.74, 1);
  let sc = Math.max(0.3, approach.s * f);
  const frame = {
    i: approach.i,
    s: sc,
    x: approach.x,
    y: approach.y,
    ev: approach.ev,
    az: args.home.az,
  };
  const orbit = args.orbit;
  if (!d || !orbit) {
    return frame;
  }
  const baseRadius = Math.min(d.w / 6.6, d.h / 3.2);
  const cxPx = approach.x * d.w;
  const edge =
    args.panelLeft === null ? d.w * 0.54 : (args.panelLeft - 96) * d.dpr;
  const room = Math.max(150, edge - cxPx);
  let radius = baseRadius * sc;
  if (2.9 * radius > room) {
    sc = room / (2.9 * baseRadius);
    radius = baseRadius * sc;
    frame.s = sc;
  }
  const cosMin = Math.min(0.985, 2.9 / orbit.rb);
  const cosA = Math.max(
    cosMin,
    Math.min(0.985, Math.min(room / (orbit.rb * radius), approach.cos)),
  );
  // sin > 0: the body passes IN FRONT of the disk, never in its shadow.
  const angle = Math.acos(cosA);
  frame.az = nearestTurn(
    angle - (orbit.ang + args.phase * orbit.v * ORBIT_RATE),
    args.azim,
  );
  return frame;
};

/**
 * The home preview's framing: the camera turns to bring the planet onto
 * the aim angle, then the scale is bounded by the band really free left of
 * the card, so that both the planet-to-hole gap and the disk around the
 * hole fit. Floor: never smaller than home; on a narrow screen the object
 * rather passes partly behind the (translucent) card than shrinks. Opening
 * a project must always bring it closer.
 */
export const previewFrame = (args: {
  readonly home: Frame;
  readonly dims: Dims | null;
  readonly orbit: OrbitAim | null;
  readonly cardLeft: number | null;
  readonly phase: number;
  readonly azim: number;
  /** The planet's offset from the centre, in object radii, after roll. */
  readonly offset: (azimuth: number) => { nx: number; ny: number };
}): Frame => {
  const c = args.home;
  const aim = PREVIEW_AIM;
  const frame = { i: c.i, s: aim.s, x: aim.x, y: aim.y, ev: c.ev, az: c.az };
  const d = args.dims;
  const orbit = args.orbit;
  if (!d || !orbit) {
    return frame;
  }
  const az = nearestTurn(
    aim.angle - (orbit.ang + args.phase * orbit.v * ORBIT_RATE),
    args.azim,
  );
  frame.az = az;
  const baseRadius = Math.min(d.w / 6.6, d.h / 3.2);
  const edge =
    args.cardLeft === null ? d.w * 0.6 : (args.cardLeft - 22) * d.dpr;
  const useful = Math.max(200 * d.dpr, edge - 20 * d.dpr);
  const gap = Math.abs(Math.cos(aim.angle)) * (orbit.rb || 4.5) + 2.3;
  const sMax = useful / (baseRadius * gap);
  const sc = Math.max(c.s * 1.25, Math.min(aim.s, sMax));
  frame.s = sc;
  const radius = baseRadius * sc;
  const o = args.offset(az);
  frame.x = clamp(aim.x - (o.nx * radius) / d.w, -1.2, 2.2);
  frame.y = clamp(aim.y - (o.ny * radius) / d.h, -1.2, 2.2);
  return frame;
};

export const isFiniteFrame = (frame: Frame): boolean =>
  Number.isFinite(frame.s) &&
  Number.isFinite(frame.ev) &&
  Number.isFinite(frame.az);
