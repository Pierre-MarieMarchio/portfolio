import type { OutputEmitterRef, Signal } from '@angular/core';
import type { MobileNavPlatform } from '../ports/mobile-nav-platform.port';

export interface SwipeRelease {
  readonly travel: number;
  readonly ms: number;
  readonly width: number;
  readonly index: number;
  readonly count: number;
}

export interface SwipeFollow {
  readonly pane: number;
  readonly at: number;
}

export interface SwipeStops {
  readonly area: string;
  readonly index: number;
  readonly count: number;
}

export interface SwipeHost {
  readonly element: HTMLElement;
  readonly platform: MobileNavPlatform;
  readonly appSwipeSteps: Signal<SwipeStops>;
  readonly stepped: OutputEmitterRef<number>;
  readonly afterRender: (callback: () => void) => () => void;
}
