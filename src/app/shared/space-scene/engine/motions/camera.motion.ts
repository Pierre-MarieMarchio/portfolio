import {
  Dims,
  Frame,
  REST_FRAME,
  isFiniteFrame,
  referenceRadius,
  settledStep,
  unitRadiusOf,
} from '../../rules/camera/camera-frames.rules';
import type { RestMeasure } from '../../rules/camera/rest-frame.rules';
import { CONSTELLATIONS } from '../../rules/figures/constellations.rules';
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
import { turnLimitOf, turnPaceOf } from '../../rules/camera/turning.rules';

const ARRIVED_WITHIN = 0.05;
const STILL_WITHIN = 0.0002;
const REST_KEYS = ['x', 'y', 's', 'i', 'ev'] as const;
const POSE_KEYS = [
  'roll',
  'scale',
  'camX',
  'camY',
  'elev',
  'azim',
  'marks',
  'figures',
] as const;

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

type MutablePose = { -readonly [K in keyof CameraPose]: number };

const poseOf = (value: number): MutablePose => ({
  roll: value,
  scale: value,
  camX: value,
  camY: value,
  elev: value,
  azim: value,
  marks: value,
  figures: value,
});

const eased = (value: number, target: number, step: number): number =>
  value + (target - value) * step;

export class CameraMotion {
  private readonly now = poseOf(NaN);
  private readonly was = poseOf(0);
  private readonly lights: number[] = [];
  private readonly restFrame: { -readonly [K in keyof Frame]: Frame[K] } = {
    ...REST_FRAME,
  };
  private measure: RestMeasure | null = null;
  private dims: Dims | null = null;
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

  public get isPosed(): boolean {
    return Number.isFinite(this.now.scale);
  }

  public setDims(dims: Dims | null): void {
    this.dims = dims;
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

  public fit(
    orbits: readonly Orbit[],
    dims: Dims & { readonly isPhone: boolean },
  ): number {
    return fitOrbits(orbits, dims, this.restFrame, this.measure);
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
    const marksTarget = state.marksShown ? 1 : 0;
    const figuresTarget = state.figuresShown ? 1 : 0;
    const litIndex = clamp(state.litFigure, 0, CONSTELLATIONS.length - 1);
    this.seedLights(litIndex);
    this.startOn(aim, marksTarget, figuresTarget);
    this.left = this.distanceTo(aim);
    this.rememberPose();
    const easeStep = isReduced ? 1 : halfLifeStep(dt, 0.55);
    const hasRestMoved = this.easeRest(dt, isReduced);
    this.ease(
      aim,
      turnPaceOf(aim.az - this.now.azim, easeStep, turnLimitOf(state, dt)),
    );
    this.isArrived = this.distanceTo(aim) < ARRIVED_WITHIN;
    this.easeVisibility(marksTarget, figuresTarget, easeStep);
    const lightTravel = this.light(litIndex, easeStep);
    this.isMoving =
      hasRestMoved || this.poseTravel() + lightTravel > STILL_WITHIN;
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

  private seedLights(litIndex: number): void {
    if (this.lights.length > 0) {
      return;
    }
    for (let k = 0; k < CONSTELLATIONS.length; k++) {
      this.lights.push(k === litIndex ? 1 : 0);
    }
  }

  private easeVisibility(
    marksTarget: number,
    figuresTarget: number,
    easeStep: number,
  ): void {
    this.now.marks = eased(this.now.marks, marksTarget, easeStep);
    this.now.figures = eased(this.now.figures, figuresTarget, easeStep);
  }

  private aimed(target: Frame): Frame {
    const aim = isFiniteFrame(target) ? target : this.restFrame;
    return Number.isFinite(this.now.azim)
      ? { ...aim, az: onCurrentTurn(aim.az, this.now.azim) }
      : aim;
  }

  private startOn(
    aim: Frame,
    marksTarget: number,
    figuresTarget: number,
  ): void {
    const now = this.now;
    now.roll = finiteOr(now.roll, aim.i);
    now.scale = finiteOr(now.scale, aim.s);
    now.camX = finiteOr(now.camX, aim.x);
    now.camY = finiteOr(now.camY, aim.y);
    now.elev = finiteOr(now.elev, aim.ev);
    now.azim = finiteOr(now.azim, aim.az);
    now.marks = finiteOr(now.marks, marksTarget);
    now.figures = finiteOr(now.figures, figuresTarget);
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
    const easeStep = isReduced ? 1 : halfLifeStep(dt, 0.75);
    const rest = this.restFrame;
    let travelled = 0;
    for (const key of REST_KEYS) {
      const step = (measure[key] - rest[key]) * easeStep;
      rest[key] += step;
      travelled += Math.abs(step);
    }
    return travelled > STILL_WITHIN;
  }

  private ease(aim: Frame, easeStep: number): void {
    const now = this.now;
    const dims = this.dims;
    const unit = dims ? unitRadiusOf(dims.w, dims.h) / dims.dpr : null;
    const radius = unit === null ? null : unit * finiteOr(now.scale, aim.s);
    const widthPx = dims ? dims.w / dims.dpr : null;
    const heightPx = dims ? dims.h / dims.dpr : null;
    now.roll = this.settled(eased(now.roll, aim.i, easeStep), aim.i, radius);
    now.scale = this.settled(eased(now.scale, aim.s, easeStep), aim.s, unit);
    now.camX = this.settled(eased(now.camX, aim.x, easeStep), aim.x, widthPx);
    now.camY = this.settled(eased(now.camY, aim.y, easeStep), aim.y, heightPx);
    now.elev = this.settled(eased(now.elev, aim.ev, easeStep), aim.ev, radius);
    now.azim = this.settled(eased(now.azim, aim.az, easeStep), aim.az, radius);
  }

  private settled(
    eased: number,
    target: number,
    pxPerUnit: number | null,
  ): number {
    return pxPerUnit === null ? eased : settledStep(eased, target, pxPerUnit);
  }

  private light(litIndex: number, easeStep: number): number {
    const lights = this.lights;
    let travelled = 0;
    for (let k = 0; k < lights.length; k++) {
      const step = ((k === litIndex ? 1 : 0) - (lights[k] ?? 0)) * easeStep;
      lights[k] = (lights[k] ?? 0) + step;
      travelled += Math.abs(step);
    }
    return travelled;
  }

  private rememberPose(): void {
    for (const key of POSE_KEYS) {
      this.was[key] = this.now[key];
    }
  }

  private poseTravel(): number {
    let travelled = 0;
    for (const key of POSE_KEYS) {
      travelled += Math.abs(this.now[key] - this.was[key]);
    }
    return travelled;
  }
}
