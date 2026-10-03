import { InjectionToken } from '@angular/core';

export interface MobileNavPlatform {
  readonly isCompact: () => boolean;
  readonly reducedMotion: () => boolean;
  readonly nextFrame: (callback: () => void) => () => void;
  readonly after: (ms: number, callback: () => void) => () => void;
  readonly hasScrollEnd: () => boolean;
  readonly hasSnapChanging: () => boolean;
  readonly onResize: (element: Element, callback: () => void) => () => void;
  readonly onVisible: (
    element: Element,
    callback: (isVisible: boolean) => void,
  ) => () => void;
  readonly onSnapChanging: (
    element: Element,
    callback: (target: Element | null) => void,
  ) => () => void;
  readonly whenStill: (element: Element) => Promise<void>;
  readonly closesOnBack: () => boolean;
  readonly watchClose: (callback: () => void) => () => void;
  readonly historyState: () => unknown;
  readonly pushHistory: (state: unknown) => void;
  readonly historyBack: (steps: number) => void;
  readonly onHistoryPop: (callback: (state: unknown) => void) => () => void;
  readonly vibrate: (ms: number) => void;
  readonly onLeave: (callback: () => void) => () => void;
}

export const MOBILE_NAV_PLATFORM = new InjectionToken<MobileNavPlatform>(
  'MOBILE_NAV_PLATFORM',
);
