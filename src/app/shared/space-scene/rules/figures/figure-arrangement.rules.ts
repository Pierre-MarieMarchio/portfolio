import { DrawnDisc, isBoxOverDisc } from '../camera/pointer.rules';
import type { SkyRoom } from './figure-room.rules';

export interface FigurePlacement {
  readonly dx: number;
  readonly dy: number;
  readonly scale: number;
}

export interface SkyShadow {
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
}

interface Surroundings {
  readonly room: SkyRoom;
  readonly taken: SkyRoom;
  readonly hole: SkyShadow | null;
  readonly disc: DrawnDisc | null;
  readonly gap: number;
}

interface Attempt {
  readonly scale: number;
  readonly isShadowAvoided: boolean;
}

const SCALES = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.42];
const GRID_STEPS = 8;

const widthOf = (box: SkyRoom): number => box.r - box.l;
const heightOf = (box: SkyRoom): number => box.b - box.t;

export const placedBox = (
  shape: SkyRoom,
  { dx, dy, scale }: FigurePlacement,
): SkyRoom => {
  const cx = (shape.l + shape.r) / 2 + dx;
  const cy = (shape.t + shape.b) / 2 + dy;
  const halfWidth = (widthOf(shape) * scale) / 2;
  const halfHeight = (heightOf(shape) * scale) / 2;
  return {
    l: cx - halfWidth,
    r: cx + halfWidth,
    t: cy - halfHeight,
    b: cy + halfHeight,
  };
};

const isApart = (a: SkyRoom, b: SkyRoom, gap: number): boolean =>
  a.l >= b.r + gap || b.l >= a.r + gap || a.t >= b.b + gap || b.t >= a.b + gap;

const isOverShadow = (box: SkyRoom, hole: SkyShadow | null): boolean => {
  if (!hole) {
    return false;
  }
  const x = Math.max(box.l, Math.min(hole.cx, box.r));
  const y = Math.max(box.t, Math.min(hole.cy, box.b));
  return Math.hypot(x - hole.cx, y - hole.cy) < hole.radius;
};

const within = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(value, high));

const centresFor = (
  room: SkyRoom,
  width: number,
  height: number,
  natural: { readonly x: number; readonly y: number },
): { x: number; y: number }[] => {
  const left = room.l + width / 2;
  const right = room.r - width / 2;
  const top = room.t + height / 2;
  const bottom = room.b - height / 2;
  const centres = [
    { x: within(natural.x, left, right), y: within(natural.y, top, bottom) },
  ];
  for (let i = 0; i <= GRID_STEPS; i++) {
    for (let j = 0; j <= GRID_STEPS; j++) {
      centres.push({
        x: left + ((right - left) * i) / GRID_STEPS,
        y: top + ((bottom - top) * j) / GRID_STEPS,
      });
    }
  }
  return centres;
};

const placeOne = (
  shape: SkyRoom,
  taken: readonly SkyRoom[],
  around: Surroundings,
  attempt: Attempt,
): FigurePlacement | null => {
  const { room, disc, gap } = around;
  const width = widthOf(shape) * attempt.scale;
  const height = heightOf(shape) * attempt.scale;
  if (width > widthOf(room) || height > heightOf(room)) {
    return null;
  }
  const natural = { x: (shape.l + shape.r) / 2, y: (shape.t + shape.b) / 2 };
  const offDiscWorth = Math.hypot(widthOf(room), heightOf(room));
  let best: FigurePlacement | null = null;
  let bestCost = Infinity;
  for (const centre of centresFor(room, width, height, natural)) {
    const placement = {
      dx: centre.x - natural.x,
      dy: centre.y - natural.y,
      scale: attempt.scale,
    };
    const box = placedBox(shape, placement);
    if (
      (attempt.isShadowAvoided && isOverShadow(box, around.hole)) ||
      !taken.every((other) => isApart(box, other, gap))
    ) {
      continue;
    }
    const cost =
      Math.hypot(placement.dx, placement.dy) +
      (disc && isBoxOverDisc(disc, box, 0) ? offDiscWorth : 0);
    if (cost < bestCost) {
      bestCost = cost;
      best = placement;
    }
  }
  return best;
};

const areaOf = (box: SkyRoom): number => widthOf(box) * heightOf(box);

const placeAll = (
  shapes: readonly SkyRoom[],
  around: Surroundings,
  attempt: Attempt,
): FigurePlacement[] | null => {
  const order = shapes
    .map((shape, i) => ({ shape, i }))
    .sort((a, b) => areaOf(b.shape) - areaOf(a.shape) || a.i - b.i);
  const taken = [around.taken];
  const placements: FigurePlacement[] = [];
  for (const { shape, i } of order) {
    const placement = placeOne(shape, taken, around, attempt);
    if (!placement) {
      return null;
    }
    placements[i] = placement;
    taken.push(placedBox(shape, placement));
  }
  return placements;
};

const clampedInto = (
  shape: SkyRoom,
  room: SkyRoom,
  scale: number,
): FigurePlacement => {
  const placed = placedBox(shape, { dx: 0, dy: 0, scale });
  const dx =
    placed.l < room.l ? room.l - placed.l : Math.min(0, room.r - placed.r);
  const dy =
    placed.t < room.t ? room.t - placed.t : Math.min(0, room.b - placed.b);
  return { dx, dy, scale };
};

export const arrangeFigures = (
  shapes: readonly SkyRoom[],
  around: Surroundings,
): FigurePlacement[] => {
  for (const isShadowAvoided of [true, false]) {
    for (const scale of SCALES) {
      const placements = placeAll(shapes, around, { scale, isShadowAvoided });
      if (placements) {
        return placements;
      }
    }
  }
  const smallest = SCALES.at(-1) ?? 1;
  return shapes.map((shape) => clampedInto(shape, around.room, smallest));
};
