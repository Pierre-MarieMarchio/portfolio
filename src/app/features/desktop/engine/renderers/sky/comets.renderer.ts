import { COMETS } from '../../../rules/scene/sky/comets.rules';
import { clamp } from '../../../rules/scene/scene-math.rules';
import type { SceneFrame } from '../../../rules/scene/scene-frame.rules';
import { TAU } from '../../../rules/scene/scene-math.rules';
import {
  PlaneView,
  rollFlatten,
} from '../../../rules/scene/camera/projection.rules';
import { Comet, positionComet } from '../../../rules/scene/sky/comets.rules';

export interface CometsArgs {
  readonly phase: number;
  readonly elev: number;
  readonly azim: number;
  readonly flatten: number;
  readonly cr: number;
  readonly sr: number;
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  readonly dpr: number;
  readonly accent: string;
  readonly entry: number;
  readonly shown: number;
  readonly part: number;
  /** The name of each part, drawn by its comet. */
  readonly labels: readonly string[];
  readonly veil: (x: number, y: number) => number;
}

interface CometsLayer {
  readonly ctx: CanvasRenderingContext2D;
  readonly w: number;
  readonly h: number;
  readonly args: CometsArgs;
  readonly plane: PlaneView;
}

interface CometSighting {
  readonly comet: Comet;
  readonly position: { x: number; y: number; z: number; r: number };
  readonly nx: number;
  readonly ny: number;
  readonly sx: number;
  readonly sy: number;
  readonly ux: number;
  readonly uy: number;
  readonly isActive: boolean;
  readonly alpha: number;
}

interface Tail {
  readonly dx: number;
  readonly dy: number;
  readonly length: number;
  readonly half: number;
  readonly curve: number;
  readonly color: string;
  readonly alpha: number;
}

const drawComets = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  args: CometsArgs,
): void => {
  const { flatten, cr, sr } = args;
  const layer = { ctx, w, h, args, plane: { flatten, cr, sr } };
  ctx.lineCap = 'round';
  for (const [i, comet] of COMETS.entries()) {
    drawComet(layer, comet, i);
  }
};

const drawComet = (layer: CometsLayer, comet: Comet, i: number): void => {
  const sighting = sightComet(layer, comet, i);
  if (sighting.alpha < 0.015) {
    return;
  }
  drawTails(layer, sighting);
  drawHead(layer, sighting);
  nameComet(layer, sighting, layer.args.labels[i] ?? '');
};

const sightComet = (
  layer: CometsLayer,
  comet: Comet,
  i: number,
): CometSighting => {
  const { phase, elev, azim, cx, cy, radius } = layer.args;
  const position = positionComet(comet, phase, elev, azim);
  const { nx, ny } = rollFlatten(position, layer.plane, { nx: 0, ny: 0 });
  const sx = cx + nx * radius;
  const sy = cy + ny * radius;
  // Behind the shadow it goes out like everything else.
  const dCentre = Math.hypot(nx, ny);
  const shade =
    position.z < 0 && dCentre < 1.18 ? Math.max(0, (dCentre - 1) / 0.18) : 1;
  const isActive = i === layer.args.part;
  const alpha =
    (isActive ? 1 : 0.52) *
    layer.args.entry *
    layer.args.shown *
    shade *
    layer.args.veil(sx, sy);
  const d0 = Math.max(0.001, dCentre);
  return {
    comet,
    position,
    nx,
    ny,
    sx,
    sy,
    ux: nx / d0,
    uy: ny / d0,
    isActive,
    alpha,
  };
};

// TWO TAILS, because a comet has two and the difference shows: the
// plasma tail, thin and blue, points exactly away from the object; the
// dust tail, wide and pale, lags on the trajectory and curves. Both
// lengthen near the object: its radiation blows them.
const drawTails = (layer: CometsLayer, sighting: CometSighting): void => {
  const { phase, elev, azim, radius, dpr } = layer.args;
  const { comet, ux, uy, isActive, alpha } = sighting;
  const ahead = positionComet(comet, phase + 0.6, elev, azim);
  const next = rollFlatten(ahead, layer.plane, { nx: 0, ny: 0 });
  const vx0 = next.nx - sighting.nx;
  const vy0 = next.ny - sighting.ny;
  const vn0 = Math.max(0.0001, Math.hypot(vx0, vy0));
  let dx2 = ux - (0.62 * vx0) / vn0;
  let dy2 = uy - (0.62 * vy0) / vn0;
  const dn2 = Math.max(0.0001, Math.hypot(dx2, dy2));
  dx2 /= dn2;
  dy2 /= dn2;
  const length = Math.max(
    radius * 0.34,
    Math.min(
      radius * 2.1,
      radius * 0.7 * Math.pow(comet.periapsis / sighting.position.r, 1.7),
    ),
  );
  drawTail(layer, sighting, {
    dx: dx2,
    dy: dy2,
    length: length * 0.78,
    half: (isActive ? 5.2 : 3.4) * dpr,
    curve: 0.1,
    color: '#cfd8e6',
    alpha: alpha * 0.4,
  });
  drawTail(layer, sighting, {
    dx: ux,
    dy: uy,
    length,
    half: (isActive ? 2 : 1.3) * dpr,
    curve: 0,
    color: '#bcd8f5',
    alpha: alpha * 0.72,
  });
};

