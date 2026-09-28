import { RemoteSceneEngine } from '@shared/space-scene/engine/remote-scene.engine';
import {
  SceneWorkerEngine,
  WorkerCanvas,
} from '@shared/space-scene/engine/scene-worker.engine';
import type {
  FromSceneWorker,
  ToSceneWorker,
} from '@shared/space-scene/models/scene-worker.model';
import { drivenHost } from '../doubles/driven-host.double';
import { recordingContext } from '../doubles/recording-canvas.double';
import { seededRandom } from '../doubles/seeded-random.double';

interface ShownBitmap {
  readonly width: number;
  readonly height: number;
  readonly name: string;
  isClosed: boolean;
}

const workerCanvas = (
  name: string,
  log: string[],
  made: ShownBitmap[],
): WorkerCanvas => {
  const context = recordingContext(name, log);
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
    transferToImageBitmap: () => {
      const bitmap: ShownBitmap & { close(): void } = {
        width: canvas.width,
        height: canvas.height,
        name,
        isClosed: false,
        close: () => {
          bitmap.isClosed = true;
        },
      };
      made.push(bitmap);
      return bitmap as unknown as ImageBitmap;
    },
  };
  return canvas;
};

export const pairedScene = () => {
  const log: string[] = [];
  const clock = drivenHost();
  const names = ['matter', 'sky'];
  const shown: ShownBitmap[] = [];
  const made: ShownBitmap[] = [];
  const posted: FromSceneWorker[] = [];
  const mainFrames: ((time: number) => void)[] = [];
  const travels: boolean[] = [];
  const worker = new SceneWorkerEngine({
    timeOrigin: 0,
    rnd: seededRandom(7),
    canvas: () => workerCanvas(names.shift() ?? 'extra', log, made),
    frame: (callback) => clock.host.frame(callback),
    now: () => clock.host.now(),
    post: (message) => {
      posted.push(message);
    },
    loadHoleFocus: () => Promise.reject(new Error('not on this scene')),
  });
  const shownCanvas = () => {
    const canvas = { width: 0, height: 0 };
    return {
      canvas,
      context: {
        transferFromImageBitmap: (bitmap: ImageBitmap | null) => {
          if (bitmap) {
            shown.push(bitmap as unknown as ShownBitmap);
          }
        },
      },
    };
  };
  const canvases = { matter: shownCanvas(), sky: shownCanvas() };
  let listener: ((message: FromSceneWorker) => void) | null = null;
  const engine = new RemoteSceneEngine(
    {
      post: (message: ToSceneWorker) => {
        worker.take(structuredClone(message));
      },
      listen: (handler) => {
        listener = handler;
      },
    },
    {
      frame: (callback) => {
        mainFrames.push(callback);
        return () => {
          mainFrames.splice(mainFrames.indexOf(callback), 1);
        };
      },
      now: () => clock.host.now(),
      hidden: () => false,
      travel: (isTravelling) => travels.push(isTravelling),
    },
    canvases,
    {
      density: 600,
      figures: 'constellations',
      ink: '#e8ecf2',
      accent: '#7cc4f0',
      viewportArea: 1280 * 800,
      timeOrigin: 0,
    },
  );
  const deliver = async (): Promise<void> => {
    await Promise.resolve();
    for (const message of posted.splice(0)) {
      listener?.(message);
    }
    for (const frame of mainFrames.splice(0)) {
      frame(clock.host.now());
    }
  };
  const run = async (ms: number): Promise<void> => {
    await deliver();
    clock.step(ms);
    await deliver();
  };
  return { engine, log, run, shown, made, canvases, travels };
};
