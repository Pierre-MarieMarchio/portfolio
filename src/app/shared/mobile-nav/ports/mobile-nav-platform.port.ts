import { InjectionToken } from '@angular/core';

export interface MobileNavPlatform {
  readonly reducedMotion: () => boolean;
  readonly nextFrame: (fn: () => void) => () => void;
  readonly after: (ms: number, fn: () => void) => () => void;
  readonly hasScrollEnd: () => boolean;
  readonly onResize: (element: Element, fn: () => void) => () => void;
}

export const MOBILE_NAV_PLATFORM = new InjectionToken<MobileNavPlatform>(
  'MOBILE_NAV_PLATFORM',
);
