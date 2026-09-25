import {
  Dims,
  Frame,
  REST_FRAME,
  isFiniteFrame,
  referenceRadius,
} from '../../rules/camera/camera-frames.rules';
import type { RestMeasure } from '../../rules/camera/rest-frame.rules';
import { CONSTELLATIONS } from '../../rules/sky/constellations.rules';
import {
  clamp,
  finiteOr,
  halfLifeStep,
  onCurrentTurn,
} from '@app/core/helpers';
import type { SceneState } from '../../rules/scene-state.rules';
import {
  flattening,
  travelingElevation,
} from '../../rules/camera/projection.rules';
import { fitOrbits, Orbit } from '../../rules/scene-bodies.rules';
import { Traveling } from '../../rules/camera/traveling.rules';
import type { SceneFrame } from '../../rules/scene-frame.rules';

const ARRIVED_WITHIN = 0.05;

interface CameraPose {
  readonly roll: number;
  readonly scale: number;
  readonly camX: number;
  readonly camY: number;
  readonly elev: number;
  readonly azim: number;
  readonly marks: number;
  readonly figures: number;
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
    figures: NaN,
  };
  private readonly lights: number[] = [];
  private readonly restFrame: { -readonly [K in keyof Frame]: Frame[K] } = {
    ...REST_FRAME,
  };
  private measure: RestMeasure | null = null;
  private opened = 0;
  private openTarget = 0;
  private hasOpenedMoved = false;
  private isMoving = false;
  private isArrived = true;
  private left = 0;

  public get pose(): CameraPose {
    return this.now;
  }

  public get rest(): Frame {
    return this.restFrame;
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

  public measureRest(measure: RestMeasure): void {
    if (!this.measure) {
      Object.assign(this.restFrame, {
        x: measure.x,
        y: measure.y,
        s: measure.s,
        i: measure.i,
        ev: measure.ev,
      });
    }
    this.measure = measure;
  }

  public fit(orbits: readonly Orbit[], dims: Dims): void {
    fitOrbits(orbits, dims, this.restFrame, this.measure);
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

  public update(dt: number, target: Frame, state: SceneState): void {
    const isReduced = state.reduced;
    const aim = this.aimed(target);
    const marks = state.marksShown ? 1 : 0;
    const lit = clamp(state.litFigure, 0, CONSTELLATIONS.length - 1);
    const figures = state.figuresShown ? 1 : 0;
    if (this.lights.length === 0) {
      for (let k = 0; k < CONSTELLATIONS.length; k++) {
        this.lights.push(k === lit ? 1 : 0);
      }
    }
    this.startOn(aim, marks, figures);
    this.left = this.distanceTo(aim);
    const before = this.sum();
    const kc = isReduced ? 1 : halfLifeStep(dt, 0.55);
    const hasRestMoved = this.easeRest(dt, isReduced);
    this.ease(aim, kc);
    this.isArrived = this.distanceTo(aim) < ARRIVED_WITHIN;
    this.now.marks += (marks - this.now.marks) * kc;
    this.now.figures += (figures - this.now.figures) * kc;
    this.light(lit, kc);
    this.isMoving = hasRestMoved || Math.abs(before - this.sum()) > 0.0002;
  }

  public lay(frame: SceneFrame, trv: Traveling): void {
    const { w, h } = frame;
    const now = this.now;
    frame.cx = w * (finiteOr(now.camX, 0.44) + trv.dx);
    frame.cy = h * (finiteOr(now.camY, 0.5) + trv.dy);
    frame.elev = travelingElevation(finiteOr(now.elev, 0.18), trv.dEv);
    frame.flatten = flattening(frame.elev);
    frame.radius =
      referenceRadius(w, h, finiteOr(now.scale, 1)) *
      (1 - 0.06 * this.opened) *
      trv.grow;
    frame.azim = finiteOr(now.azim, 0) + trv.dAz;
    const roll = finiteOr(now.roll, -0.33) + trv.dRoll;
    frame.cr = Math.cos(roll);
    frame.sr = Math.sin(roll);
    frame.hole = { cx: frame.cx, cy: frame.cy, radius: frame.radius };
    frame.arrived = this.isArrived;
    frame.closeUp = this.opened;
    frame.marks = finiteOr(now.marks, 1);
    frame.figures = finiteOr(now.figures, 0);
    frame.lit = this.lights;
  }

  private aimed(target: Frame): Frame {
    const aim = isFiniteFrame(target) ? target : this.restFrame;
    return Number.isFinite(this.now.azim)
      ? { ...aim, az: onCurrentTurn(aim.az, this.now.azim) }
      : aim;
  }

  private startOn(aim: Frame, marks: number, figures: number): void {
    const now = this.now;
    now.roll = finiteOr(now.roll, aim.i);
    now.scale = finiteOr(now.scale, aim.s);
    now.camX = finiteOr(now.camX, aim.x);
    now.camY = finiteOr(now.camY, aim.y);
    now.elev = finiteOr(now.elev, aim.ev);
    now.azim = finiteOr(now.azim, aim.az);
    now.marks = finiteOr(now.marks, marks);
    now.figures = finiteOr(now.figures, figures);
  }

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

  private easeRest(dt: number, isReduced: boolean): boolean {
    const measure = this.measure;
    if (!measure) {
      return false;
    }
    const km = isReduced ? 1 : halfLifeStep(dt, 0.75);
    const rest = this.restFrame;
    const before = rest.x + rest.y + rest.s + rest.i + rest.ev;
    rest.x += (measure.x - rest.x) * km;
    rest.y += (measure.y - rest.y) * km;
    rest.s += (measure.s - rest.s) * km;
    rest.i += (measure.i - rest.i) * km;
    rest.ev += (measure.ev - rest.ev) * km;
    return (
      Math.abs(before - (rest.x + rest.y + rest.s + rest.i + rest.ev)) > 0.0002
    );
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

  private light(lit: number, kc: number): void {
    const lights = this.lights;
    for (let k = 0; k < lights.length; k++) {
      lights[k] =
        (lights[k] ?? 0) + ((k === lit ? 1 : 0) - (lights[k] ?? 0)) * kc;
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
      now.figures
    );
  }
}
