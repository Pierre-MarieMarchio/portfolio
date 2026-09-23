import { Frame } from '../../rules/scene/camera/camera-frames.rules';
import { easeOut } from '../../rules/scene/scene-math.rules';
import type { EngineInputs } from '../space-scene.engine';
import { TurntableMotion } from './turntable.motion';
import { focusOn } from '../../rules/scene/planets/planet-focus.rules';
import type { SceneFrame } from '../../rules/scene/scene-frame.rules';
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

  public start(inputs: EngineInputs): void {
    this.grains.start(inputs.reduced);
    this.camera.startOpen(inputs.preview >= 0);
  }

  public skipCrossing(): void {
    this.clock.skipCrossing();
  }

  public advance(
    dt: number,
    inputs: EngineInputs,
    target: Frame,
    isVisible: boolean,
  ): void {
    this.camera.easeOpening(dt, inputs.reduced, inputs.preview >= 0);
    this.grains.update(dt, inputs.reduced);
    this.camera.update(dt, target, inputs);
    this.clock.update(dt, inputs, isVisible);
  }

  // The matter only shows with the crossing's DECELERATION: the trails die
  // as the disk reveals itself, the two motions hand over.
  public lay(frame: SceneFrame): void {
    const inputs = frame.inputs;
    const trv = this.clock.traveling(inputs.reduced);
    frame.trv = trv;
    this.camera.lay(frame, trv);
    frame.entry = inputs.reduced ? 1 : easeOut(this.grains.entry);
    frame.time = this.clock.time;
    frame.phase = this.clock.phase;
    frame.diskAzim = frame.azim + this.turntable.rotor('disk').angle;
    focusOn(frame.focus, inputs, frame.orbits.length, this.clock.marksTime);
  }
}
