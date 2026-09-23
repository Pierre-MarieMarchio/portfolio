import { SceneMotion } from '../motions/scene.motion';
import type { EngineCanvases, EngineOptions } from '../object-engine';
import { Grain } from '../scene';
import type { SceneFrame } from '../../../../rules/scene/scene-frame.rules';
import { CometsRenderer } from './comets.renderer';
import { ConstellationsRenderer } from './constellations.renderer';
import { GrainsRenderer } from './grains.renderer';
import { OrbitsRenderer } from './orbits.renderer';
import { PlanetLabelsRenderer } from './planet-labels.renderer';
import { PlanetsRenderer } from './planets.renderer';
import { SkyRenderer } from './sky.renderer';

const skyOf = (
  canvases: EngineCanvases,
  options: EngineOptions,
  motion: SceneMotion,
): SkyRenderer | null => {
  const ctx = canvases.sky;
  if (!ctx) {
    return null;
  }
  const constellations =
    options.aboutBodies === 'constellations'
      ? new ConstellationsRenderer(ctx)
      : null;
  return new SkyRenderer(ctx, options.rnd, motion.camera, constellations);
};

export class SceneRenderer {
  public readonly labels: PlanetLabelsRenderer;
  private readonly grains: GrainsRenderer;
  private readonly orbits: OrbitsRenderer;
  private readonly planets: PlanetsRenderer;
  private readonly comets: CometsRenderer | null;
  private readonly sky: SkyRenderer | null;

  constructor(
    private readonly canvases: EngineCanvases,
    options: EngineOptions,
    grains: readonly Grain[],
    motion: SceneMotion,
  ) {
    const ctx = canvases.matter;
    this.labels = new PlanetLabelsRenderer(ctx);
    this.grains = new GrainsRenderer(ctx, grains, motion.grains, motion.camera);
    this.orbits = new OrbitsRenderer(ctx, motion.turntable);
    this.planets = new PlanetsRenderer(ctx, this.labels, motion.turntable);
    this.comets =
      options.aboutBodies === 'comets' ? new CometsRenderer(ctx) : null;
    this.sky = skyOf(canvases, options, motion);
  }

  public draw(frame: SceneFrame): void {
    const ctx = this.canvases.matter;
    ctx.clearRect(0, 0, frame.w, frame.h);
    this.grains.draw(frame);
    this.orbits.draw(frame);
    this.planets.draw(frame);
    this.comets?.draw(frame);
    ctx.globalAlpha = 1;
    this.sky?.draw(frame);
  }
}
