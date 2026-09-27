import { clamp } from '@app/core/helpers';
import { DrawnDisc, isBoxOverDisc } from '../camera/pointer.rules';

export const LEADER_START = 3.4;
const ELBOW_GAP = 14;

export interface TakenPlace {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly isName?: boolean;
}

export interface PanelEdges {
  readonly l: number;
  readonly r: number;
  readonly t: number;
  readonly b: number;
}

export interface Stage {
  readonly w: number;
  readonly h: number;
  readonly hole?: HoleDisc;
  readonly disc?: DrawnDisc;
  readonly bodies?: readonly BodyMark[];
}

export interface BodyMark {
  readonly x: number;
  readonly y: number;
}

export interface HoleDisc {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

const HOLE_CLEARANCE = 4;
const BODY_TARGET_HALF = 24;
const BODY_CLEARANCE = 2;

const isOverDisc = (
  disc: DrawnDisc | undefined,
  box: { readonly x: number; readonly y: number },
  size: { readonly w: number; readonly h: number },
): boolean =>
  disc !== undefined &&
  isBoxOverDisc(
    disc,
    {
      l: box.x,
      r: box.x + size.w,
      t: box.y - size.h / 2,
      b: box.y + size.h / 2,
    },
    HOLE_CLEARANCE,
  );

const isOverBody = (
  bodies: readonly BodyMark[] | undefined,
  own: number,
  box: { readonly x: number; readonly y: number },
  size: { readonly w: number; readonly h: number },
): boolean => {
  const reach = BODY_TARGET_HALF + BODY_CLEARANCE;
  return (bodies ?? []).some(
    (body, rank) =>
      rank !== own &&
      box.x < body.x + reach &&
      box.x + size.w > body.x - reach &&
      Math.abs(box.y - body.y) < size.h / 2 + reach,
  );
};

const offsetAcross = (place: TakenPlace, x: number, width: number): number =>
  place.isName ? place.x + place.w / 2 - (x + width / 2) : place.x - x;

const isOverHole = (
  hole: HoleDisc | undefined,
  box: { readonly x: number; readonly y: number },
  size: { readonly w: number; readonly h: number },
): boolean => {
  if (!hole) {
    return false;
  }
  const dx = hole.x - clamp(hole.x, box.x, box.x + size.w);
  const dy = hole.y - clamp(hole.y, box.y - size.h / 2, box.y + size.h / 2);
  return Math.hypot(dx, dy) < hole.radius + HOLE_CLEARANCE;
};

export function placeTag(
  planet: { readonly x: number; readonly y: number; readonly gap: number },
  size: { readonly w: number; readonly h: number },
  stage: Stage,
  panels: readonly PanelEdges[],
): { x: number; y: number; onText: boolean } {
  const { w: lw, h: lh } = size;
  const x = clamp(planet.x + planet.gap, 2, stage.w - lw - 2);
  const y = clamp(planet.y - lh - planet.gap * 0.5, 2, stage.h - lh - 2);
  const isOnText = panels.some(
    (z) => x + lw > z.l && x < z.r && y + lh > z.t && y < z.b,
  );
  return { x, y, onText: isOnText };
}

export function placeName(
  planet: {
    readonly x: number;
    readonly y: number;
    readonly radius: number;
    readonly objectRadius: number;
    readonly dpr: number;
    readonly named: boolean;
    readonly rank?: number;
  },
  size: { readonly w: number; readonly h: number },
  stage: Stage,
  taken: TakenPlace[],
): { x: number; y: number; dir: number; free: boolean } {
  const { x: px, y: py } = planet;
  const { w: lw, h: lh } = size;
  const stageW = stage.w;
  const stageH = stage.h;
  const elbow = elbowOf(planet, lw, stageW);
  const rise = (py <= stageH / 2 ? -1 : 1) * 24;
  const hasRoomRight = px + elbow + ELBOW_GAP + lw <= stageW;
  const hasRoomLeft = px - elbow - ELBOW_GAP - lw >= 0;
  const outward = px >= stageW / 2 ? 1 : -1;
  const dir = (outward > 0 && hasRoomRight) || !hasRoomLeft ? 1 : -1;
  const placeX = (d: number): number => {
    let x2 = px + d * (elbow + ELBOW_GAP);
    if (d < 0) {
      x2 -= lw;
    }
    return clamp(x2, 2, stageW - lw - 2);
  };
  const boundY = (y2: number): number =>
    clamp(y2, lh / 2 + 2, stageH - lh / 2 - 2);
  const isTaken = takenTest(stage, taken, planet.rank ?? -1, size);
  const first = { x: placeX(dir), y: boundY(py + rise), dir };
  if (!planet.named) {
    return { ...first, free: true };
  }
  const flanks = [dir, -dir].filter(
    (d) => d === dir || (d > 0 ? hasRoomRight : hasRoomLeft),
  );
  const found = firstFreePlace(
    flanks,
    [
      (fits) => firstFreeRow(py + rise, lh + 8, fits),
      (fits) => firstClearRow(py + rise, rowsClearOf(stage.bodies, lh), fits),
    ],
    (d, row) => {
      const at = boundY(row);
      return isTaken(placeX(d), at) ? null : at;
    },
  );
  if (!found) {
    return { ...first, free: false };
  }
  const x = placeX(found.dir);
  taken.push({ x, y: found.y, w: lw, h: lh, isName: true });
  return { x, y: found.y, dir: found.dir, free: true };
}

type RowFit = (row: number) => number | null;

function takenTest(
  stage: Stage,
  taken: readonly TakenPlace[],
  rank: number,
  size: { readonly w: number; readonly h: number },
): (x: number, y: number) => boolean {
  const { w: lw, h: lh } = size;
  const slack = stage.bodies ? -BODY_CLEARANCE : 4;
  return (x, y) =>
    isOverHole(stage.hole, { x, y }, size) ||
    isOverDisc(stage.disc, { x, y }, size) ||
    isOverBody(stage.bodies, rank, { x, y }, size) ||
    taken.some(
      (q) =>
        Math.abs(offsetAcross(q, x, lw)) < (q.w + lw) / 2 - slack &&
        Math.abs(q.y - y) < (q.h + lh) / 2 + 4,
    );
}

function firstFreePlace(
  flanks: readonly number[],
  searches: readonly ((fits: RowFit) => number | null)[],
  fits: (dir: number, row: number) => number | null,
): { dir: number; y: number } | null {
  for (const search of searches) {
    for (const dir of flanks) {
      const y = search((row) => fits(dir, row));
      if (y !== null) {
        return { dir, y };
      }
    }
  }
  return null;
}

function elbowOf(
  planet: {
    readonly x: number;
    readonly radius: number;
    readonly objectRadius: number;
    readonly dpr: number;
  },
  width: number,
  stageW: number,
): number {
  const { x: px, radius: rBase, dpr } = planet;
  const elbow = Math.max(
    (rBase * LEADER_START) / dpr + 20,
    (planet.objectRadius / dpr) * 0.5,
  );
  return px + elbow + ELBOW_GAP + width > stageW &&
    px - elbow - ELBOW_GAP - width < 0
    ? (rBase * LEADER_START) / dpr + 12
    : elbow;
}

function firstFreeRow(
  start: number,
  step: number,
  fits: RowFit,
): number | null {
  for (let k = 0; k <= 4; k++) {
    for (const sign of k === 0 ? [1] : [-1, 1]) {
      const found = fits(start + sign * k * step);
      if (found !== null) {
        return found;
      }
    }
  }
  return null;
}

function rowsClearOf(
  bodies: readonly BodyMark[] | undefined,
  height: number,
): number[] {
  const reach = height / 2 + BODY_TARGET_HALF + BODY_CLEARANCE + 1;
  return (bodies ?? []).flatMap((body) => [body.y - reach, body.y + reach]);
}

function firstClearRow(
  start: number,
  rows: readonly number[],
  fits: RowFit,
): number | null {
  const nearest = [...rows].sort(
    (a, b) => Math.abs(a - start) - Math.abs(b - start),
  );
  for (const row of nearest) {
    const found = fits(row);
    if (found !== null) {
      return found;
    }
  }
  return null;
}
