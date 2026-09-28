import { Provider } from '@angular/core';
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
  public isReduced = false;
  public knowsScrollEnd = true;
  private frames: (() => void)[] = [];
  private waiting: Waiting[] = [];
  private readonly resized: (() => void)[] = [];

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

  public readonly onResize = (_element: Element, fn: () => void) => {
    this.resized.push(fn);
    return ignore;
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
}

export const provideMobileNavPlatform = (
  platform: MobileNavPlatform = new MobileNavPlatformDouble(),
): Provider => ({ provide: MOBILE_NAV_PLATFORM, useValue: platform });
