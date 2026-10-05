import { Provider, signal } from '@angular/core';
import { MOBILE_NAV_LAYOUT, MobileNavLayout } from '@shared/mobile-nav/ports';

export class MobileNavLayoutDouble implements MobileNavLayout {
  public readonly compact = signal(false);

  public readonly isCompact = (): boolean => this.compact();
}

export const provideMobileNavLayout = (
  layout: MobileNavLayout = new MobileNavLayoutDouble(),
): Provider => ({ provide: MOBILE_NAV_LAYOUT, useValue: layout });
