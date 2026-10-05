import { SCENE_CONFIG } from '../../models/scene-config.model';
import { clamp } from '@app/core/helpers';
import type { SceneState } from '../scene-state.rules';

export const ZOOM_MIN = SCENE_CONFIG.camera.zoom.min;
export const ZOOM_MAX = SCENE_CONFIG.camera.zoom.max;
export const CLOSE_LOOK = SCENE_CONFIG.camera.zoom.closeLook;

export const clampZoom = (factor: number): number =>
  clamp(factor, ZOOM_MIN, ZOOM_MAX);

export const zoomedAt = (
  value: number,
  anchor: number,
  factor: number,
): number => value * factor + anchor * (1 - factor);

export const unzoomedAt = (
  value: number,
  anchor: number,
  factor: number,
): number => (value - anchor * (1 - factor)) / factor;

export const anchorKeeping = (
  grabbed: number,
  under: number,
  factor: number,
  extent: number,
): number => {
  if (factor <= ZOOM_MIN) {
    return under;
  }
  const shift = clamp(under - grabbed * factor, extent * (1 - factor), 0);
  return clamp(shift / (1 - factor), 0, extent);
};

export const isSameFraming = (a: SceneState, b: SceneState): boolean =>
  a.framing === b.framing &&
  a.framed === b.framed &&
  a.step === b.step &&
  a.litFigure === b.litFigure;

export const canLookCloser = (state: SceneState): boolean =>
  state.framing === 'rest';
