import { COMETS, drawComets } from '../comets';
import { clamp } from '../math';
import type { SceneFrame } from '../../../../rules/scene/scene-frame.rules';

export class CometsRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  public draw(frame: SceneFrame): void {
    const about = frame.about;
    if (about <= 0.02) {
      return;
    }
    drawComets(this.ctx, frame.w, frame.h, {
      phase: frame.phase,
      elev: frame.elev,
      azim: frame.diskAzim,
      flatten: frame.flatten,
      cr: frame.cr,
      sr: frame.sr,
      cx: frame.cx,
      cy: frame.cy,
      radius: frame.radius,
      dpr: frame.dpr,
      accent: frame.accent,
      entry: frame.entry,
      shown: about,
      part: clamp(frame.inputs.part, 0, COMETS.length - 1),
      labels: frame.inputs.partLabels,
      veil: frame.veil,
    });
  }
}
