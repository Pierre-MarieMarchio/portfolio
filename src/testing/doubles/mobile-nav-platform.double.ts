import { Provider, signal } from '@angular/core';
import {
  MOBILE_NAV_PLATFORM,
  MobileNavPlatform,
} from '@shared/mobile-nav/ports';

const ignore = (): void => {};

interface Waiting {
  readonly ms: number;
  readonly fn: () => void;
}

export class MobileNavPlatformDouble implements MobileNavPlatform {
  public readonly compact = signal(false);
  public isReduced = false;
  public knowsScrollEnd = true;
  public knowsSnapChanging = false;
  public hasCloseWatcher = false;
  public entries: unknown[] = [{ navigationId: 1 }];
  public place = 0;
  public readonly backs: number[] = [];
  public readonly moving: Element[] = [];
  public readonly vibrations: number[] = [];
  private frames: (() => void)[] = [];
  private waiting: Waiting[] = [];
  private readonly resized: (() => void)[] = [];
  private readonly sightings: ((isVisible: boolean) => void)[] = [];
  private readonly snapping = new Map<
    Element,
    (target: Element | null) => void
  >();
  private stillnesses: (() => void)[] = [];
  private pops: ((state: unknown) => void)[] = [];
  private leaves: (() => void)[] = [];
  private pendingPops: unknown[] = [];
  private watchers: (() => void)[] = [];

  public readonly isCompact = (): boolean => this.compact();

  public readonly reducedMotion = (): boolean => this.isReduced;

  public readonly nextFrame = (fn: () => void): (() => void) => {
    this.frames.push(fn);
    return () => {
      this.frames = this.frames.filter((frame) => frame !== fn);
    };
  };

  public readonly after = (ms: number, fn: () => void): (() => void) => {
    const waiting = { ms, fn };
    this.waiting.push(waiting);
    return () => {
      this.waiting = this.waiting.filter((entry) => entry !== waiting);
    };
  };

  public readonly hasScrollEnd = (): boolean => this.knowsScrollEnd;

  public readonly hasSnapChanging = (): boolean => this.knowsSnapChanging;

  public readonly onResize = (_element: Element, fn: () => void) => {
    this.resized.push(fn);
    return ignore;
  };

  public readonly onVisible = (
    _element: Element,
    fn: (isVisible: boolean) => void,
  ) => {
    this.sightings.push(fn);
    return ignore;
  };

  public readonly onSnapChanging = (
    element: Element,
    fn: (target: Element | null) => void,
  ): (() => void) => {
    this.snapping.set(element, fn);
    return () => {
      this.snapping.delete(element);
    };
  };

  public readonly whenStill = (element: Element): Promise<void> => {
    this.moving.push(element);
    return new Promise((resolve) => {
      this.stillnesses.push(resolve);
    });
  };

  public readonly closesOnBack = (): boolean => this.hasCloseWatcher;

  public readonly watchClose = (fn: () => void): (() => void) => {
    this.watchers.push(fn);
    return () => {
      this.watchers = this.watchers.filter((watcher) => watcher !== fn);
    };
  };

  public readonly historyState = (): unknown => this.entries[this.place];

  public readonly pushHistory = (state: unknown): void => {
    this.entries = [...this.entries.slice(0, this.place + 1), state];
    this.place = this.entries.length - 1;
  };

  public readonly historyBack = (steps: number): void => {
    this.backs.push(steps);
    this.place = Math.max(this.place - steps, 0);
    this.pendingPops.push(this.entries[this.place]);
  };

  public readonly onHistoryPop = (fn: (state: unknown) => void) => {
    this.pops.push(fn);
    return () => {
      this.pops = this.pops.filter((pop) => pop !== fn);
    };
  };

  public readonly vibrate = (ms: number): void => {
    this.vibrations.push(ms);
  };

  public readonly onLeave = (fn: () => void) => {
    this.leaves.push(fn);
    return () => {
      this.leaves = this.leaves.filter((leave) => leave !== fn);
    };
  };

  public frame(): void {
    const frames = this.frames;
    this.frames = [];
    for (const fn of frames) {
      fn();
    }
  }

  public elapse(ms: number): void {
    const due = this.waiting.filter((entry) => entry.ms <= ms);
    this.waiting = this.waiting.filter((entry) => entry.ms > ms);
    for (const { fn } of due) {
      fn();
    }
  }

  public resize(): void {
    for (const fn of this.resized) {
      fn();
    }
  }

  public sight(isVisible: boolean): void {
    for (const fn of this.sightings) {
      fn(isVisible);
    }
  }

  public snapTo(element: Element, target: Element | null): void {
    this.snapping.get(element)?.(target);
  }

  public async settle(): Promise<void> {
    const stillnesses = this.stillnesses;
    this.stillnesses = [];
    for (const resolve of stillnesses) {
      resolve();
    }
    await Promise.resolve();
  }

  public pressBack(): void {
    const watcher = this.hasCloseWatcher ? this.watchers.pop() : undefined;
    if (watcher) {
      watcher();
      return;
    }
    this.place = Math.max(this.place - 1, 0);
    this.pop(this.entries[this.place]);
  }

  public deliverPops(): void {
    const pending = this.pendingPops;
    this.pendingPops = [];
    for (const state of pending) {
      this.pop(state);
    }
  }

  public leave(): void {
    for (const fn of this.leaves) {
      fn();
    }
  }

  private pop(state: unknown): void {
    for (const fn of this.pops) {
      fn(state);
    }
  }
}

export const provideMobileNavPlatform = (
  platform: MobileNavPlatform = new MobileNavPlatformDouble(),
): Provider => ({ provide: MOBILE_NAV_PLATFORM, useValue: platform });
