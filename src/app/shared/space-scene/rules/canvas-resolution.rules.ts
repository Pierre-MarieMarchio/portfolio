const PIXEL_BUDGET = 4_200_000;
const MAX_PIXEL_RATIO = 2;

interface CanvasResolution {
  readonly width: number;
  readonly height: number;
  readonly pixelRatio: number;
}

export function canvasResolution(
  size: { readonly width: number; readonly height: number },
  devicePixelRatio: number,
): CanvasResolution {
  const area = Math.max(1, size.width * size.height);
  const pixelRatio = Math.min(
    MAX_PIXEL_RATIO,
    devicePixelRatio,
    Math.sqrt(PIXEL_BUDGET / area),
  );
  return {
    width: Math.max(1, Math.round(size.width * pixelRatio)),
    height: Math.max(1, Math.round(size.height * pixelRatio)),
    pixelRatio,
  };
}