const drawTail = (
  layer: CometsLayer,
  { sx, sy }: CometSighting,
  tail: Tail,
): void => {
  const { ctx } = layer;
  const { dx, dy, length, half, curve, color } = tail;
  const nx2 = -dy;
  const ny2 = dx;
  const mx = sx + dx * length * 0.5 + nx2 * curve * length;
  const my = sy + dy * length * 0.5 + ny2 * curve * length;
  const ex = sx + dx * length + nx2 * curve * length * 2.2;
  const ey = sy + dy * length + ny2 * curve * length * 2.2;
  const gradient = ctx.createLinearGradient(sx, sy, ex, ey);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.42, color);
  gradient.addColorStop(1, 'transparent');
  ctx.globalAlpha = tail.alpha;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(sx + nx2 * half, sy + ny2 * half);
  ctx.quadraticCurveTo(mx + nx2 * half * 0.55, my + ny2 * half * 0.55, ex, ey);
  ctx.quadraticCurveTo(
    mx - nx2 * half * 0.55,
    my - ny2 * half * 0.55,
    sx - nx2 * half,
    sy - ny2 * half,
  );
  ctx.closePath();
  ctx.fill();
};

const drawHead = (layer: CometsLayer, sighting: CometSighting): void => {
  const { ctx } = layer;
  const { accent, dpr } = layer.args;
  const { sx, sy, isActive, alpha } = sighting;
  if (isActive) {
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, 18 * dpr);
    halo.addColorStop(0, accent);
    halo.addColorStop(1, 'transparent');
    ctx.globalAlpha = alpha * 0.55;
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sx, sy, 18 * dpr, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = alpha;
  ctx.fillStyle = isActive ? '#ffffff' : '#e7f2fb';
  ctx.beginPath();
  ctx.arc(sx, sy, Math.max(1.6, (isActive ? 3.6 : 2.5) * dpr), 0, TAU);
  ctx.fill();
};

// Named, as the planets are on the home page: otherwise one watches an
// effect, not an object of the story.
const nameComet = (
  layer: CometsLayer,
  sighting: CometSighting,
  name: string,
): void => {
  const { ctx, w, h } = layer;
  const { dpr } = layer.args;
  const { sx, sy, ux, uy, isActive, alpha } = sighting;
  const isInFrame =
    sx > 60 * dpr && sx < w - 60 * dpr && sy > 24 * dpr && sy < h - 24 * dpr;
  if (!name || !isInFrame) {
    return;
  }
  ctx.globalAlpha = alpha * (isActive ? 0.95 : 0.5);
  ctx.fillStyle = isActive ? '#ffffff' : '#cfd8e6';
  ctx.font = `500 ${String(Math.round(11 * dpr))}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.textAlign = ux < 0 ? 'right' : 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    name.toUpperCase(),
    sx - ux * 13 * dpr,
    sy - uy * 13 * dpr - 9 * dpr,
  );
  ctx.textAlign = 'left';
};

export class CometsRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  public draw(frame: SceneFrame): void {
    const about = frame.about;
    if (about <= 0.02) {
      return;
    }
    drawComets(this.ctx, frame.w, frame.h, {
      phase: frame.phase,
      elev: frame.elev,
      azim: frame.diskAzim,
      flatten: frame.flatten,
      cr: frame.cr,
      sr: frame.sr,
      cx: frame.cx,
      cy: frame.cy,
      radius: frame.radius,
      dpr: frame.dpr,
      accent: frame.accent,
      entry: frame.entry,
      shown: about,
      part: clamp(frame.inputs.part, 0, COMETS.length - 1),
      labels: frame.inputs.partLabels,
      veil: frame.veil,
    });
  }
}
