import { TAU } from '@app/core/helpers';
import type { FigurePoint, PlacedFigure } from '../../../models/scene.model';
import {
  holeDistance,
  ScreenHole,
} from '../../../rules/camera/projection.rules';
import type { Figure } from '../../../rules/figures/constellations.rules';
import {
  figureLabelFont,
  figureLabelSpacing,
  figureNameAt,
} from '../../../rules/figures/figure-label.rules';
import type { Zone } from '../../../rules/panel-veil.rules';

export interface FigureLight {
  readonly on: number;
  readonly alpha: number;
  readonly growth: number;
}

export interface FigureInk {
  readonly ctx: CanvasRenderingContext2D;
  readonly args: {
    readonly dpr: number;
    readonly accent: string;
    readonly entry: number;
    readonly time: number;
    readonly shown: number;
    readonly hole: ScreenHole | null;
    readonly topBar: Zone | null;
  };
}

const isHidden = (ink: FigureInk, [x, y]: FigurePoint): boolean => {
  const hole = ink.args.hole;
  return hole !== null && holeDistance(x, y, hole) < hole.radius * 1.05;
};

export const strokeFigure = (
  ink: FigureInk,
  figure: Figure,
  points: readonly FigurePoint[],
  light: FigureLight,
): void => {
  const { ctx, args } = ink;
  ctx.globalAlpha = light.alpha * (0.16 + 0.26 * light.on) * args.entry;
  ctx.strokeStyle = args.accent;
  ctx.lineWidth = Math.max(0.7, 0.9 * args.dpr);
  ctx.beginPath();
  for (const [i, j] of figure.lines) {
    const from = points[i];
    const to = points[j];
    if (from && to && !isHidden(ink, from) && !isHidden(ink, to)) {
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
    }
  }
  ctx.stroke();
};

const starRadius = (ink: FigureInk, brightness: number, i: number): number => {
  const pulse = 0.82 + 0.18 * Math.sin(ink.args.time * 0.6 + i * 1.7);
  return (1.2 + 1.6 * brightness) * ink.args.dpr * pulse;
};

const drawFigureStar = (
  ink: FigureInk,
  [x, y]: FigurePoint,
  rr: number,
  light: FigureLight,
): void => {
  const { ctx, args } = ink;
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

export const drawFigureStars = (
  ink: FigureInk,
  figure: Figure,
  points: readonly FigurePoint[],
  light: FigureLight,
): void => {
  for (const [i, point] of points.entries()) {
    if (!isHidden(ink, point)) {
      const brightness = figure.pts[i]?.[2] ?? 0.7;
      const radius = starRadius(ink, brightness, i) * light.growth;
      drawFigureStar(ink, point, radius, light);
    }
  }
};

export const nameFigure = (
  ink: FigureInk,
  { points, name: fitted }: PlacedFigure,
  on: number,
  text: string,
): void => {
  const { ctx, args } = ink;
  ctx.globalAlpha = on * args.shown * 0.9 * args.entry;
  ctx.fillStyle = '#ffffff';
  ctx.font = figureLabelFont(args.dpr);
  const name =
    fitted ??
    figureNameAt(points, {
      bar: args.topBar,
      dpr: args.dpr,
      text,
      measure: (shown) => ctx.measureText(shown).width,
    });
  ctx.textBaseline = name.baseline;
  ctx.letterSpacing = figureLabelSpacing;
  ctx.fillText(text, name.x, name.y);
  ctx.letterSpacing = '0px';
};
