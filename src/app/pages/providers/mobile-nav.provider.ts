import { inject, Provider } from '@angular/core';
import {
  BrowserWindowService,
  ClockService,
  ElementObserverService,
  MediaPreferencesService,
} from '@app/core/services';
import {
  MOBILE_NAV_PLATFORM,
  MobileNavPlatform,
} from '@shared/mobile-nav/ports';

export function provideMobileNav(): Provider[] {
  return [
    {
      provide: MOBILE_NAV_PLATFORM,
      useFactory: (): MobileNavPlatform => {
        const media = inject(MediaPreferencesService);
        const clock = inject(ClockService);
        const browserWindow = inject(BrowserWindowService);
        const observer = inject(ElementObserverService);
        return {
          reducedMotion: () => media.reducedMotion(),
          nextFrame: (fn) =>
            clock.nextFrame(() => {
              fn();
            }),
          after: (ms, fn) => clock.after(ms, fn),
          hasScrollEnd: () => browserWindow.supportsEvent('scrollend'),
          onResize: (element, fn) => observer.onResize(element, fn),
        };
      },
    },
  ];
}
