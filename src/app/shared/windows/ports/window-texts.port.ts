import { InjectionToken, Signal } from '@angular/core';

export interface WindowTexts {
  readonly pin: string;
  readonly unpin: string;
  readonly fold: string;
  readonly unfold: string;
  readonly close: string;
}

export const WINDOW_TEXTS = new InjectionToken<Signal<WindowTexts>>(
  'WINDOW_TEXTS',
);
