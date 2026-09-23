import {
  Dims,
  Frame,
  HOME_FRAME,
  HomeMeasure,
  isFiniteFrame,
  referenceRadius,
} from '../camera';
import { CONSTELLATIONS } from '../constellations';
import { clamp, finiteOr, halfLifeStep, onCurrentTurn } from '../math';
import type { EngineInputs } from '../object-engine';
import { flattening, travelingElevation } from '../projection';
import { fitOrbits, Orbit } from '../scene';
import { Traveling } from '../traveling';
import { areMarksShown } from '../../../../rules/scene/planet-focus.rules';
import type { SceneFrame } from '../../../../rules/scene/scene-frame.rules';

export interface CameraPose {
  readonly roll: number;
  readonly scale: number;
  readonly camX: number;
  readonly camY: number;
  readonly elev: number;
  readonly azim: number;
  readonly marks: number;
  readonly about: number;
}

export class CameraMotion {
  private readonly now: { -readonly [K in keyof CameraPose]: number } = {
    roll: NaN,
    scale: NaN,
    camX: NaN,
    camY: NaN,
    elev: NaN,
    azim: NaN,
    marks: NaN,
    about: NaN,
  };
  private readonly lights: number[] = [];
  /** The home framing, eased towards its measure. */
  private readonly homeFrame: { -readonly [K in keyof Frame]: Frame[K] } = {
    ...HOME_FRAME,
  };
  private measure: HomeMeasure | null = null;
  private opened = 0;
  private openTarget = 0;
  private hasOpenedMoved = false;
  private isMoving = false;
  private left = 0;

  public get pose(): CameraPose {
    return this.now;
  }

  public get home(): Frame {
    return this.homeFrame;
  }

  public get freeHalf(): number | null {
    return this.measure?.freeHalf ?? null;
  }

  public get remaining(): number {
    return this.left;
  }

  public get hasMoved(): boolean {
    return this.isMoving || this.hasOpenedMoved;
  }

  public get isSettled(): boolean {
    return !this.isMoving && this.opened === this.openTarget;
  }

  public measureHome(measure: HomeMeasure): void {
    if (!this.measure) {
      Object.assign(this.homeFrame, {
        y: measure.y,
        s: measure.s,
        i: measure.i,
        ev: measure.ev,
      });
    }
    this.measure = measure;
  }

  public fit(orbits: readonly Orbit[], dims: Dims): void {
    fitOrbits(orbits, dims, this.homeFrame, this.freeHalf);
  }

  public startOpen(isOpen: boolean): void {
    this.opened = isOpen ? 1 : 0;
  }

  public easeOpening(dt: number, isReduced: boolean, isOpen: boolean): void {
    const target = isOpen ? 1 : 0;
    const before = this.opened;
    this.openTarget = target;
    this.opened +=
      (target - this.opened) * (isReduced ? 1 : Math.min(1, dt * 3.2));
    if (Math.abs(target - this.opened) < 0.002) {
      this.opened = target;
    }
    this.hasOpenedMoved = before !== this.opened;
  }

  public update(dt: number, target: Frame, inputs: EngineInputs): void {
    const isReduced = inputs.reduced;
    const aim = this.aimed(target);
    const marks = areMarksShown(inputs) ? 1 : 0;
    const part = clamp(inputs.part, 0, CONSTELLATIONS.length - 1);
    const about = inputs.view === 'about' ? 1 : 0;
    if (this.lights.length === 0) {
      for (let k = 0; k < CONSTELLATIONS.length; k++) {
        this.lights.push(k === part ? 1 : 0);
      }
    }
    this.startOn(aim, marks, about);
    this.left = this.distanceTo(aim);
    const before = this.sum();
    // Half-life of 0.55 s: the motion takes its time and stops without a jolt.
    const kc = isReduced ? 1 : halfLifeStep(dt, 0.55);
    this.easeHome(dt, isReduced);
    this.ease(aim, kc);
    this.now.marks += (marks - this.now.marks) * kc;
    this.now.about += (about - this.now.about) * kc;
    this.light(part, kc);
    this.isMoving = Math.abs(before - this.sum()) > 0.0002;
  }

