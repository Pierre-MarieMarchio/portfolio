import { finiteOr } from '@app/core/helpers';
import { CameraMotion } from '../../motions/camera.motion';
import { StarSkyRenderer } from './star-sky.renderer';
import type { SceneFrame } from '../../../rules/scene-frame.rules';
import { ConstellationsRenderer } from './constellations.renderer';

export class SkyRenderer {
  private readonly sky: StarSkyRenderer;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    rnd: () => number,
    private readonly camera: CameraMotion,
    private readonly constellations: ConstellationsRenderer | null,
  ) {
    this.sky = new StarSkyRenderer(rnd);
  }

  public draw(frame: SceneFrame): void {
    const pose = this.camera.pose;
    const camX = finiteOr(pose.camX, 0.42);
    const camY = finiteOr(pose.camY, 0.46);
    const pan = this.sky.draw(this.ctx, frame.w, frame.h, {
      time: frame.time,
      reduced: frame.state.reduced,
      pointer: frame.pointer,
      dpr: frame.dpr,
      trv: frame.trv,
      azim: finiteOr(pose.azim, 0),
      elev: finiteOr(pose.elev, 0.18),
      scale: finiteOr(pose.scale, 1),
      camX,
      camY,
      hole: frame.hole,
      ink: frame.ink,
      accent: frame.accent,
      entry: frame.entry,
    });
    this.constellations?.draw(frame, pan);
    this.ctx.globalAlpha = 1;
  }
}
