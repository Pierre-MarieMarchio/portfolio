import { InjectionToken, Signal } from '@angular/core';

export interface WindowControlTexts {
  readonly pin: string;
  readonly unpin: string;
  readonly fold: string;
  readonly unfold: string;
}

export interface WindowTexts extends WindowControlTexts {
  readonly close: string;
  readonly phone: WindowControlTexts;
  readonly kept: string;
  readonly released: string;
}

export const WINDOW_TEXTS = new InjectionToken<Signal<WindowTexts>>(
  'WINDOW_TEXTS',
);
