import { SCENE_CONFIG } from '../../models/scene-config.model';
import { clamp } from '@app/core/helpers';

export const WHEEL_NOTCH_RATIO = SCENE_CONFIG.gestures.wheelNotchRatio;

const DELTA_PER_NOTCH = [100, 3, 1];

export const wheelRatio = (deltaY: number, deltaMode: number): number =>
  WHEEL_NOTCH_RATIO ** (-deltaY / (DELTA_PER_NOTCH[deltaMode] ?? 1));

export const panWithin = (pan: number, hole: number, extent: number): number =>
  clamp(pan, Math.min(0, -hole), Math.max(0, extent - hole));
