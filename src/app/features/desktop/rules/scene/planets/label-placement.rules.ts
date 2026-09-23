import { clamp } from '@app/core/helpers';

/*
 * Where the planets' names go, in CSS pixels of the stage. Pure: the engine
 * hands in where the planet is and what is already taken, and writes the
 * answer; nothing here reads or writes the page.
 */

/** A place already taken on the stage: a text panel, or a name set down. */
export interface TakenPlace {
  /** The left edge. */
  readonly x: number;
  /** The vertical centre. */
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** A text panel, by its edges, in CSS pixels. */
export interface PanelEdges {
  readonly l: number;
  readonly r: number;
  readonly t: number;
  readonly b: number;
}

export interface Stage {
  readonly w: number;
  readonly h: number;
}

/**
 * The index's number: a two-character label right against its body, no
 * elbow, no search. It is the planet/project link and must never move off;
 * `onText` says it fell on the table, where it goes and the body stays.
 */
export function placeNumber(
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

/**
 * A planet's name: it leaves the structure by an elbow, towards the outside
 * of the frame and never over the disk. If the place is taken, the other
 * flank is tried, and a few rows up and down, before giving up: a permanent
 * name is not sacrificed to its neighbour.
 *
 * `taken` holds the panels and the names already set down; a name that
 * finds its place is added to it, so the next planet's avoids it.
 */
export function placeName(
  planet: {
    readonly x: number;
    readonly y: number;
    /** The planet's own radius, in device pixels. */
    readonly radius: number;
    /** The object's radius, in device pixels. */
    readonly objectRadius: number;
    readonly dpr: number;
    /** Whether the name is to be shown at all. */
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
  const hasRoomRight = px + elbow + 14 + lw <= stageW;
  const hasRoomLeft = px - elbow - 14 - lw >= 0;
  const outward = px >= stageW / 2 ? 1 : -1;
  const dir = (outward > 0 && hasRoomRight) || !hasRoomLeft ? 1 : -1;
  const placeX = (d: number): number => {
    let x2 = px + d * (elbow + 14);
    if (d < 0) {
      x2 -= lw;
    }
    return clamp(x2, 2, stageW - lw - 2);
  };
  const boundY = (y2: number): number =>
    clamp(y2, lh / 2 + 2, stageH - lh / 2 - 2);
  const isTaken = (x2: number, y2: number): boolean =>
    taken.some(
      (q) =>
        Math.abs(q.x - x2) < (q.w + lw) / 2 - 4 &&
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
      taken.push({ x, y, w: lw, h: lh });
      return { x, y, dir: d, free: true };
    }
  }
  return { ...first, free: false };
}

/**
 * How far the name leaves its planet, in CSS pixels: an elbow proportional
 * to the object's radius, shortened when neither flank would hold it.
 */
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
    (rBase * 3.4) / dpr + 20,
    (planet.objectRadius / dpr) * 0.5,
  );
  return px + elbow + 14 + width > stageW && px - elbow - 14 - width < 0
    ? (rBase * 3.4) / dpr + 12
    : elbow;
}

/**
 * The first row, from `start`, where `fits` answers a place: the row
 * itself, then one step up and down, and so on up to four steps.
 */
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
