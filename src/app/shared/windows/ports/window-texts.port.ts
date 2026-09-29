import { InjectionToken, Signal } from '@angular/core';

export interface WindowPinTexts {
  readonly pin: string;
  readonly unpin: string;
}

export interface WindowPhoneTexts extends WindowPinTexts {
  readonly fold: string;
  readonly unfold: string;
}

export interface WindowTexts {
  readonly menu: string;
  readonly keepOpen: string;
  readonly snapLeft: string;
  readonly snapRight: string;
  readonly maximize: string;
  readonly restore: string;
  readonly close: string;
  readonly phone: WindowPhoneTexts;
  readonly kept: string;
  readonly released: string;
}

export const WINDOW_TEXTS = new InjectionToken<Signal<WindowTexts>>(
  'WINDOW_TEXTS',
);
