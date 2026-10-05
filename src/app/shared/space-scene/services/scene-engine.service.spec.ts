import { TestBed } from '@angular/core/testing';
import { recordingContext } from '@testing/doubles/recording-canvas.double';
import { AnimatedCanvasService } from './animated-canvas.service';
import { SceneEngineService } from './scene-engine.service';
import { RemoteSceneEngine } from '../engine/remote-scene.engine';
import { SpaceSceneEngine } from '../engine/space-scene.engine';
import { injectInScope } from '@testing/fixtures/testbed.fixture';

interface Browser {
  readonly offThread: boolean;
  readonly worker: boolean;
}

const noop = (): void => {};

const workerDouble = () => ({
  postMessage: vi.fn(),
  addEventListener: vi.fn(),
  terminate: vi.fn(),
});

const setup = ({ offThread, worker }: Browser) => {
  const started = workerDouble();
  const canvas: Partial<AnimatedCanvasService> = {
    canDrawOffThread: () => offThread,
    bitmapContext: () =>
      ({
        transferFromImageBitmap: vi.fn(),
      }) as unknown as ImageBitmapRenderingContext,
    sceneWorker: () => (worker ? (started as unknown as Worker) : null),
    context2d: () => recordingContext('canvas', []),
    timeOrigin: () => 0,
    token: () => '',
    nextFrame: () => noop,
    now: () => 0,
    isHidden: () => false,
  };
  TestBed.configureTestingModule({
    providers: [
      SceneEngineService,
      { provide: AnimatedCanvasService, useValue: canvas },
    ],
  });
  const canvases = {
    matter: document.createElement('canvas'),
    sky: document.createElement('canvas'),
  };
  return { engines: TestBed.inject(SceneEngineService), canvases, started };
};

describe('SceneEngineService', () => {
  it('draws the scene in a worker when the browser can draw off the page', async () => {
    const { engines, canvases, started } = setup({
      offThread: true,
      worker: true,
    });

    const engine = await engines.create(canvases, 1000);

    expect(engine).toBeInstanceOf(RemoteSceneEngine);
    expect(started.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'boot', viewportArea: 1000 }),
    );
  });

  it.each([
    {
      why: 'cannot draw off the page',
      browser: { offThread: false, worker: true },
    },
    {
      why: 'will not start its worker',
      browser: { offThread: true, worker: false },
    },
  ])(
    'draws the scene in the page when the browser $why',
    async ({ browser }) => {
      const { engines, canvases } = setup(browser);

      expect(await engines.create(canvases, 1000)).toBeInstanceOf(
        SpaceSceneEngine,
      );
    },
  );

  it('sizes the canvases itself when the page draws them', async () => {
    const inPage = setup({ offThread: false, worker: false });
    await inPage.engines.create(inPage.canvases, 1000);
    inPage.engines.fit(inPage.canvases, 640, 480);
    expect(inPage.canvases.matter.width).toBe(640);
  });

  it('leaves the canvases to the worker when it draws them', async () => {
    const inWorker = setup({ offThread: true, worker: true });
    await inWorker.engines.create(inWorker.canvases, 1000);
    inWorker.engines.fit(inWorker.canvases, 640, 480);
    expect(inWorker.canvases.matter.width).not.toBe(640);
  });

  it('stops its worker with the scene', async () => {
    const { canvases, started } = setup({
      offThread: true,
      worker: true,
    });
    const { instance: engines, destroy } = injectInScope(SceneEngineService);
    await engines.create(canvases, 1000);

    destroy();

    expect(started.terminate).toHaveBeenCalledTimes(1);
  });
});
