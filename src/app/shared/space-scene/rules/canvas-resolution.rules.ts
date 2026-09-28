import { SCENE_CONFIG } from '../models/scene-config.model';
import type { DisplayFormat } from '@app/core/models';

const {
  pixelBudget: PIXEL_BUDGET,
  maxPixelRatio: MAX_PIXEL_RATIO,
  phoneMaxPixelRatio: PHONE_MAX_PIXEL_RATIO,
} = SCENE_CONFIG.canvas;

interface CanvasResolution {
  readonly width: number;
  readonly height: number;
  readonly pixelRatio: number;
}

export function canvasResolution(
  size: { readonly width: number; readonly height: number },
  devicePixelRatio: number,
  format: DisplayFormat = 'desktop',
): CanvasResolution {
  const area = Math.max(1, size.width * size.height);
  const pixelRatio = Math.min(
    format === 'phone' ? PHONE_MAX_PIXEL_RATIO : MAX_PIXEL_RATIO,
    devicePixelRatio,
    Math.sqrt(PIXEL_BUDGET / area),
  );
  return {
    width: Math.max(1, Math.round(size.width * pixelRatio)),
    height: Math.max(1, Math.round(size.height * pixelRatio)),
    pixelRatio,
  };
}
