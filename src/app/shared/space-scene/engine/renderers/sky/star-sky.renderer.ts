import { SCENE_CONFIG } from '../../../models/scene-config.model';
import { clamp, smoothstep } from '@app/core/helpers';
import { Traveling } from '../../../rules/camera/traveling.rules';
import { SHADOW_EDGE } from '../../../models/scene-constants.model';
import {
  holeDistance,
  ScreenHole,
} from '../../../rules/camera/projection.rules';
import {
  buildStarField,
  Star,
  starCount,
} from '../../../rules/sky/star-field.rules';
import {
  SkyFrame,
  StarFlowMotion,
  StarPass,
} from '../../motions/star-flow.motion';
import { TrailBatchRenderer } from './trail-batch.renderer';

const { seconds: TRAIL_SECONDS, from: TRAIL_FROM } = SCENE_CONFIG.sky.trail;

export interface SkyCamera {
  readonly time: number;
  readonly reduced: boolean;
  readonly pointer: { readonly x: number; readonly y: number } | null;
  readonly dpr: number;
  readonly trv: Traveling;
  readonly azim: number;
  readonly elev: number;
  readonly scale: number;
  readonly camX: number;
  readonly camY: number;
  readonly hole: ScreenHole | null;
  readonly ink: string;
  readonly accent: string;
  readonly entry: number;
  readonly phone: boolean;
}

export interface SkyOffset {
  readonly panX: number;
  readonly panY: number;
}

interface TrailStroke {
  x: number;
  y: number;
  qx: number;
  qy: number;
  color: string;
  alpha: number;
  width: number;
}

const twinkleOf = (star: Star, cam: SkyCamera): number =>
  cam.reduced ? 1 : 0.72 + 0.28 * Math.sin(cam.time * 0.26 + star.phase);

const colorOf = (star: Star, cam: SkyCamera): string =>
  star.accent ? cam.accent : cam.ink;

const holeLight = (
  { x, y }: StarPass,
  hole: ScreenHole | null,
): number | null => {
  if (!hole) {
    return 1;
  }
  const reach = hole.radius * 3.2;
  const d = holeDistance(x, y, hole);
  if (d < hole.radius * SHADOW_EDGE) {
    return null;
  }
  if (d < hole.radius * 1.22) {
    return (d - hole.radius * SHADOW_EDGE) / (hole.radius * 0.2);
  }
  return d < reach ? 1 + 1.15 * Math.pow(1 - d / reach, 1.8) : 1;
};

const strokeTrail = (
  ctx: CanvasRenderingContext2D,
  stroke: TrailStroke,
): void => {
  const gradient = ctx.createLinearGradient(
    stroke.x,
    stroke.y,
    stroke.qx,
    stroke.qy,
  );
  gradient.addColorStop(0, stroke.color);
  gradient.addColorStop(0.45, stroke.color);
  gradient.addColorStop(1, 'transparent');
  ctx.globalAlpha = stroke.alpha;
  ctx.strokeStyle = gradient;
  ctx.lineCap = 'round';
  ctx.lineWidth = stroke.width;
  ctx.beginPath();
  ctx.moveTo(stroke.x, stroke.y);
  ctx.lineTo(stroke.qx, stroke.qy);
  ctx.stroke();
};

export class StarSkyRenderer {
  private stars: Star[] = [];
  private readonly batch = new TrailBatchRenderer();
  private builtW = 0;
  private builtH = 0;
  private isWarmed = false;
  private fill = '';
  private readonly lensed = { x: 0, y: 0 };
  private readonly stroke: TrailStroke = {
    x: 0,
    y: 0,
    qx: 0,
    qy: 0,
    color: '',
    alpha: 0,
    width: 0,
  };

  private readonly flow: StarFlowMotion;
  private readonly pass: StarPass;

  constructor(private readonly rnd: () => number) {
    this.flow = new StarFlowMotion(rnd);
    this.pass = this.flow.pass;
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cam: SkyCamera,
  ): SkyOffset {
    ctx.clearRect(0, 0, w, h);
    if (this.builtW !== w || this.builtH !== h) {
      this.build(w, h, cam);
    }
    if (!this.isWarmed && !cam.phone) {
      this.warm(ctx, cam);
    }
    this.isWarmed = true;
    const frame = this.flow.update(this.stars, w, h, cam);
    this.fill = '';
    for (const star of this.stars) {
      this.drawStar(ctx, star, frame);
    }
    if (cam.phone) {
      this.batch.flush(ctx, cam);
    }
    return { panX: frame.panX, panY: frame.panY };
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    star: Star,
    frame: SkyFrame,
  ): void {
    if (!this.flow.place(star, frame)) {
      return;
    }
    const pass = this.pass;
    const near = holeLight(pass, frame.cam.hole);
    if (near === null) {
      return;
    }
    pass.near = near;
    this.flow.follow(star, frame);
    if (this.drawTrail(ctx, star, frame)) {
      this.drawDot(ctx, star, frame);
    }
  }

