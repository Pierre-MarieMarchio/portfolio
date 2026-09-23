import { canvasResolution } from './canvas-resolution.rules';

describe('canvasResolution', () => {
  it('follows the device ratio below the cap', () => {
    expect(canvasResolution({ width: 800, height: 600 }, 1.5)).toEqual({
      width: 1200,
      height: 900,
      pixelRatio: 1.5,
    });
  });

  it('caps the ratio at 2 on a denser screen', () => {
    expect(canvasResolution({ width: 800, height: 600 }, 3)).toEqual({
      width: 1600,
      height: 1200,
      pixelRatio: 2,
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

  it('keeps a 1080p screen at 150% and a 13-inch retina screen at full sharpness', () => {
    expect(canvasResolution({ width: 1280, height: 720 }, 1.5).pixelRatio).toBe(
      1.5,
    );
    expect(canvasResolution({ width: 1280, height: 800 }, 2).pixelRatio).toBe(
      2,
    );
  });

  it('never answers a canvas smaller than one pixel', () => {
    expect(canvasResolution({ width: 0, height: 0 }, 2)).toEqual({
      width: 1,
      height: 1,
      pixelRatio: 2,
    });
  });
});
