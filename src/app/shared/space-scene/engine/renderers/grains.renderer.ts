import { clamp } from '@app/core/helpers';
import { CameraMotion } from '../motions/camera.motion';
import { GrainsMotion } from '../motions/grains.motion';
import { Grain, GrainPose, placeGrain } from '../../rules/scene-bodies.rules';
import { litAmount, litShare } from '../../rules/matter/grain-reserve.rules';
import {
  flattenedHeight,
  GrainSpot,
  grainSize,
  isCoreGrain,
  isTinted,
  litMatter,
  tintStep,
} from '../../rules/matter/matter-light.rules';
import { veilAt } from '../../rules/panel-veil.rules';
import type { SceneFrame } from '../../rules/scene-frame.rules';

const HOT = '#ffe6c2';
const CORE_RAMP = ['#e7f2fb', '#e2eefa', HOT, '#fbd9ad', '#f0bb87'];
const MATTER_RAMP = ['#d2e6f7', '#d8e3f0', '#dfe4ee', '#ebdfd0', '#e2cbad'];

export class GrainsRenderer {
  private readonly spot: GrainSpot = {
    x: 0,
    y: 0,
    z: 0,
    rx: 0,
    ry: 0,
    sx: 0,
    sy: 0,
    doppler: 0,
  };
  private pose: GrainPose = { phase: 0, entry: 0, elev: 0, azim: 0 };
  private edgeMargin = 1;
  private alphaNow = -1;
  private colorNow = '';

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly grains: readonly Grain[],
    private readonly motion: GrainsMotion,
    private readonly camera: CameraMotion,
  ) {}

  public draw(frame: SceneFrame): void {
    this.motion.begin(frame);
    this.alphaNow = -1;
    this.colorNow = '';
    const share = litShare(
      this.camera.rest.s,
      this.camera.pose.scale,
      frame.trv.grow,
    );
    this.pose = {
      phase: frame.phase,
      entry: frame.entry,
      elev: frame.elev,
      azim: frame.diskAzim,
    };
    this.edgeMargin = 0.06 * Math.min(frame.w, frame.h);
    for (let i = 0; i < this.grains.length; i++) {
      const lit = litAmount(i, share);
      const grain = this.grains[i];
      if (lit > 0 && grain) {
        this.drawGrain(grain, lit, frame);
      }
    }
  }

  private drawGrain(grain: Grain, lit: number, frame: SceneFrame): void {
    const spot = this.spot;
    placeGrain(grain, this.pose, spot);
    const py0 = flattenedHeight(grain, spot.y, frame.flatten);
    spot.rx = spot.x * frame.cr - py0 * frame.sr;
    spot.ry = spot.x * frame.sr + py0 * frame.cr;
    const sx = frame.cx + spot.rx * frame.radius;
    const sy = frame.cy + spot.ry * frame.radius;
    this.motion.push(grain, sx, sy);
    spot.sx = sx + grain.dx;
    spot.sy = sy + grain.dy;
    const twinkle = 0.93 + 0.07 * Math.sin(frame.time * 0.8 + grain.ph);
    spot.doppler = clamp(spot.rx * 0.8, -1, 1);
    const dop = 1 - 0.33 * spot.doppler;
    const alpha = litMatter(
      grain.alpha0 *
        grain.grain *
        dop *
        twinkle *
        frame.entry *
        frame.trv.matter *
        frame.trv.light *
        lit *
        1.75,
      grain,
      spot,
      frame.closeUp,
    );
    const shown = this.framed(alpha, frame);
    if (shown >= 0.012) {
      this.plot(grain, isCoreGrain(grain), shown, frame);
    }
  }

  private framed(alpha: number, frame: SceneFrame): number {
    const { sx, sy } = this.spot;
    let shown = alpha;
    if (frame.zones.length > 0) {
      shown *= veilAt(frame.zones, frame.fade, sx, sy);
    }
    const edge = Math.min(sx, frame.w - sx, sy) / this.edgeMargin;
    if (edge < 1) {
      shown *= Math.max(0, edge);
    }
    return shown;
  }

  private plot(
    grain: Grain,
    isCore: boolean,
    alpha: number,
    frame: SceneFrame,
  ): void {
    const ctx = this.ctx;
    const size = grainSize(grain, isCore) * frame.dpr;
    if (alpha !== this.alphaNow) {
      this.alphaNow = alpha;
      ctx.globalAlpha = Math.min(isCore ? 0.96 : 0.8, alpha);
    }
    const color = this.colorOf(grain, isCore, frame);
    if (color !== this.colorNow) {
      this.colorNow = color;
      ctx.fillStyle = color;
    }
    const { sx, sy } = this.spot;
    ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
  }

  private colorOf(grain: Grain, isCore: boolean, frame: SceneFrame): string {
    if (isTinted(grain)) {
      const step = tintStep(this.spot.doppler);
      const ramped = isCore ? CORE_RAMP[step] : MATTER_RAMP[step];
      if (ramped !== undefined) {
        return ramped;
      }
    }
    if (isCore) {
      return HOT;
    }
    return grain.accent ? frame.accent : frame.ink;
  }
}
