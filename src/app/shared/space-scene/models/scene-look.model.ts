import type { SkyPan } from '../engine/motions/zoom.motion';
import type { SpaceSceneEngine } from '../engine/space-scene.engine';
import type { AnimatedCanvasService } from '../services/animated-canvas.service';
import type { ClickAbsorberService } from '../services/click-absorber.service';

export type LookableScene = Pick<
  SpaceSceneEngine,
  'holdZoom' | 'stretchZoom' | 'releaseZoom' | 'lookCloser' | 'request'
>;

export type WindowEvents = Pick<AnimatedCanvasService, 'onWindow'>;

export type ClickAbsorber = Pick<ClickAbsorberService, 'absorbNext' | 'stop'>;

export interface SceneLook {
  readonly pan: SkyPan | null;
  stop(): void;
}

export type StartLook = (
  scene: LookableScene,
  events: WindowEvents,
  absorber: ClickAbsorber,
) => SceneLook;
