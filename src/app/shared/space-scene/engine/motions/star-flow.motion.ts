import { clamp, TAU } from '@app/core/helpers';
import {
  CURSOR_REACH,
  PAN_PARALLAX,
  SKY_DRIFT,
  SKY_NEUTRAL,
} from '../../models/scene-constants.model';
import { travelingElevation } from '../../rules/camera/projection.rules';
import type { SkyCamera, SkyPan } from '../renderers/sky/star-sky.renderer';
import { forgetTrail, Star } from '../../rules/sky/star-field.rules';

const TRAIL_SIDEWAYS = 0.5;
const BANK = 0.35;
const LEAD = 0.3;
const COAST = 0.15;
export interface SkyFrame extends SkyPan {
  readonly cam: SkyCamera;
  readonly w: number;
  readonly h: number;
  readonly lens: { readonly x: number; readonly y: number } | null;
  readonly lensReach: number;
  readonly einsteinRadius: number;
  readonly deflectionMax: number;
  readonly scale: number;
  readonly originX: number;
  readonly originY: number;
  readonly bankCos: number;
  readonly bankSin: number;
  readonly run: number;
  readonly speed: number;
  readonly voyage: number;
  readonly elapsed: number;
  readonly smooth: number;
  readonly drift: number;
}

export interface StarPass {
  x: number;
  y: number;
  depth: number;
  near: number;
  tx: number;
  ty: number;
}

const FLIGHT_START = 3.5;
const FLIGHT_SPAN = 4.4;
const SETTLED_TIME = 99;

const flightProgress = (cam: SkyCamera): number => {
  const flightTime = cam.reduced ? SETTLED_TIME : cam.time;
  return clamp((flightTime - FLIGHT_START) / FLIGHT_SPAN, 0, 1);
};

const flightSpeed = (cam: SkyCamera, run: number): number =>
  6 * run * (1 - run) * (1 - run) + (cam.reduced ? 0 : COAST * cam.trv.coast);

const skyFrame = (
  w: number,
  h: number,
  cam: SkyCamera,
  elapsed: number,
): SkyFrame => {
  const { trv, dpr, hole } = cam;
  const turnEv = travelingElevation(cam.elev, trv.dEv);
  const turnX = -trv.dAz * 0.3 * w;
  const turnY = (turnEv - cam.elev) * 0.85 * h;
  const bank = trv.dRoll + BANK * trv.dAz;
  const run = flightProgress(cam);
  return {
    cam,
    w,
    h,
    lens: cam.reduced ? null : cam.pointer,
    lensReach: CURSOR_REACH * dpr,
    einsteinRadius: 19 * dpr,
    deflectionMax: 26 * dpr,
    scale: cam.scale * (1 + 0.55 * (1 - trv.grow)),
    panX: cam.camX - SKY_NEUTRAL.camX,
    panY: cam.camY - SKY_NEUTRAL.camY,
    originX: (hole ? hole.cx : w / 2) + turnX * LEAD,
    originY: (hole ? hole.cy : h / 2) + turnY * LEAD,
    bankCos: Math.cos(bank),
    bankSin: Math.sin(bank),
    run,
    speed: flightSpeed(cam, run),
    voyage: clamp(run / 0.04, 0, 1) * clamp((1 - run) / 0.04, 0, 1),
    elapsed,
    smooth: elapsed > 0 ? 1 - Math.pow(0.55, elapsed * 60) : 0,
    drift: cam.reduced ? 0 : cam.time * SKY_DRIFT,
  };
};

const spreadRate = (frame: SkyFrame, depth: number): number =>
  frame.speed * (0.55 + 1.25 * depth) * 1.7;

const depthOf = (star: Star, dpr: number): number =>
  0.32 + 0.68 * Math.min(1, star.radius / (2.4 * dpr));

const slideX = (frame: SkyFrame, depth: number): number =>
  (-frame.cam.azim * 0.3 - frame.panX * PAN_PARALLAX) * frame.w * depth;

const slideY = (frame: SkyFrame, depth: number): number =>
  ((frame.cam.elev - SKY_NEUTRAL.elev) * 0.85 - frame.panY * PAN_PARALLAX) *
  frame.h *
  depth;

export class StarFlowMotion {
  public readonly pass: StarPass = {
    x: 0,
    y: 0,
    depth: 0,
    near: 0,
    tx: 0,
    ty: 0,
  };
  private isFlattened = false;
  private previousTime = 0;

  constructor(private readonly rnd: () => number) {}

