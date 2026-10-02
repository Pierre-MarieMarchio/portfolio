import { InjectionToken, Signal } from '@angular/core';

export interface WindowPhoneTexts {
  readonly fold: string;
  readonly unfold: string;
}

export interface WindowTexts {
  readonly menu: string;
  readonly keepOpen: string;
  readonly keptOpen: string;
  readonly snapLeft: string;
  readonly snapRight: string;
  readonly maximize: string;
  readonly restore: string;
  readonly close: string;
  readonly phone: WindowPhoneTexts;
}

export const WINDOW_TEXTS = new InjectionToken<Signal<WindowTexts>>(
  'WINDOW_TEXTS',
);
