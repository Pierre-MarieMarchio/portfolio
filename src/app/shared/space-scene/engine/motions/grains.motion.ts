import { CURSOR_REACH } from '../../models/scene-constants.model';
import { Grain } from '../../rules/scene-bodies.rules';
import { TurntableMotion } from './turntable.motion';
import type { SceneFrame } from '../../rules/scene-frame.rules';

export class GrainsMotion {
  private arrival = 0;
  private hasArrivalMoved = false;
  private isPushed = false;
  private pointer: { readonly x: number; readonly y: number } | null = null;
  private reach = 0;
  private dpr = 1;

  constructor(private readonly turntable: TurntableMotion) {}

  public get entry(): number {
    return this.arrival;
  }

  public get hasMoved(): boolean {
    return this.hasArrivalMoved || this.isPushed;
  }

  public get isSettled(): boolean {
    return this.arrival >= 1 && !this.isPushed;
  }

  public start(isReduced: boolean): void {
    this.arrival = isReduced ? 1 : 0;
  }

  public update(dt: number, isReduced: boolean): void {
    const before = this.arrival;
    if (this.arrival < 1) {
      this.arrival = Math.min(1, this.arrival + dt / (isReduced ? 0.001 : 6.2));
    }
    this.hasArrivalMoved = before !== this.arrival;
  }

  public begin(frame: SceneFrame): void {
    this.pointer = this.turntable.held ? null : frame.pointer;
    this.reach = CURSOR_REACH * frame.dpr;
    this.dpr = frame.dpr;
    this.isPushed = false;
  }

  public push(grain: Grain, sx: number, sy: number): void {
    const pointer = this.pointer;
    if (pointer) {
      const reach = this.reach;
      const ddx = sx - pointer.x;
      const ddy = sy - pointer.y;
      const d2 = ddx * ddx + ddy * ddy;
      if (d2 < reach * reach && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const force = (1 - d / reach) * 4 * this.dpr;
        grain.dx += (ddx / d) * force;
        grain.dy += (ddy / d) * force;
      }
    }
    grain.dx *= 0.88;
    grain.dy *= 0.88;
    if (Math.abs(grain.dx) > 0.05 || Math.abs(grain.dy) > 0.05) {
      this.isPushed = true;
    }
  }
}
