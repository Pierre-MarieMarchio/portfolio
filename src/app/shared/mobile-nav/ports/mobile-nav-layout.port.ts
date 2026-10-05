import { InjectionToken } from '@angular/core';

export interface MobileNavLayout {
  readonly isCompact: () => boolean;
}

export const MOBILE_NAV_LAYOUT = new InjectionToken<MobileNavLayout>(
  'MOBILE_NAV_LAYOUT',
);