  private drawTrail(
    ctx: CanvasRenderingContext2D,
    star: Star,
    frame: SkyFrame,
  ): boolean {
    const pass = this.pass;
    const trailing = this.trailingShare(frame);
    if (trailing <= 0.004) {
      return true;
    }
    this.addTrailStroke(ctx, star, frame, trailing);
    if (trailing >= 0.996) {
      return false;
    }
    pass.near *= 1 - trailing;
    return true;
  }

  private trailingShare(frame: SkyFrame): number {
    const velocity = Math.hypot(this.pass.tx, this.pass.ty);
    return (
      frame.voyage *
      smoothstep(
        clamp((velocity / (TRAIL_FROM * frame.cam.dpr) - 0.7) / 0.3, 0, 1),
      )
    );
  }

  private addTrailStroke(
    ctx: CanvasRenderingContext2D,
    star: Star,
    frame: SkyFrame,
    trailing: number,
  ): void {
    const { pass, stroke } = this;
    stroke.x = pass.x;
    stroke.y = pass.y;
    stroke.qx = pass.x - pass.tx * TRAIL_SECONDS;
    stroke.qy = pass.y - pass.ty * TRAIL_SECONDS;
    stroke.color = colorOf(star, frame.cam);
    stroke.alpha =
      Math.min(
        0.8,
        (0.06 + star.alpha) *
          twinkleOf(star, frame.cam) *
          pass.near *
          (0.7 + 1.5 * frame.speed),
      ) * trailing;
    stroke.width = Math.max(0.7, this.drawnRadius(star, frame) * 0.8);
    if (frame.cam.phone) {
      this.batch.add(stroke, star.accent, frame.cam.dpr);
    } else {
      strokeTrail(ctx, stroke);
    }
  }

  private drawDot(
    ctx: CanvasRenderingContext2D,
    star: Star,
    frame: SkyFrame,
  ): void {
    const pass = this.pass;
    const gain = this.bendLight(frame);
    const size = this.drawnRadius(star, frame) * Math.min(2.1, Math.sqrt(gain));
    ctx.globalAlpha = Math.min(
      0.88,
      star.alpha *
        twinkleOf(star, frame.cam) *
        frame.cam.entry *
        pass.near *
        Math.min(2.5, gain),
    );
    const color = colorOf(star, frame.cam);
    if (color !== this.fill) {
      this.fill = color;
      ctx.fillStyle = color;
    }
    ctx.fillRect(
      this.lensed.x - size / 2,
      this.lensed.y - size / 2,
      Math.max(0.5, size),
      Math.max(0.5, size),
    );
  }

  private bendLight(frame: SkyFrame): number {
    const { x, y } = this.pass;
    const lensed = this.lensed;
    const { lens, einsteinRadius } = frame;
    lensed.x = x;
    lensed.y = y;
    if (!lens) {
      return 1;
    }
    const ldx = x - lens.x;
    const ldy = y - lens.y;
    const distance = Math.hypot(ldx, ldy);
    if (distance > 0.01 && distance < frame.lensReach) {
      const deflection = Math.min(
        frame.deflectionMax,
        (einsteinRadius * einsteinRadius) /
          Math.max(distance, einsteinRadius * 0.5),
      );
      lensed.x = x + (ldx / distance) * deflection;
      lensed.y = y + (ldy / distance) * deflection;
      return (
        1 +
        1.6 * Math.pow(einsteinRadius / (distance + einsteinRadius * 0.7), 2)
      );
    }
    return 1;
  }

  private drawnRadius(star: Star, frame: SkyFrame): number {
    return star.radius * (1 + (frame.scale - 1) * 0.42 * this.pass.depth);
  }

  private warm(ctx: CanvasRenderingContext2D, cam: SkyCamera): void {
    const stroke = this.stroke;
    for (const star of this.stars) {
      stroke.x = star.x;
      stroke.y = star.y;
      stroke.qx = star.x - 12 * cam.dpr;
      stroke.qy = star.y - 5 * cam.dpr;
      stroke.color = colorOf(star, cam);
      stroke.alpha = 0.004;
      stroke.width = Math.max(0.7, star.radius * 0.8);
      strokeTrail(ctx, stroke);
    }
    ctx.globalAlpha = 1;
  }

  private build(w: number, h: number, cam: SkyCamera): void {
    const count = starCount(w, h, cam.dpr, cam.phone);
    this.stars = buildStarField({ w, h, dpr: cam.dpr, count }, this.rnd);
    this.builtW = w;
    this.builtH = h;
  }
}
