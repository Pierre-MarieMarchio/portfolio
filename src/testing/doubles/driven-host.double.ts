import { EngineHost } from '@shared/space-scene/engine/space-scene.engine';

export const FRAME_MS = 1000 / 60;

export interface DrivenHost {
  readonly host: EngineHost;
  readonly step: (ms: number) => void;
  readonly isScheduled: () => boolean;
}

export const drivenHost = (): DrivenHost => {
  let clock = 0;
  let pending: ((time: number) => void) | null = null;
  const host: EngineHost = {
    frame: (callback) => {
      pending = callback;
      return () => {
        pending = null;
      };
    },
    now: () => clock,
    hidden: () => false,
  };
  const step = (ms: number): void => {
    const end = clock + ms;
    while (clock < end) {
      clock = Math.min(end, clock + FRAME_MS);
      const callback = pending;
      pending = null;
      callback?.(clock);
    }
  };
  return { host, step, isScheduled: () => pending !== null };
};