  public update(
    stars: readonly Star[],
    w: number,
    h: number,
    cam: SkyCamera,
  ): SkyFrame {
    const elapsed = clamp(cam.time - this.previousTime, 0, 0.08);
    this.previousTime = cam.time;
    const frame = skyFrame(w, h, cam, elapsed);
    if (!this.isFlattened && frame.run >= 1 && frame.speed <= 0) {
      this.isFlattened = true;
      this.flatten(stars, frame);
    }
    return frame;
  }

  public place(star: Star, frame: SkyFrame): boolean {
    const pass = this.pass;
    pass.depth = depthOf(star, frame.cam.dpr);
    if (frame.speed > 0.0001) {
      star.ray *= 1 + frame.elapsed * spreadRate(frame, pass.depth);
    }
    return this.locate(star, frame);
  }

  public follow(star: Star, frame: SkyFrame): void {
    this.track(star, frame);
    this.aimTrail(star, frame);
  }

  private flatten(stars: readonly Star[], frame: SkyFrame): void {
    const { originX, originY, drift } = frame;
    for (const star of stars) {
      if (star.ray > 1.0005) {
        const depth = depthOf(star, frame.cam.dpr);
        const ox = star.vx * drift + slideX(frame, depth);
        const oy = star.vy * drift + slideY(frame, depth);
        star.x = originX + (star.x + ox - originX) * star.ray - ox;
        star.y = originY + (star.y + oy - originY) * star.ray - oy;
      }
      forgetTrail(star);
    }
  }

  private locate(star: Star, frame: SkyFrame): boolean {
    const { w, h, originX, originY, bankCos, bankSin, drift } = frame;
    const depth = this.pass.depth;
    const depthScale = 1 + (frame.scale - 1) * 0.72 * depth;
    const sx0 =
      (star.x + star.vx * drift + slideX(frame, depth) - originX) * depthScale;
    const sy0 =
      (star.y + star.vy * drift + slideY(frame, depth) - originY) * depthScale;
    const bx = originX + sx0 * bankCos - sy0 * bankSin;
    const by = originY + sx0 * bankSin + sy0 * bankCos;
    if (star.ray > 1.0005) {
      return this.spreadOut(star, frame, bx, by);
    }
    this.pass.x = ((bx % w) + w) % w;
    this.pass.y = ((by % h) + h) % h;
    return true;
  }

  private spreadOut(
    star: Star,
    frame: SkyFrame,
    bx: number,
    by: number,
  ): boolean {
    const { w, h, originX, originY } = frame;
    const x = originX + (bx - originX) * star.ray;
    const y = originY + (by - originY) * star.ray;
    const margin = 30 * frame.cam.dpr;
    if (x < -margin || x > w + margin || y < -margin || y > h + margin) {
      const angle = this.rnd() * TAU;
      const spread = 0.02 + this.rnd() * 0.26;
      star.x = originX + Math.cos(angle) * w * spread;
      star.y = originY + Math.sin(angle) * h * spread;
      forgetTrail(star);
      return false;
    }
    this.pass.x = x;
    this.pass.y = y;
    return true;
  }

  private track(star: Star, frame: SkyFrame): void {
    const { x, y } = this.pass;
    if (frame.elapsed > 0) {
      this.smoothVelocity(star, frame, x, y);
    }
    star.px = x;
    star.py = y;
  }

  private smoothVelocity(
    star: Star,
    frame: SkyFrame,
    x: number,
    y: number,
  ): void {
    const { elapsed, w, h } = frame;
    let moveX = Number.isNaN(star.px) ? 0 : x - star.px;
    let moveY = Number.isNaN(star.py) ? 0 : y - star.py;
    if (Math.abs(moveX) > w / 2 || Math.abs(moveY) > h / 2) {
      moveX = 0;
      moveY = 0;
    }
    star.sdx += (moveX / elapsed - star.sdx) * frame.smooth;
    star.sdy += (moveY / elapsed - star.sdy) * frame.smooth;
  }

  private aimTrail(star: Star, frame: SkyFrame): void {
    const pass = this.pass;
    const ox = pass.x - frame.originX;
    const oy = pass.y - frame.originY;
    const distance = Math.hypot(ox, oy);
    let tx = star.sdx;
    let ty = star.sdy;
    if (distance > 1 && star.ray > 1.0005) {
      const ux = ox / distance;
      const uy = oy / distance;
      const flight = distance * spreadRate(frame, pass.depth);
      const across = tx * -uy + ty * ux;
      tx = ux * flight - uy * across * TRAIL_SIDEWAYS;
      ty = uy * flight + ux * across * TRAIL_SIDEWAYS;
    }
    pass.tx = tx;
    pass.ty = ty;
  }
}
