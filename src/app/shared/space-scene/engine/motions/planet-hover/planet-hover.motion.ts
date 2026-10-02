import { smoothstep } from '@app/core/helpers';
import { SCENE_CONFIG } from '../../../models/scene-config.model';

const SLOW_SPAN = SCENE_CONFIG.planets.slowSpan;

const towards = (value: number, target: number, step: number): number =>
  value < target
    ? Math.min(target, value + step)
    : Math.max(target, value - step);

export class PlanetHoverMotion {
  private readonly ramp = new Map<number, number>();
  private readonly lag = new Map<number, number>();
  private lastPhase = 0;

  public phaseOf(i: number, phase: number): number {
    const lag = this.lag.get(i);
    return lag ? phase - lag : phase;
  }

  public step(dt: number, phase: number, hovered: number): void {
    const phaseDelta = phase - this.lastPhase;
    this.lastPhase = phase;
    if (hovered >= 0 && !this.ramp.has(hovered)) {
      this.ramp.set(hovered, 0);
    }
    const step = dt / SLOW_SPAN;
    for (const i of this.ramp.keys()) {
      const ramp = towards(this.ramp.get(i) ?? 0, i === hovered ? 1 : 0, step);
      this.ramp.set(i, ramp);
      this.holdBack(i, phaseDelta * smoothstep(ramp));
    }
  }

  private holdBack(i: number, held: number): void {
    const lag = this.lag.get(i) ?? 0;
    if (held > 0 || lag !== 0) {
      this.lag.set(i, lag + held);
    }
  }
}
