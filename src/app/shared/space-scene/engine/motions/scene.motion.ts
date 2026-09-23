import { Frame } from '../../rules/camera/camera-frames.rules';
import { easeOut } from '@app/core/helpers';
import { isCloseUp, SceneState } from '../../rules/scene-state.rules';
import { TurntableMotion } from './turntable.motion';
import { focusOn } from '../../rules/planets/planet-focus.rules';
import type { SceneFrame } from '../../rules/scene-frame.rules';
import { CameraMotion } from './camera.motion';
import { ClockMotion } from './clock.motion';
import { GrainsMotion } from './grains.motion';

export class SceneMotion {
  public readonly camera = new CameraMotion();
  public readonly grains: GrainsMotion;
  private readonly clock: ClockMotion;

  constructor(public readonly turntable: TurntableMotion) {
    this.clock = new ClockMotion(this.camera, turntable);
    this.grains = new GrainsMotion(turntable);
  }

  public get phase(): number {
    return this.clock.phase;
  }

  public get hasMoved(): boolean {
    return this.clock.hasMoved || this.camera.hasMoved || this.grains.hasMoved;
  }

  public get isSettled(): boolean {
    return (
      this.clock.isSettled && this.camera.isSettled && this.grains.isSettled
    );
  }

  public start(state: SceneState): void {
    this.grains.start(state.reduced);
    this.camera.startOpen(isCloseUp(state));
  }

  public skipCrossing(): void {
    this.clock.skipCrossing();
  }

  public advance(
    dt: number,
    state: SceneState,
    target: Frame,
    isVisible: boolean,
  ): void {
    this.camera.easeOpening(dt, state.reduced, isCloseUp(state));
    this.grains.update(dt, state.reduced);
    this.camera.update(dt, target, state);
    this.clock.update(dt, state, isVisible);
  }

  public lay(frame: SceneFrame): void {
    const state = frame.state;
    const trv = this.clock.traveling(state.reduced);
    frame.trv = trv;
    this.camera.lay(frame, trv);
    frame.entry = state.reduced ? 1 : easeOut(this.grains.entry);
    frame.time = this.clock.time;
    frame.phase = this.clock.phase;
    frame.diskAzim = frame.azim + this.turntable.rotor('disk').angle;
    focusOn(frame.focus, state, frame.orbits.length, this.clock.marksTime);
  }
}
