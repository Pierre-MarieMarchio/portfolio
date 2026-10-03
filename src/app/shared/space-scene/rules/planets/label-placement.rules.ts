import { clamp } from '@app/core/helpers';
import { DrawnDisc, isBoxOverDisc } from '../camera/pointer.rules';
import { firstClearRow, firstFreePlace, firstFreeRow } from './name-rows.rules';

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
  readonly stacks?: boolean;
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
const STACK_LIFT = 2;
const STAGE_MARGIN = 2;
const NAME_RISE = 24;
const ROW_STEP_PADDING = 8;
const ELBOW_MIN_PADDING = 20;
const ELBOW_OBJECT_SHARE = 0.5;
const ELBOW_SQUEEZED_PADDING = 12;

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

const offsetAcross = (
  place: TakenPlace,
  x: number,
  width: number,
  isBoxed?: boolean,
): number =>
  place.isName || isBoxed
    ? place.x + place.w / 2 - (x + width / 2)
    : place.x - x;

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

interface NamedPlanet {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly objectRadius: number;
  readonly dpr: number;
  readonly named: boolean;
  readonly rank?: number;
}

interface LabelSize {
  readonly w: number;
  readonly h: number;
}

interface NamePlace {
  readonly x: number;
  readonly y: number;
  readonly dir: number;
}

interface NameFlow {
  readonly planetX: number;
  readonly elbow: number;
  readonly size: LabelSize;
  readonly stage: Stage;
  readonly dir: number;
  readonly flanks: readonly number[];
  readonly wantedRow: number;
}

function nameFlowOf(
  planet: NamedPlanet,
  size: LabelSize,
  stage: Stage,
): NameFlow {
  const elbow = elbowOf(planet, size.w, stage.w);
  const hasRoomRight = planet.x + elbow + ELBOW_GAP + size.w <= stage.w;
  const hasRoomLeft = planet.x - elbow - ELBOW_GAP - size.w >= 0;
  const outward = planet.x >= stage.w / 2 ? 1 : -1;
  const dir = (outward > 0 && hasRoomRight) || !hasRoomLeft ? 1 : -1;
  const flanks = [dir, -dir].filter(
    (flank) => flank === dir || (flank > 0 ? hasRoomRight : hasRoomLeft),
  );
  const rise = (planet.y <= stage.h / 2 ? -1 : 1) * NAME_RISE;
  return {
    planetX: planet.x,
    elbow,
    size,
    stage,
    dir,
    flanks,
    wantedRow: planet.y + rise,
  };
}

function nameColumn(flow: NameFlow, dir: number): number {
  const edge = flow.planetX + dir * (flow.elbow + ELBOW_GAP);
  const left = dir < 0 ? edge - flow.size.w : edge;
  return clamp(left, STAGE_MARGIN, flow.stage.w - flow.size.w - STAGE_MARGIN);
}

function nameRow(flow: NameFlow, row: number): number {
  const half = flow.size.h / 2;
  return clamp(row, half + STAGE_MARGIN, flow.stage.h - half - STAGE_MARGIN);
}

function freeNamePlace(
  planet: NamedPlanet,
  flow: NameFlow,
  isTaken: (x: number, y: number) => boolean,
): NamePlace | null {
  const { size, stage, wantedRow } = flow;
  const found = firstFreePlace(
    flow.flanks,
    [
      (fits) => firstFreeRow(wantedRow, size.h + ROW_STEP_PADDING, fits),
      (fits) =>
        firstClearRow(wantedRow, rowsClearOf(stage.bodies, size.h), fits),
    ],
    (dir, row) => {
      const at = nameRow(flow, row);
      return isTaken(nameColumn(flow, dir), at) ? null : at;
    },
  );
  return found
    ? { x: nameColumn(flow, found.dir), y: found.y, dir: found.dir }
    : stackedPlace(planet, size, stage, isTaken);
}

export function placeName(
  planet: NamedPlanet,
  size: LabelSize,
  stage: Stage,
  taken: TakenPlace[],
): { x: number; y: number; dir: number; free: boolean } {
  const flow = nameFlowOf(planet, size, stage);
  const first = {
    x: nameColumn(flow, flow.dir),
    y: nameRow(flow, flow.wantedRow),
    dir: flow.dir,
  };
  if (!planet.named) {
    return { ...first, free: true };
  }
  const isTaken = takenTest(stage, taken, planet.rank ?? -1, size);
  const place = freeNamePlace(planet, flow, isTaken);
  if (!place) {
    return { ...first, free: false };
  }
  taken.push({ x: place.x, y: place.y, w: size.w, h: size.h, isName: true });
  return { ...place, free: true };
}

function stackedLefts(
  planet: { readonly x: number },
  size: LabelSize,
  stage: Stage,
): number[] {
  const isOutRight = planet.x >= (stage.hole?.x ?? stage.w / 2);
  return [
    planet.x - size.w / 2,
    isOutRight
      ? planet.x - BODY_TARGET_HALF
      : planet.x + BODY_TARGET_HALF - size.w,
  ].map((left) => clamp(left, STAGE_MARGIN, stage.w - size.w - STAGE_MARGIN));
}

function stackedPlace(
  planet: { readonly x: number; readonly y: number },
  size: LabelSize,
  stage: Stage,
  isTaken: (x: number, y: number) => boolean,
): NamePlace | null {
  if (!stage.stacks) {
    return null;
  }
  const lift = BODY_TARGET_HALF + size.h / 2 + STACK_LIFT;
  const lefts = stackedLefts(planet, size, stage);
  for (const y of [planet.y + lift, planet.y - lift]) {
    const isInside =
      y - size.h / 2 >= STAGE_MARGIN &&
      y + size.h / 2 <= stage.h - STAGE_MARGIN;
    const x = lefts.find((left) => isInside && !isTaken(left, y));
    if (x !== undefined) {
      return { x, y, dir: 0 };
    }
  }
  return null;
}

function takenTest(
  stage: Stage,
  taken: readonly TakenPlace[],
  rank: number,
  size: LabelSize,
): (x: number, y: number) => boolean {
  const { w: lw, h: lh } = size;
  const slack = stage.bodies ? -BODY_CLEARANCE : 4;
  return (x, y) =>
    isOverHole(stage.hole, { x, y }, size) ||
    isOverDisc(stage.disc, { x, y }, size) ||
    isOverBody(stage.bodies, rank, { x, y }, size) ||
    taken.some(
      (q) =>
        Math.abs(offsetAcross(q, x, lw, stage.stacks)) <
          (q.w + lw) / 2 - slack && Math.abs(q.y - y) < (q.h + lh) / 2 + 4,
    );
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
  const { x: planetX, radius, dpr } = planet;
  const leader = (radius * LEADER_START) / dpr;
  const elbow = Math.max(
    leader + ELBOW_MIN_PADDING,
    (planet.objectRadius / dpr) * ELBOW_OBJECT_SHARE,
  );
  return planetX + elbow + ELBOW_GAP + width > stageW &&
    planetX - elbow - ELBOW_GAP - width < 0
    ? leader + ELBOW_SQUEEZED_PADDING
    : elbow;
}

function rowsClearOf(
  bodies: readonly BodyMark[] | undefined,
  height: number,
): number[] {
  const reach = height / 2 + BODY_TARGET_HALF + BODY_CLEARANCE + 1;
  return (bodies ?? []).flatMap((body) => [body.y - reach, body.y + reach]);
}
