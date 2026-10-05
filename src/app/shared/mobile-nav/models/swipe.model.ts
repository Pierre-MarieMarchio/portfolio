import type { OutputEmitterRef, Signal } from '@angular/core';
import type { ClockService, MediaPreferencesService } from '@app/core/services';
import type { MobileNavLayout } from '../ports/mobile-nav-layout.port';

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
  readonly layout: MobileNavLayout;
  readonly media: MediaPreferencesService;
  readonly clock: ClockService;
  readonly appSwipeSteps: Signal<SwipeStops>;
  readonly stepped: OutputEmitterRef<number>;
  readonly afterRender: (callback: () => void) => () => void;
}
