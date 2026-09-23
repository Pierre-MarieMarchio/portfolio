import { drawConstellations } from '../constellations';
import type { SkyPan } from '../sky';
import type { SceneFrame } from '../../../../rules/scene/scene-frame.rules';

export class ConstellationsRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  public draw(frame: SceneFrame, pan: SkyPan): void {
    drawConstellations(this.ctx, frame.w, frame.h, {
      dpr: frame.dpr,
      accent: frame.accent,
      entry: frame.entry,
      panX: pan.panX,
      panY: pan.panY,
      time: frame.time,
      shown: frame.about,
      lit: frame.lit,
      hole: frame.hole,
      labels: frame.inputs.partLabels,
    });
  }
}
