import { clamp, finiteOr, halfLifeStep } from '@app/core/helpers';
import type { EngineInputs } from '../space-scene.engine';
import {
  Traveling,
  traveling,
  TRAVELING_END,
} from '../../rules/scene/camera/traveling.rules';
import { TurntableMotion } from './turntable.motion';
import { areMarksShown } from '../../rules/scene/planets/planet-focus.rules';
import { CameraMotion } from './camera.motion';

export class ClockMotion {
  private elapsed = 0;
  private turned = 0;
  private marksElapsed = 0;
  /** The disk's own rotation, 0 while held, easing back once let go. */
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

  // Motion switched back on: the crossing was already skipped, it is not
  // replayed from the start. Its clock stood still at 0 meanwhile, which
  // drew the object as a point.
  public skipCrossing(): void {
    this.elapsed = Math.max(this.elapsed, TRAVELING_END);
  }

  public update(dt: number, inputs: EngineInputs, isVisible: boolean): void {
    const isReduced = inputs.reduced;
    this.isReduced = isReduced;
    this.elapsed = finiteOr(this.elapsed, 0);
    // The brake gives back progressively too: a hard switch would jump.
    const resume = isReduced ? 1 : clamp((this.elapsed - 8.8) / 1.3, 0, 1);
    const flyover =
      Math.min(1, this.camera.remaining / 0.22) *
      resume *
      resume *
      (3 - 2 * resume);
    this.isRunning = !inputs.paused && !isReduced && isVisible;
    if (this.isRunning) {
      this.run(dt, flyover, inputs);
    }
    this.yieldToHand(dt, isReduced);
  }

  private run(dt: number, flyover: number, inputs: EngineInputs): void {
    this.elapsed += dt;
    // The bodies' own clock: each rises in turn.
    if (areMarksShown(inputs)) {
      this.marksElapsed += dt;
    }
    // The slowdown applies to the INCREMENT, never to the total, or the
    // angle jumps several turns at once. While a preview is read, the
    // revolution nearly stops: the camera arrives and holds its frame.
    const brake = inputs.preview >= 0 ? 0.12 : 1;
    this.turned +=
      dt *
      (1 - 0.92 * flyover) *
      brake *
      this.idle *
      this.traveling(inputs.reduced).spin;
  }

  // Held, the disk's own rotation stops at once, or it slips under the
  // finger; let go, it comes back gently.
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
