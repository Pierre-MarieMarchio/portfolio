import { InjectionToken } from '@angular/core';

export interface WindowFold {
  readonly isActive: () => boolean;
  readonly isFolded: () => boolean;
  readonly toggle: () => void;
  readonly hold: (handle: HTMLElement) => () => void;
}

export const WINDOW_FOLD = new InjectionToken<WindowFold>('WINDOW_FOLD');
