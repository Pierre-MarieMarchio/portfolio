import { SCENE_CONFIG } from '../../../models/scene-config.model';
import type { SkyOffset } from './star-sky.renderer';
import type { SceneFrame } from '../../../rules/scene-frame.rules';
import type { ScreenHole } from '../../../rules/camera/projection.rules';
import {
  CONSTELLATIONS,
  Figure,
} from '../../../rules/figures/constellations.rules';
import {
  figureLabelFont,
  figureNameSize,
} from '../../../rules/figures/figure-label.rules';
import {
  figureInRoom,
  nameInRoom,
  SkyRoom,
  spanOf,
} from '../../../rules/figures/figure-room.rules';
import {
  diskOnScreen,
  drawnDisc,
  DrawnDisc,
} from '../../../rules/camera/pointer.rules';
import type { Zone } from '../../../rules/panel-veil.rules';
import type { FigurePoint, PlacedFigure } from '../../../models/scene.model';
import { PAN_PARALLAX, SKY_DRIFT } from '../../../models/scene-constants.model';
import type { PhoneFigures } from '../../../rules/figures/phone-figures.rules';
import {
  FigureTarget,
  figureTargetOf,
  isOverTarget,
} from '../../../rules/figures/figure-target.rules';
import { FigureTargetsRenderer } from './figure-targets.renderer';
import {
  drawFigureStars,
  FigureLight,
  nameFigure,
  strokeFigure,
} from './figure-strokes.renderer';

interface ConstellationsArgs {
  readonly w: number;
  readonly h: number;
  readonly dpr: number;
  readonly accent: string;
  readonly entry: number;
  readonly panX: number;
  readonly panY: number;
  readonly time: number;
  readonly shown: number;
  readonly lit: readonly number[];
  readonly hole: ScreenHole | null;
  readonly labels: readonly string[];
  readonly topBar: Zone | null;
  readonly room: SkyRoom | null;
  readonly disc: DrawnDisc | null;
  readonly hover: { readonly x: number; readonly y: number } | null;
  readonly areFiguresShown: boolean;
  readonly zones: readonly Zone[];
  readonly phone: PhoneFigures | null;
}

interface ConstellationsLayer {
  readonly ctx: CanvasRenderingContext2D;
  readonly w: number;
  readonly h: number;
  readonly args: ConstellationsArgs;
  readonly drift: number;
  readonly targets: FigureTargetsRenderer;
}

const FIGURE_DEPTH = 0.16;
const UNLIT_LIGHT = SCENE_CONFIG.figures.light.unlit;
const UNLIT_LIGHT_WHEN_SHOWN = SCENE_CONFIG.figures.light.unlitWhenShown;
const HOVERED_LIGHT = SCENE_CONFIG.figures.light.hovered;
const UNLIT_GROWTH = 0.25;
const TARGETS_FROM = 0.5;

