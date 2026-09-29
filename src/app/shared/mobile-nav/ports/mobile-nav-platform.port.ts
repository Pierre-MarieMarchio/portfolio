import { InjectionToken } from '@angular/core';

export interface MobileNavPlatform {
  readonly isCompact: () => boolean;
  readonly reducedMotion: () => boolean;
  readonly nextFrame: (fn: () => void) => () => void;
  readonly after: (ms: number, fn: () => void) => () => void;
  readonly hasScrollEnd: () => boolean;
  readonly hasSnapChanging: () => boolean;
  readonly onResize: (element: Element, fn: () => void) => () => void;
  readonly onSnapChanging: (
    element: Element,
    fn: (target: Element | null) => void,
  ) => () => void;
  readonly whenStill: (element: Element) => Promise<void>;
  readonly closesOnBack: () => boolean;
  readonly watchClose: (fn: () => void) => () => void;
  readonly historyState: () => unknown;
  readonly pushHistory: (state: unknown) => void;
  readonly historyBack: (steps: number) => void;
  readonly onHistoryPop: (fn: (state: unknown) => void) => () => void;
  readonly onLeave: (fn: () => void) => () => void;
}

export const MOBILE_NAV_PLATFORM = new InjectionToken<MobileNavPlatform>(
  'MOBILE_NAV_PLATFORM',
);
