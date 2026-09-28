import { InjectionToken, Signal } from '@angular/core';

export interface MobileNavTexts {
  readonly pageOf: (place: number, count: number) => string;
}

export const MOBILE_NAV_TEXTS = new InjectionToken<Signal<MobileNavTexts>>(
  'MOBILE_NAV_TEXTS',
);
