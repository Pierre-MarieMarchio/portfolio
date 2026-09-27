import { Frame } from '../../rules/camera/camera-frames.rules';
import { easeOut } from '@app/core/helpers';
import { isCloseUp, NO_STATE, SceneState } from '../../rules/scene-state.rules';
import { TurntableMotion } from './turntable.motion';
import { focusOn } from '../../rules/planets/planet-focus.rules';
import type { SceneFrame } from '../../rules/scene-frame.rules';
import { CameraMotion } from './camera.motion';
import { ClockMotion } from './clock.motion';
import { GrainsMotion } from './grains.motion';
import { ZoomMotion } from './zoom.motion';

const LANDED_ENTRY_WITHIN = 0.6;
const HURRIED_WITHIN = 0.9;

export class SceneMotion {
  public readonly camera = new CameraMotion();
  public readonly zoom = new ZoomMotion();
  public readonly grains: GrainsMotion;
  private readonly clock: ClockMotion;
  private opensLanded = false;

  constructor(public readonly turntable: TurntableMotion) {
    this.clock = new ClockMotion(this.camera, turntable);
    this.grains = new GrainsMotion(turntable);
  }

  public get phase(): number {
    return this.clock.phase;
  }

  public get hasMoved(): boolean {
    return (
      this.clock.hasMoved ||
      this.camera.hasMoved ||
      this.grains.hasMoved ||
      this.zoom.hasMoved
    );
  }

  public get isSettled(): boolean {
    return (
      this.clock.isSettled &&
      this.camera.isSettled &&
      this.grains.isSettled &&
      this.zoom.isSettled
    );
  }

  public get isDrawable(): boolean {
    return this.camera.isPosed || !this.opensLanded;
  }

  public follow(previous: SceneState, state: SceneState): void {
    if (previous === NO_STATE) {
      this.start(state);
    } else if (previous.reduced && !state.reduced) {
      this.clock.skipCrossing();
    } else if (state.landed && !previous.landed) {
      this.clock.hurryCrossing(HURRIED_WITHIN);
      this.grains.hasten(HURRIED_WITHIN);
    }
  }

  private start(state: SceneState): void {
    this.grains.start(state.reduced);
    this.camera.startOpen(isCloseUp(state));
    this.opensLanded = state.landed;
    if (state.landed) {
      this.clock.skipCrossing();
      this.grains.hasten(LANDED_ENTRY_WITHIN);
    }
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
    this.zoom.update(dt, state.reduced);
    this.clock.update(dt, state, isVisible);
  }

  public lay(frame: SceneFrame): void {
    const state = frame.state;
    const trv = this.clock.traveling(state.reduced);
    frame.trv = trv;
    this.camera.lay(frame, trv);
    frame.unzoomedHole = frame.hole;
    this.zoom.lay(frame);
    frame.entry = state.reduced ? 1 : easeOut(this.grains.entry);
    frame.time = this.clock.time;
    frame.phase = this.clock.phase;
    frame.diskAzim = frame.azim + this.turntable.rotor('disk').angle;
    focusOn(frame.focus, state, frame.orbits.length, this.clock.marksTime);
  }
}
