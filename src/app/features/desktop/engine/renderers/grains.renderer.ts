import { clamp } from '@app/core/helpers';
import { litAmount } from '../../rules/scene/matter/grain-reserve.rules';
import { CameraMotion } from '../motions/camera.motion';
import { GrainsMotion } from '../motions/grains.motion';
import {
  Grain,
  GrainPose,
  placeGrain,
} from '../../rules/scene/scene-bodies.rules';
import { litShare } from '../../rules/scene/matter/grain-reserve.rules';
import {
  flattenedHeight,
  GrainSpot,
  grainSize,
  isCoreGrain,
  isTinted,
  litMatter,
  tintStep,
} from '../../rules/scene/matter/matter-light.rules';
import { veilAt } from '../../rules/scene/panel-veil.rules';
import type { SceneFrame } from '../../rules/scene/scene-frame.rules';

const HOT = '#ffe6c2';
// Doppler ramps, from approach (blue) to recession (amber): five steps,
// the inner edge's glow apart from the cold matter. The tint must be
// noticed without becoming the subject; the subject is the text beside.
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
      this.camera.home.s,
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
    // Doppler: the left side comes towards us, lighter AND bluer; the
    // right recedes, darker AND redder. Brightness gives the speed, the
    // tint gives the direction.
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
      frame.preview,
    );
    const shown = this.framed(alpha, frame);
    if (shown >= 0.012) {
      this.plot(grain, isCoreGrain(grain), shown, frame);
    }
  }

  // The bottom edge does not fade: a framing cut, on purpose.
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

  // fillRect, never arc: the difference between 60 and 25 fps.
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
