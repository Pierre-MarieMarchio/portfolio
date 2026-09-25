import { clamp } from '@app/core/helpers';

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
}

export interface HoleDisc {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

const HOLE_CLEARANCE = 4;

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
  const isTaken = (x2: number, y2: number): boolean =>
    isOverHole(stage.hole, { x: x2, y: y2 }, size) ||
    taken.some(
      (q) =>
        Math.abs(offsetAcross(q, x2, lw)) < (q.w + lw) / 2 - 4 &&
        Math.abs(q.y - y2) < (q.h + lh) / 2 + 4,
    );
  const first = { x: placeX(dir), y: boundY(py + rise), dir };
  if (!planet.named) {
    return { ...first, free: true };
  }
  const flanks = [dir, -dir].filter(
    (d) => d === dir || (d > 0 ? hasRoomRight : hasRoomLeft),
  );
  for (const d of flanks) {
    const x = placeX(d);
    const y = firstFreeRow(py + rise, lh + 8, (row) => {
      const at = boundY(row);
      return isTaken(x, at) ? null : at;
    });
    if (y !== null) {
      taken.push({ x, y, w: lw, h: lh, isName: true });
      return { x, y, dir: d, free: true };
    }
  }
  return { ...first, free: false };
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
  fits: (row: number) => number | null,
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
