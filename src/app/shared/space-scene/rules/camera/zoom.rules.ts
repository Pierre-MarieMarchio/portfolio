import { clamp } from '@app/core/helpers';
import type { SceneState } from '../scene-state.rules';

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;
export const CLOSE_LOOK = 2.2;

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
  held: number,
  under: number,
  factor: number,
  extent: number,
): number => {
  if (factor <= ZOOM_MIN) {
    return under;
  }
  const shift = clamp(under - held * factor, extent * (1 - factor), 0);
  return clamp(shift / (1 - factor), 0, extent);
};

export const isSameFraming = (a: SceneState, b: SceneState): boolean =>
  a.framing === b.framing &&
  a.framed === b.framed &&
  a.step === b.step &&
  a.litFigure === b.litFigure;

export const canLookCloser = (state: SceneState): boolean =>
  state.framing === 'rest';
