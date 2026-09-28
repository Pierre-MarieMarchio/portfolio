import type { DisplayFormat } from '@app/core/models';
import { canvasResolution } from './canvas-resolution.rules';

describe('canvasResolution', () => {
  it.each<{
    readonly screen: string;
    readonly size: { readonly width: number; readonly height: number };
    readonly dpr: number;
    readonly format?: DisplayFormat;
    readonly pixelRatio: number;
  }>([
    {
      screen: 'follows the device ratio below the cap',
      size: { width: 800, height: 600 },
      dpr: 1.5,
      pixelRatio: 1.5,
    },
    {
      screen: 'caps the ratio at 2 on a denser screen',
      size: { width: 800, height: 600 },
      dpr: 3,
      pixelRatio: 2,
    },
    {
      screen: 'keeps a 1080p screen at 150%',
      size: { width: 1280, height: 720 },
      dpr: 1.5,
      pixelRatio: 1.5,
    },
    {
      screen: 'keeps a 13-inch retina screen at full sharpness',
      size: { width: 1280, height: 800 },
      dpr: 2,
      pixelRatio: 2,
    },
    {
      screen: 'caps the ratio at 1.5 on a phone',
      size: { width: 390, height: 844 },
      dpr: 3,
      format: 'phone',
      pixelRatio: 1.5,
    },
    {
      screen: 'follows a phone below its cap',
      size: { width: 390, height: 844 },
      dpr: 1.25,
      format: 'phone',
      pixelRatio: 1.25,
    },
    {
      screen: 'leaves the tablet at 2',
      size: { width: 820, height: 1180 },
      dpr: 3,
      format: 'tablet',
      pixelRatio: 2,
    },
    {
      screen: 'leaves the desktop at 2',
      size: { width: 800, height: 600 },
      dpr: 3,
      format: 'desktop',
      pixelRatio: 2,
    },
  ])('$screen', ({ size, dpr, format, pixelRatio }) => {
    expect(canvasResolution(size, dpr, format)).toEqual({
      width: Math.round(size.width * pixelRatio),
      height: Math.round(size.height * pixelRatio),
      pixelRatio,
    });
  });

  it('gives way to the pixel budget on a large screen', () => {
    const { width, height, pixelRatio } = canvasResolution(
      { width: 3840, height: 2160 },
      2,
    );

    expect(pixelRatio).toBeCloseTo(Math.sqrt(4_200_000 / (3840 * 2160)));
    expect(width).toBe(Math.round(3840 * pixelRatio));
    expect(height).toBe(Math.round(2160 * pixelRatio));
    expect(width * height).toBeLessThanOrEqual(4_201_000);
  });

  it('never answers a canvas smaller than one pixel', () => {
    expect(canvasResolution({ width: 0, height: 0 }, 2)).toEqual({
      width: 1,
      height: 1,
      pixelRatio: 2,
    });
  });
});
