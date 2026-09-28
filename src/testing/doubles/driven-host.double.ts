import { EngineHost } from '@shared/space-scene/engine/space-scene.engine';

export const FRAME_MS = 1000 / 60;

export interface DrivenHost {
  readonly host: EngineHost;
  readonly step: (ms: number) => void;
  readonly refresh: (frames: number) => void;
  readonly isScheduled: () => boolean;
  readonly travels: readonly boolean[];
}

export const drivenHost = (hz = 60): DrivenHost => {
  const frameMs = 1000 / hz;
  let clock = 0;
  let pending: ((time: number) => void) | null = null;
  const travels: boolean[] = [];
  const host: EngineHost = {
    frame: (callback) => {
      pending = callback;
      return () => {
        pending = null;
      };
    },
    now: () => clock,
    hidden: () => false,
    travel: (isTravelling) => travels.push(isTravelling),
  };
  const fire = (): void => {
    const callback = pending;
    pending = null;
    callback?.(clock);
  };
  const step = (ms: number): void => {
    const end = clock + ms;
    while (clock < end) {
      clock = Math.min(end, clock + frameMs);
      fire();
    }
  };
  const refresh = (frames: number): void => {
    for (let i = 0; i < frames; i++) {
      clock += frameMs;
      fire();
    }
  };
  return {
    host,
    step,
    refresh,
    isScheduled: () => pending !== null,
    travels,
  };
};
