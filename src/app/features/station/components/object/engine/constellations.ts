import { TAU } from './math';
import { ScreenHole } from './projection';

interface Figure {
  /** Where the figure sits in the sky, as fractions of the frame. */
  readonly x: number;
  readonly y: number;
  /** Its size, as a fraction of the frame's smaller side. */
  readonly t: number;
  /** Points in a unit square; the third number is the star's real brightness. */
  readonly pts: readonly (readonly [number, number, number])[];
  readonly lines: readonly (readonly [number, number])[];
}

/**
 * CONSTELLATIONS, one per part of "about". A constellation is not a body:
 * it is a figure TRACED between stars that have nothing to do with each
 * other, which is exactly what each part is. It sits at the back of the sky,
 * out of the disk's plane, and does not turn with it: it drifts with the
 * fixed stars.
 *
 * Four REAL figures, at the real positions of their stars, each chosen for
 * its silhouette: a person, an arc, a polygon, a winding line. The third
 * number is the star's brightness: a constellation reads by its hierarchy,
 * not by points all alike.
 */
export const CONSTELLATIONS: readonly Figure[] = [
  // 00 Profile, ORION: the most recognised figure of the sky, and the only
  // one here that draws someone: two shoulders, a belt, two feet.
  {
    x: 0.32,
    y: 0.2,
    t: 0.25,
    pts: [
      [0.72, 0.15, 1],
      [0.28, 0.19, 0.7],
      [0.62, 0.51, 0.75],
      [0.5, 0.49, 0.8],
      [0.38, 0.47, 0.75],
      [0.71, 0.88, 0.6],
      [0.23, 0.91, 1],
    ],
    lines: [
      [0, 1],
      [1, 4],
      [0, 2],
      [4, 3],
      [3, 2],
      [2, 5],
      [4, 6],
      [6, 5],
    ],
  },
  // 01 Skills, CORONA BOREALIS: a clean arc of seven stars, not one line
  // too many: a whole that holds together.
  {
    x: 0.09,
    y: 0.15,
    t: 0.18,
    pts: [
      [0.05, 0.28, 0.55],
      [0.16, 0.52, 0.7],
      [0.34, 0.68, 1],
      [0.55, 0.73, 0.6],
      [0.72, 0.63, 0.55],
      [0.87, 0.45, 0.6],
      [0.97, 0.21, 0.5],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
  },
  // 02 Method, AURIGA: the only CLOSED figure of this sky, a pentagon that
  // stands on its own. A method is a closed frame.
  {
    x: 0.08,
    y: 0.79,
    t: 0.22,
    pts: [
      [0.42, 0.05, 1],
      [0.73, 0.2, 0.8],
      [0.81, 0.53, 0.6],
      [0.5, 0.97, 0.85],
      [0.09, 0.61, 0.7],
      [0.33, 0.29, 0.45],
      [0.26, 0.38, 0.4],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
      [0, 5],
      [5, 6],
    ],
  },
  // 03 Path, DRACO: a long winding chain across the sky, head to tail. No
  // other figure says "a long way" as well.
  {
    x: 0.36,
    y: 0.78,
    t: 0.31,
    pts: [
      [0.92, 0.84, 1],
      [0.83, 0.97, 0.8],
      [0.99, 0.95, 0.5],
      [0.73, 0.77, 0.7],
      [0.61, 0.6, 0.7],
      [0.46, 0.65, 0.6],
      [0.33, 0.5, 0.6],
      [0.2, 0.28, 0.75],
      [0.06, 0.14, 0.6],
    ],
    lines: [
      [0, 2],
      [2, 1],
      [1, 0],
      [1, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
    ],
  },
];

export interface ConstellationsArgs {
  readonly dpr: number;
  readonly accent: string;
  readonly entry: number;
  readonly panX: number;
  readonly panY: number;
  readonly time: number;
  /** Fade of the about view, 0 → 1. */
  readonly shown: number;
  /** Light of each figure, 0 standby → 1 open. */
  readonly lit: readonly number[];
  readonly hole: ScreenHole | null;
  /** The name of each figure, in the parts' order. */
  readonly labels: readonly string[];
}

interface ConstellationsLayer {
  readonly ctx: CanvasRenderingContext2D;
  readonly w: number;
  readonly h: number;
  readonly args: ConstellationsArgs;
  readonly drift: number;
}

interface FigureLight {
  readonly on: number;
  readonly alpha: number;
}

type FigurePoint = readonly [number, number];

const FIGURE_DEPTH = 0.16;

/**
 * The figure is pinned to the sky: the same drift and parallax as the fixed
 * stars, at the furthest depth, so it barely moves and never with the disk.
 * All four stay in the sky at a standby light; the open part's lights up
 * and names itself. One points at a figure in a sky, one does not summon
 * it, and a sky where three figures vanish is no longer a sky.
 */
export const drawConstellations = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  args: ConstellationsArgs,
): void => {
  if (args.shown < 0.02) {
    return;
  }
  const layer = {
    ctx,
    w,
    h,
    args,
    drift: args.time * 0.34 * FIGURE_DEPTH * 6,
  };
  ctx.lineCap = 'round';
  for (const [k, figure] of CONSTELLATIONS.entries()) {
    drawFigure(layer, figure, k);
  }
};

const drawFigure = (
  layer: ConstellationsLayer,
  figure: Figure,
  k: number,
): void => {
  const on = layer.args.lit[k] ?? 0;
  const alpha = (0.2 + 0.8 * on) * layer.args.shown;
  if (alpha < 0.02) {
    return;
  }
  const light = { on, alpha };
  const points = figurePoints(layer, figure);
  strokeFigure(layer, figure, points, light);
  for (const [i, point] of points.entries()) {
    if (!isHidden(layer, point)) {
      const brightness = figure.pts[i]?.[2] ?? 0.7;
      drawFigureStar(layer, point, starRadius(layer, brightness, i), light);
    }
  }
  // Named, as a planet is on the home page.
  if (on < 0.12) {
    return;
  }
  nameFigure(layer, points, on, layer.args.labels[k] ?? '');
};

const figurePoints = (
  layer: ConstellationsLayer,
  figure: Figure,
): FigurePoint[] => {
  const { w, h, args } = layer;
  const size = Math.min(w, h) * figure.t;
  const ox = w * figure.x - args.panX * 0.55 * w * FIGURE_DEPTH + layer.drift;
  const oy = h * figure.y - args.panY * 0.55 * h * FIGURE_DEPTH;
  return figure.pts.map(
    ([px, py]) => [ox + (px - 0.5) * size, oy + (py - 0.5) * size] as const,
  );
};

const strokeFigure = (
  layer: ConstellationsLayer,
  figure: Figure,
  points: readonly FigurePoint[],
  light: FigureLight,
): void => {
  const { ctx, args } = layer;
  ctx.globalAlpha = light.alpha * (0.16 + 0.26 * light.on) * args.entry;
  ctx.strokeStyle = args.accent;
  ctx.lineWidth = Math.max(0.7, 0.9 * args.dpr);
  ctx.beginPath();
  for (const [i, j] of figure.lines) {
    const from = points[i];
    const to = points[j];
    if (from && to && !isHidden(layer, from) && !isHidden(layer, to)) {
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
    }
  }
  ctx.stroke();
};

const starRadius = (
  layer: ConstellationsLayer,
  brightness: number,
  i: number,
): number => {
  const pulse = 0.82 + 0.18 * Math.sin(layer.args.time * 0.6 + i * 1.7);
  // The star's real brightness, not a uniform size.
  return (1.2 + 1.6 * brightness) * layer.args.dpr * pulse;
};

const drawFigureStar = (
  layer: ConstellationsLayer,
  [x, y]: FigurePoint,
  rr: number,
  light: FigureLight,
): void => {
  const { ctx, args } = layer;
  const halo = ctx.createRadialGradient(x, y, 0, x, y, rr * 5);
  halo.addColorStop(0, args.accent);
  halo.addColorStop(1, 'transparent');
  ctx.globalAlpha = light.alpha * 0.3 * light.on * args.entry;
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, rr * 5, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = light.alpha * 0.95 * args.entry;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, rr, 0, TAU);
  ctx.fill();
};

const nameFigure = (
  layer: ConstellationsLayer,
  points: readonly FigurePoint[],
  on: number,
  label: string,
): void => {
  const { ctx, args } = layer;
  const top = Math.min(...points.map((p) => p[1]));
  const left = Math.min(...points.map((p) => p[0]));
  ctx.globalAlpha = on * args.shown * 0.9 * args.entry;
  ctx.fillStyle = '#ffffff';
  ctx.font = `500 ${String(Math.round(11 * args.dpr))}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.textBaseline = 'bottom';
  ctx.letterSpacing = '0.14em';
  ctx.fillText(label.toUpperCase(), left, top - 16 * args.dpr);
  ctx.letterSpacing = '0px';
};

// Nothing crosses the shadow, not even a figure of the background.
const isHidden = (layer: ConstellationsLayer, [x, y]: FigurePoint): boolean => {
  const hole = layer.args.hole;
  return (
    hole !== null &&
    Math.sqrt((x - hole.cx) * (x - hole.cx) + (y - hole.cy) * (y - hole.cy)) <
      hole.radius * 1.05
  );
};
