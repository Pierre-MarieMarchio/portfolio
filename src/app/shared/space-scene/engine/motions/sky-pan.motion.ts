import { halfLifeStep } from '@app/core/helpers';
import { panWithin } from '../../rules/gestures/sky-look.rules';
import type { SceneFrame } from '../../rules/scene-frame.rules';
import type { SkyPan } from './zoom.motion';

const SNAP_WITHIN_PX = 0.5;

export class SkyPanMotion implements SkyPan {
  private nowX = 0;
  private nowY = 0;
  private aimX = 0;
  private aimY = 0;
  private step = 0;
  private readonly hole = { cx: 0, cy: 0, radius: 0 };

  public get x(): number {
    return this.nowX;
  }

  public get y(): number {
    return this.nowY;
  }

  public get hasMoved(): boolean {
    return this.step > 0;
  }

  public get isSettled(): boolean {
    return this.nowX === this.aimX && this.nowY === this.aimY;
  }

  public by(dx: number, dy: number): void {
    this.nowX += dx;
    this.nowY += dy;
    this.aimX = this.nowX;
    this.aimY = this.nowY;
  }

  public reset(): void {
    this.aimX = 0;
    this.aimY = 0;
  }

  public update(dt: number, isReduced: boolean): void {
    const k = isReduced ? 1 : halfLifeStep(dt, 0.55);
    const beforeX = this.nowX;
    const beforeY = this.nowY;
    this.nowX = eased(this.nowX, this.aimX, k);
    this.nowY = eased(this.nowY, this.aimY, k);
    this.step = Math.abs(this.nowX - beforeX) + Math.abs(this.nowY - beforeY);
  }

  public lay(frame: SceneFrame): void {
    if (this.nowX === 0 && this.nowY === 0) {
      return;
    }
    const { dpr, w, h } = frame;
    this.nowX = panWithin(this.nowX * dpr, frame.cx, w) / dpr;
    this.nowY = panWithin(this.nowY * dpr, frame.cy, h) / dpr;
    this.aimX = panWithin(this.aimX * dpr, frame.cx, w) / dpr;
    this.aimY = panWithin(this.aimY * dpr, frame.cy, h) / dpr;
    frame.cx += this.nowX * dpr;
    frame.cy += this.nowY * dpr;
    const hole = this.hole;
    hole.cx = frame.cx;
    hole.cy = frame.cy;
    hole.radius = frame.radius;
    frame.hole = hole;
  }
}

function eased(now: number, aim: number, k: number): number {
  const next = now + (aim - now) * k;
  return Math.abs(aim - next) < SNAP_WITHIN_PX ? aim : next;
}
