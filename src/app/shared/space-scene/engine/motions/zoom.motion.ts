import { halfLifeStep } from '@app/core/helpers';
import {
  anchorKeeping,
  clampZoom,
  CLOSE_LOOK,
  unzoomedAt,
  ZOOM_MIN,
  zoomedAt,
} from '../../rules/camera/zoom.rules';
import type { SceneFrame } from '../../rules/scene-frame.rules';

const SNAP_WITHIN = 0.002;

export class ZoomMotion {
  private now = ZOOM_MIN;
  private aim = ZOOM_MIN;
  private anchorX = 0;
  private anchorY = 0;
  private w = 0;
  private h = 0;
  private step = 0;
  private grip: { x: number; y: number; factor: number } | null = null;
  private readonly hole = { cx: 0, cy: 0, radius: 0 };

  public get held(): boolean {
    return this.grip !== null;
  }

  public get hasMoved(): boolean {
    return this.step > 0;
  }

  public get isSettled(): boolean {
    return this.grip === null && this.now === this.aim;
  }

  public resize(width: number, height: number): boolean {
    if (width === this.w && height === this.h) {
      return false;
    }
    if (this.w > 0 && this.h > 0) {
      this.anchorX *= width / this.w;
      this.anchorY *= height / this.h;
    }
    this.w = width;
    this.h = height;
    this.reset();
    return !this.isSettled;
  }

  public reset(): void {
    this.grip = null;
    this.aim = ZOOM_MIN;
  }

  public hold(x: number, y: number): void {
    this.grip = {
      x: unzoomedAt(x, this.anchorX, this.now),
      y: unzoomedAt(y, this.anchorY, this.now),
      factor: this.now,
    };
    this.aim = this.now;
  }

  public stretch(x: number, y: number, ratio: number): void {
    const grip = this.grip;
    if (!grip) {
      return;
    }
    const factor = clampZoom(grip.factor * ratio);
    this.anchorX = anchorKeeping(grip.x, x, factor, this.w);
    this.anchorY = anchorKeeping(grip.y, y, factor, this.h);
    this.now = factor;
    this.aim = factor;
  }

  public letGo(): void {
    this.grip = null;
  }

  public toggle(x: number, y: number): void {
    if (this.aim > ZOOM_MIN) {
      this.aim = ZOOM_MIN;
      return;
    }
    if (this.now === ZOOM_MIN) {
      this.anchorX = x;
      this.anchorY = y;
    }
    this.aim = CLOSE_LOOK;
  }

  public update(dt: number, isReduced: boolean): void {
    const before = this.now;
    if (this.grip === null) {
      const k = isReduced ? 1 : halfLifeStep(dt, 0.55);
      this.now += (this.aim - this.now) * k;
      if (Math.abs(this.aim - this.now) < SNAP_WITHIN) {
        this.now = this.aim;
      }
    }
    this.step = Math.abs(this.now - before);
  }

  public lay(frame: SceneFrame): void {
    const factor = this.now;
    if (factor === ZOOM_MIN) {
      return;
    }
    frame.cx = zoomedAt(frame.cx, this.anchorX, factor);
    frame.cy = zoomedAt(frame.cy, this.anchorY, factor);
    frame.radius *= factor;
    const hole = this.hole;
    hole.cx = frame.cx;
    hole.cy = frame.cy;
    hole.radius = frame.radius;
    frame.hole = hole;
  }
}