const drawConstellations = (
  ctx: CanvasRenderingContext2D,
  targets: FigureTargetsRenderer,
  args: ConstellationsArgs,
): void => {
  if (args.shown < 0.02) {
    targets.hideAll();
    return;
  }
  const layer = {
    ctx,
    w: args.w,
    h: args.h,
    args,
    drift: args.time * SKY_DRIFT * FIGURE_DEPTH * 6,
    targets,
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
  const { args } = layer;
  const on = args.lit[k] ?? 0;
  const unlit = args.areFiguresShown ? UNLIT_LIGHT_WHEN_SHOWN : UNLIT_LIGHT;
  if ((unlit + (1 - unlit) * on) * args.shown < 0.02) {
    layer.targets.hide(k);
    return;
  }
  const label = (args.labels[k] ?? '').toUpperCase();
  const placed = args.phone
    ? args.phone.at(k, args.lit, on)
    : placeFigure(layer, figurePoints(layer, figure), on, label);
  const target = aimTarget(layer, k, placed.points);
  const light = lightOf(args, on, isOverTarget(target, args.hover, args.dpr));
  strokeFigure(layer, figure, placed.points, light);
  drawFigureStars(layer, figure, placed.points, light);
  if (on >= 0.12) {
    nameFigure(layer, placed, on, label);
  }
};

const lightOf = (
  args: ConstellationsArgs,
  on: number,
  isHovered: boolean,
): FigureLight => {
  const unlit = args.areFiguresShown ? UNLIT_LIGHT_WHEN_SHOWN : UNLIT_LIGHT;
  const floor = isHovered ? HOVERED_LIGHT : unlit;
  return {
    on,
    alpha: (floor + (1 - floor) * on) * args.shown,
    growth: args.areFiguresShown ? 1 + UNLIT_GROWTH * (1 - on) : 1,
  };
};

const placeFigure = (
  layer: ConstellationsLayer,
  points: readonly FigurePoint[],
  on: number,
  text: string,
): PlacedFigure => {
  const { ctx, args } = layer;
  if (!args.room || on < 0.12) {
    return { points, name: null };
  }
  ctx.font = figureLabelFont(args.dpr);
  const size = figureNameSize(text, args.dpr, (shown) => {
    ctx.letterSpacing = '0px';
    return ctx.measureText(shown).width;
  });
  const fit = figureInRoom(points, {
    room: args.room,
    disc: args.disc,
    name: size,
    dpr: args.dpr,
  });
  const dx = fit.dx * on;
  const dy = fit.dy * on;
  return {
    points: points.map(([x, y]) => [x + dx, y + dy] as const),
    name: nameInRoom(
      { ...fit.name, x: fit.name.x + dx, y: fit.name.y + dy },
      size,
      args.room,
    ),
  };
};

const aimTarget = (
  layer: ConstellationsLayer,
  k: number,
  points: readonly FigurePoint[],
): FigureTarget => {
  const { w, h, args } = layer;
  const target = figureTargetOf(spanOf(points, args.dpr), {
    w,
    h,
    dpr: args.dpr,
    zones: args.zones,
    isShown: args.areFiguresShown && args.shown >= TARGETS_FROM,
  });
  layer.targets.write(k, target);
  return target;
};

const figurePoints = (
  layer: ConstellationsLayer,
  figure: Figure,
): FigurePoint[] => {
  const { w, h, args } = layer;
  const size = Math.min(w, h) * figure.t;
  const ox =
    w * figure.x - args.panX * PAN_PARALLAX * w * FIGURE_DEPTH + layer.drift;
  const oy = h * figure.y - args.panY * PAN_PARALLAX * h * FIGURE_DEPTH;
  return figure.pts.map(
    ([px, py]) => [ox + (px - 0.5) * size, oy + (py - 0.5) * size] as const,
  );
};

export class ConstellationsRenderer {
  private phone: PhoneFigures | null = null;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly targets: FigureTargetsRenderer,
  ) {}

  public draw(frame: SceneFrame, pan: SkyOffset): void {
    drawConstellations(this.ctx, this.targets, {
      w: frame.w,
      h: frame.h,
      dpr: frame.dpr,
      accent: frame.accent,
      entry: frame.entry,
      panX: pan.panX,
      panY: pan.panY,
      time: frame.time,
      shown: frame.figures,
      lit: frame.lit,
      hole: frame.hole,
      labels: frame.state.figureNames,
      topBar: frame.topBar,
      room: frame.figureRoom,
      disc: frame.figureRoom ? drawnDisc(diskOnScreen(frame), 1) : null,
      hover: frame.hoverPoint,
      areFiguresShown: frame.state.figuresShown,
      zones: frame.zones,
      phone: this.phoneFigures(frame),
    });
  }

  private phoneFigures(frame: SceneFrame): PhoneFigures | null {
    const rules = frame.phoneRules;
    if (!rules || !frame.state.phone || frame.figures < 0.02) {
      return null;
    }
    this.phone = rules.phoneFigures(frame, this.phone, this.ctx);
    return this.phone;
  }
}
