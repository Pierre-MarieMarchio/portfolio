import { diskOnScreen, DrawnDisc, drawnDisc } from '../camera/pointer.rules';
import type { SceneFrame } from '../scene-frame.rules';
import { CONSTELLATIONS, Figure } from './constellations.rules';
import {
  FigureName,
  figureLabelFont,
  figureNameSize,
} from './figure-label.rules';
import {
  figureInRoom,
  nameBoxOf,
  nameInRoom,
  NameSize,
  SkyRoom,
  spanOf,
  unionOf,
} from './figure-room.rules';
import {
  arrangeFigures,
  FigurePlacement,
  placedBox,
  SkyShadow,
} from './figure-arrangement.rules';

type FigurePoints = readonly (readonly [number, number])[];

export interface FigureLayout {
  readonly placements: readonly (readonly FigurePlacement[])[];
  readonly names: readonly FigureName[];
  readonly points: readonly FigurePoints[];
  readonly shapes: readonly SkyRoom[];
  readonly sizes: readonly NameSize[];
  readonly room: SkyRoom;
}

export interface PlacedFigure {
  readonly points: readonly (readonly [number, number])[];
  readonly name: FigureName | null;
}

interface PhoneSky {
  readonly room: SkyRoom;
  readonly disc: DrawnDisc | null;
  readonly hole: SkyShadow | null;
  readonly names: readonly NameSize[];
  readonly dpr: number;
}

const FIGURE_GAP = 10;

export const phoneFigureLayout = (
  figures: readonly FigurePoints[],
  { room, disc, hole, names, dpr }: PhoneSky,
): FigureLayout => {
  const shapes = figures.map((points) => spanOf(points, dpr));
  const placements: FigurePlacement[][] = [];
  const litNames: FigureName[] = [];
  for (const [lit, points] of figures.entries()) {
    const size = names[lit] ?? { w: 0, h: 0, gap: 0 };
    const fit = figureInRoom(points, { room, disc, name: size, dpr });
    const own = { dx: fit.dx, dy: fit.dy, scale: 1 };
    const name = nameInRoom(
      { ...fit.name, x: fit.name.x + fit.dx, y: fit.name.y + fit.dy },
      size,
      room,
    );
    const taken = unionOf(
      placedBox(shapes[lit] ?? room, own),
      nameBoxOf(name, size),
    );
    const others = arrangeFigures(
      shapes.filter((_, k) => k !== lit),
      { room, taken, hole, disc, gap: FIGURE_GAP * dpr },
    );
    placements.push(
      shapes.map((_, k) => {
        if (k === lit) {
          return own;
        }
        return others[k < lit ? k : k - 1] ?? own;
      }),
    );
    litNames.push(name);
  }
  return {
    placements,
    names: litNames,
    points: figures,
    shapes,
    sizes: names,
    room,
  };
};

const blendedPlacement = (
  layout: FigureLayout,
  lit: readonly number[],
  k: number,
): FigurePlacement => {
  let dx = 0;
  let dy = 0;
  let scale = 0;
  let total = 0;
  for (const [j, placements] of layout.placements.entries()) {
    const weight = lit[j] ?? 0;
    const placement = placements[k];
    if (placement && weight > 0) {
      dx += placement.dx * weight;
      dy += placement.dy * weight;
      scale += placement.scale * weight;
      total += weight;
    }
  }
  return total > 0
    ? { dx: dx / total, dy: dy / total, scale: scale / total }
    : (layout.placements[k]?.[k] ?? { dx: 0, dy: 0, scale: 1 });
};

const NAMED_FROM = 0.12;

const phoneFigureAt = (
  layout: FigureLayout,
  k: number,
  lit: readonly number[],
  on: number,
): PlacedFigure => {
  const shape = layout.shapes[k];
  const raw = layout.points[k] ?? [];
  if (!shape) {
    return { points: raw, name: null };
  }
  const placement = blendedPlacement(layout, lit, k);
  const cx = (shape.l + shape.r) / 2;
  const cy = (shape.t + shape.b) / 2;
  const points = raw.map(
    ([x, y]) =>
      [
        cx + (x - cx) * placement.scale + placement.dx,
        cy + (y - cy) * placement.scale + placement.dy,
      ] as const,
  );
  const own = layout.placements[k]?.[k];
  const name = layout.names[k];
  const size = layout.sizes[k];
  if (on < NAMED_FROM || !own || !name || !size) {
    return { points, name: null };
  }
  return {
    points,
    name: nameInRoom(
      {
        ...name,
        x: name.x + placement.dx - own.dx,
        y: name.y + placement.dy - own.dy,
      },
      size,
      layout.room,
    ),
  };
};

export interface PhoneFigures {
  readonly sky: readonly number[];
  readonly labels: readonly string[];
  readonly at: (k: number, lit: readonly number[], on: number) => PlacedFigure;
}

const restingPoints = (w: number, h: number, figure: Figure): FigurePoints => {
  const size = Math.min(w, h) * figure.t;
  return figure.pts.map(
    ([px, py]) =>
      [
        w * figure.x + (px - 0.5) * size,
        h * figure.y + (py - 0.5) * size,
      ] as const,
  );
};

const skyOf = (frame: SceneFrame, room: SkyRoom): number[] => {
  const hole = frame.unzoomedHole;
  const disc = diskOnScreen(frame);
  return [
    frame.w,
    frame.h,
    frame.dpr,
    room.l,
    room.t,
    room.r,
    room.b,
    Math.round(hole.cx),
    Math.round(hole.cy),
    Math.round(hole.radius),
    Math.round(disc.cr * 1000),
    Math.round(disc.squash * 1000),
  ];
};

const SHADOW_REACH = 1.05;
const STAR_REACH = 3;

export const phoneFigures = (
  frame: SceneFrame,
  last: PhoneFigures | null,
  ctx: CanvasRenderingContext2D,
): PhoneFigures | null => {
  const room = frame.figureRoom;
  if (!room) {
    return null;
  }
  const sky = skyOf(frame, room);
  const labels = frame.state.figureNames;
  if (
    last &&
    last.labels === labels &&
    last.sky.every((value, i) => value === sky[i])
  ) {
    return last;
  }
  const { w, h, dpr } = frame;
  const hole = frame.unzoomedHole;
  ctx.font = figureLabelFont(dpr);
  ctx.letterSpacing = '0px';
  const layout = phoneFigureLayout(
    CONSTELLATIONS.map((figure) => restingPoints(w, h, figure)),
    {
      room,
      disc: drawnDisc({ ...diskOnScreen(frame), ...hole }, 1),
      hole: { ...hole, radius: hole.radius * SHADOW_REACH + STAR_REACH * dpr },
      names: CONSTELLATIONS.map((_, k) =>
        figureNameSize(
          (labels[k] ?? '').toUpperCase(),
          dpr,
          (text) => ctx.measureText(text).width,
        ),
      ),
      dpr,
    },
  );
  return {
    sky,
    labels,
    at: (k, lit, on) => phoneFigureAt(layout, k, lit, on),
  };
};
