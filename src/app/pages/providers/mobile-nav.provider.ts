import { inject, Provider } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import {
  BrowserWindowService,
  ClockService,
  DisplayFormatService,
  ElementObserverService,
  MediaPreferencesService,
  SessionHistoryService,
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
        const display = inject(DisplayFormatService);
        const media = inject(MediaPreferencesService);
        const clock = inject(ClockService);
        const browserWindow = inject(BrowserWindowService);
        const observer = inject(ElementObserverService);
        const sessionHistory = inject(SessionHistoryService);
        const router = inject(Router);
        return {
          isCompact: () => display.format() === 'phone',
          reducedMotion: () => media.reducedMotion(),
          nextFrame: (fn) =>
            clock.nextFrame(() => {
              fn();
            }),
          after: (ms, fn) => clock.after(ms, fn),
          hasScrollEnd: () => browserWindow.supportsEvent('scrollend'),
          hasSnapChanging: () => observer.hasSnapChanging(),
          onResize: (element, fn) => observer.onResize(element, fn),
          onSnapChanging: (element, fn) => observer.onSnapChanging(element, fn),
          whenStill: (element) => observer.whenStill(element),
          closesOnBack: () => sessionHistory.hasCloseWatcher(),
          historyState: () => sessionHistory.state(),
          pushHistory: (state) => {
            sessionHistory.push(state);
          },
          historyBack: (steps) => {
            sessionHistory.back(steps);
          },
          onHistoryPop: (fn) => sessionHistory.onPop(fn),
          onLeave: (fn) => {
            const watching = router.events.subscribe((event) => {
              if (event instanceof NavigationStart) {
                fn();
              }
            });
            return () => {
              watching.unsubscribe();
            };
          },
        };
      },
    },
  ];
}