  public lay(frame: SceneFrame, trv: Traveling): void {
    const { w, h } = frame;
    const now = this.now;
    frame.cx = w * (finiteOr(now.camX, 0.44) + trv.dx);
    frame.cy = h * (finiteOr(now.camY, 0.5) + trv.dy);
    frame.elev = travelingElevation(finiteOr(now.elev, 0.18), trv.dEv);
    frame.flatten = flattening(frame.elev);
    // The object grows with the approach, from afar to its place.
    frame.radius =
      referenceRadius(w, h, finiteOr(now.scale, 1)) *
      (1 - 0.06 * this.opened) *
      trv.grow;
    frame.azim = finiteOr(now.azim, 0) + trv.dAz;
    // The roll straightens on arrival: under the plane, then back up.
    const roll = finiteOr(now.roll, -0.33) + trv.dRoll;
    frame.cr = Math.cos(roll);
    frame.sr = Math.sin(roll);
    frame.hole = { cx: frame.cx, cy: frame.cy, radius: frame.radius };
    frame.preview = this.opened;
    frame.marks = finiteOr(now.marks, 1);
    frame.about = finiteOr(now.about, 0);
    frame.lit = this.lights;
  }

  private aimed(target: Frame): Frame {
    const aim = isFiniteFrame(target) ? target : this.homeFrame;
    return Number.isFinite(this.now.azim)
      ? { ...aim, az: onCurrentTurn(aim.az, this.now.azim) }
      : aim;
  }

  // One NaN in the camera wipes the whole drawing and nothing repairs it:
  // every term is kept finite, whatever target came in.
  private startOn(aim: Frame, marks: number, about: number): void {
    const now = this.now;
    now.roll = finiteOr(now.roll, aim.i);
    now.scale = finiteOr(now.scale, aim.s);
    now.camX = finiteOr(now.camX, aim.x);
    now.camY = finiteOr(now.camY, aim.y);
    now.elev = finiteOr(now.elev, aim.ev);
    now.azim = finiteOr(now.azim, aim.az);
    now.marks = finiteOr(now.marks, marks);
    now.about = finiteOr(now.about, about);
  }

  // What is left of the camera move: while it lasts, the object's own
  // rotation nearly fades. The object is flown over, it does not pivot.
  private distanceTo(aim: Frame): number {
    const now = this.now;
    return (
      Math.abs(aim.i - now.roll) +
      Math.abs(aim.s - now.scale) +
      2 * Math.abs(aim.x - now.camX) +
      2 * Math.abs(aim.y - now.camY) +
      2 * Math.abs(aim.ev - now.elev) +
      Math.abs(aim.az - now.azim)
    );
  }

  // The measured home framing joins the current one at the camera's pace:
  // no jump when the head or the rule take their place.
  private easeHome(dt: number, isReduced: boolean): void {
    const measure = this.measure;
    if (!measure) {
      return;
    }
    const km = isReduced ? 1 : halfLifeStep(dt, 0.75);
    const home = this.homeFrame;
    home.y += (measure.y - home.y) * km;
    home.s += (measure.s - home.s) * km;
    home.i += (measure.i - home.i) * km;
    home.ev += (measure.ev - home.ev) * km;
  }

  private ease(aim: Frame, kc: number): void {
    const now = this.now;
    now.roll += (aim.i - now.roll) * kc;
    now.scale += (aim.s - now.scale) * kc;
    now.camX += (aim.x - now.camX) * kc;
    now.camY += (aim.y - now.camY) * kc;
    now.elev += (aim.ev - now.elev) * kc;
    now.azim += (aim.az - now.azim) * kc;
  }

  private light(part: number, kc: number): void {
    const lights = this.lights;
    for (let k = 0; k < lights.length; k++) {
      lights[k] =
        (lights[k] ?? 0) + ((k === part ? 1 : 0) - (lights[k] ?? 0)) * kc;
    }
  }

  private sum(): number {
    const now = this.now;
    return (
      now.roll +
      now.scale +
      now.camX +
      now.camY +
      now.elev +
      now.marks +
      now.azim +
      now.about
    );
  }
}
