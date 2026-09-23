import { InjectionToken, Signal } from '@angular/core';

export interface SharedTexts {
  readonly segmented: {
    readonly label: string;
  };
  readonly pageBar: {
    readonly languages: string;
    readonly navigation: string;
  };
  readonly contactRail: {
    readonly label: string;
  };
}

export const SHARED_TEXTS = new InjectionToken<Signal<SharedTexts>>(
  'SHARED_TEXTS',
);
