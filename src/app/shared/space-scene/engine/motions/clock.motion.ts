import { clamp, finiteOr, halfLifeStep } from '@app/core/helpers';
import { isCloseUp, SceneState } from '../../rules/scene-state.rules';
import {
  Traveling,
  traveling,
  TRAVELING_END,
} from '../../rules/camera/traveling.rules';
import { TurntableMotion } from './turntable.motion';
import { CameraMotion } from './camera.motion';

export class ClockMotion {
  private elapsed = 0;
  private turned = 0;
  private marksElapsed = 0;
  private idle = 1;
  private isRunning = false;
  private isReduced = false;
  private hasIdleMoved = false;
  private trvTime = NaN;
  private trv: Traveling = traveling(0, false);

  constructor(
    private readonly camera: CameraMotion,
    private readonly turntable: TurntableMotion,
  ) {}

  public get time(): number {
    return this.elapsed;
  }

  public get phase(): number {
    return this.turned;
  }

  public get marksTime(): number {
    return this.marksElapsed;
  }

  public get hasMoved(): boolean {
    return this.isRunning || this.hasIdleMoved;
  }

  public get isSettled(): boolean {
    const isCrossing = !this.isReduced && this.elapsed < TRAVELING_END;
    return !this.isRunning && !isCrossing && this.idle === 1;
  }

  public traveling(isReduced: boolean): Traveling {
    if (this.trvTime !== this.elapsed) {
      this.trvTime = this.elapsed;
      this.trv = traveling(this.elapsed, isReduced);
    }
    return this.trv;
  }

  public skipCrossing(): void {
    this.elapsed = Math.max(this.elapsed, TRAVELING_END);
  }

  public update(dt: number, state: SceneState, isVisible: boolean): void {
    const isReduced = state.reduced;
    this.isReduced = isReduced;
    this.elapsed = finiteOr(this.elapsed, 0);
    const resume = isReduced ? 1 : clamp((this.elapsed - 8.8) / 1.3, 0, 1);
    const flyover =
      Math.min(1, this.camera.remaining / 0.22) *
      resume *
      resume *
      (3 - 2 * resume);
    this.isRunning = !state.paused && !isReduced && isVisible;
    if (this.isRunning) {
      this.run(dt, flyover, state);
    }
    this.yieldToHand(dt, isReduced);
  }

  private run(dt: number, flyover: number, state: SceneState): void {
    this.elapsed += dt;
    if (state.marksShown) {
      this.marksElapsed += dt;
    }
    const brake = isCloseUp(state) ? 0.12 : 1;
    this.turned +=
      dt *
      (1 - 0.92 * flyover) *
      brake *
      this.idle *
      this.traveling(state.reduced).spin;
  }

  private yieldToHand(dt: number, isReduced: boolean): void {
    const before = this.idle;
    const isHeld = this.turntable.held;
    const halfLife = isHeld ? 0.05 : 0.6;
    const pace = isReduced ? 1 : halfLifeStep(dt, halfLife);
    this.idle += ((isHeld ? 0 : 1) - this.idle) * pace;
    if (Math.abs(this.idle - 1) < 0.001) {
      this.idle = 1;
    }
    this.hasIdleMoved = before !== this.idle;
  }
}
