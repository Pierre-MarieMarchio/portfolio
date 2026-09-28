import { SceneWorkerEngine } from './scene-worker.engine';
import type {
  FromSceneWorker,
  ToSceneWorker,
} from '../models/scene-worker.model';

interface WorkerGlobal {
  requestAnimationFrame?: (callback: (time: number) => void) => number;
  cancelAnimationFrame?: (id: number) => void;
  postMessage(message: FromSceneWorker, transfer: Transferable[]): void;
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<ToSceneWorker>) => void,
  ): void;
}

const FRAME_MS = 1000 / 60;
const scope = globalThis as unknown as WorkerGlobal;

const frame = (callback: (time: number) => void): (() => void) => {
  const { requestAnimationFrame, cancelAnimationFrame } = scope;
  if (requestAnimationFrame && cancelAnimationFrame) {
    const id = requestAnimationFrame.call(scope, callback);
    return () => {
      cancelAnimationFrame.call(scope, id);
    };
  }
  const timer = setTimeout(() => {
    callback(performance.now());
  }, FRAME_MS);
  return () => {
    clearTimeout(timer);
  };
};

const worker = new SceneWorkerEngine({
  timeOrigin: performance.timeOrigin,
  rnd: Math.random,
  canvas: () => new OffscreenCanvas(0, 0),
  frame,
  now: () => performance.now(),
  post: (message, transfer) => {
    scope.postMessage(message, transfer);
  },
  loadHoleFocus: () => import('../rules/hole-focus.rules'),
});

scope.addEventListener('message', (event) => {
  worker.take(event.data);
});
