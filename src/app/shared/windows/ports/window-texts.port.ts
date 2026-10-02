import { InjectionToken, Signal } from '@angular/core';

export interface WindowPhoneTexts {
  readonly fold: string;
  readonly unfold: string;
}

export interface WindowTexts {
  readonly keptOpen: string;
  readonly minimize: string;
  readonly pin: string;
  readonly maximize: string;
  readonly restore: string;
  readonly close: string;
  readonly phone: WindowPhoneTexts;
}

export const WINDOW_TEXTS = new InjectionToken<Signal<WindowTexts>>(
  'WINDOW_TEXTS',
);
