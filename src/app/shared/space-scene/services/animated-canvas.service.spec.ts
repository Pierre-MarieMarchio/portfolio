import { TestBed } from '@angular/core/testing';
import { AnimatedCanvasService } from './animated-canvas.service';
import { injectOn } from '@testing/fixtures/testbed.fixture';

class DrawingOffThread {
  public transferToImageBitmap(): void {}
}

class Painting {}

class SceneWorker {}

const refusing = (): never => {
  throw new Error('refused');
};

class RefusedWorker {
  public constructor() {
    refusing();
  }
}

describe('AnimatedCanvasService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([
    {
      where: 'in a browser with a worker and an offscreen canvas',
      platform: 'browser',
      worker: SceneWorker,
      offscreen: DrawingOffThread,
      canDraw: true,
    },
    {
      where: 'on the server',
      platform: 'server',
      worker: SceneWorker,
      offscreen: DrawingOffThread,
      canDraw: false,
    },
    {
      where: 'without a worker',
      platform: 'browser',
      worker: undefined,
      offscreen: DrawingOffThread,
      canDraw: false,
    },
    {
      where: 'without an offscreen canvas',
      platform: 'browser',
      worker: SceneWorker,
      offscreen: undefined,
      canDraw: false,
    },
    {
      where: 'with an offscreen canvas that cannot hand its bitmap over',
      platform: 'browser',
      worker: SceneWorker,
      offscreen: Painting,
      canDraw: false,
    },
  ] as const)(
    'draws off the main thread only where it can: $where',
    ({ platform, worker, offscreen, canDraw }) => {
      vi.stubGlobal('Worker', worker);
      vi.stubGlobal('OffscreenCanvas', offscreen);

      expect(injectOn(AnimatedCanvasService, platform).canDrawOffThread()).toBe(
        canDraw,
      );
    },
  );

  it('gives the bitmap context of a canvas, and none when the canvas refuses it', () => {
    const canvas = injectOn(AnimatedCanvasService, 'browser');
    const element = document.createElement('canvas');
    const bitmap = {} as ImageBitmapRenderingContext;
    const getContext = vi.spyOn(element, 'getContext').mockReturnValue(bitmap);

    expect(canvas.bitmapContext(element)).toBe(bitmap);
    expect(getContext).toHaveBeenCalledWith('bitmaprenderer');

    getContext.mockImplementation(refusing);
    expect(canvas.bitmapContext(element)).toBeNull();
  });

  it('starts the scene worker, and none when the browser refuses it', () => {
    const canvas = injectOn(AnimatedCanvasService, 'browser');

    vi.stubGlobal('Worker', SceneWorker);
    expect(canvas.sceneWorker()).toBeInstanceOf(SceneWorker);

    vi.stubGlobal('Worker', RefusedWorker);
    expect(canvas.sceneWorker()).toBeNull();
  });

  it('tells the time origin of the page, for the worker to share its clock', () => {
    expect(injectOn(AnimatedCanvasService, 'browser').timeOrigin()).toBe(
      performance.timeOrigin,
    );
  });
});
