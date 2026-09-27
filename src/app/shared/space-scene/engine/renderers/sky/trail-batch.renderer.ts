import {
  groupAlpha,
  groupWidth,
  isAccentGroup,
  TRAIL_GROUPS,
  TRAIL_HEAD,
  TRAIL_TAIL_LIGHT,
  trailGroup,
} from '../../../rules/sky/trail-steps.rules';

export interface TrailSegment {
  readonly x: number;
  readonly y: number;
  readonly qx: number;
  readonly qy: number;
  readonly alpha: number;
  readonly width: number;
}

export interface TrailTones {
  readonly ink: string;
  readonly accent: string;
  readonly dpr: number;
}

const noPoints = (): number[] => [];

const strokeSegments = (
  ctx: CanvasRenderingContext2D,
  points: readonly number[],
): void => {
  ctx.beginPath();
  for (let i = 0; i + 3 < points.length; i += 4) {
    ctx.moveTo(points[i] ?? 0, points[i + 1] ?? 0);
    ctx.lineTo(points[i + 2] ?? 0, points[i + 3] ?? 0);
  }
  ctx.stroke();
};

export class TrailBatchRenderer {
  private readonly groups = Array.from({ length: TRAIL_GROUPS }, noPoints);

  public add(trail: TrailSegment, isAccent: boolean, dpr: number): void {
    const width = trail.width / dpr;
    const mx = trail.x + (trail.qx - trail.x) * TRAIL_HEAD;
    const my = trail.y + (trail.qy - trail.y) * TRAIL_HEAD;
    this.groups[trailGroup(isAccent, trail.alpha, width)]?.push(
      trail.x,
      trail.y,
      mx,
      my,
    );
    this.groups[
      trailGroup(isAccent, trail.alpha * TRAIL_TAIL_LIGHT, width)
    ]?.push(mx, my, trail.qx, trail.qy);
  }

  public flush(ctx: CanvasRenderingContext2D, tones: TrailTones): void {
    ctx.lineCap = 'round';
    for (const [group, points] of this.groups.entries()) {
      if (points.length > 0) {
        ctx.strokeStyle = isAccentGroup(group) ? tones.accent : tones.ink;
        ctx.globalAlpha = groupAlpha(group);
        ctx.lineWidth = groupWidth(group) * tones.dpr;
        strokeSegments(ctx, points);
        points.length = 0;
      }
    }
  }
}
