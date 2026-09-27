import type { DisplayFormat } from '@app/core/models';

const PIXEL_BUDGET = 4_200_000;
const MAX_PIXEL_RATIO = 2;
const PHONE_MAX_PIXEL_RATIO = 1.5;

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
