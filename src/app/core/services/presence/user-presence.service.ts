import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BrowserWindowService } from '../browser/browser-window.service';
import { ClockService } from '../browser/clock.service';
import { MediaPreferencesService } from '../browser/media-preferences.service';

const GESTURES = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

@Injectable({ providedIn: 'root' })
export class UserPresenceService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly browserWindow = inject(BrowserWindowService);
  private readonly clock = inject(ClockService);
  private readonly media = inject(MediaPreferencesService);

  public whenPresent(maxMs: number | null, fn: () => void): () => void {
    if (!this.isBrowser) {
      return () => {};
    }
    if (maxMs === null || this.media.reducedMotion()) {
      fn();
      return () => {};
    }
    const stops: (() => void)[] = [];
    const cancel = (): void => {
      for (const stop of stops.splice(0)) {
        stop();
      }
    };
    const once = (): void => {
      cancel();
      fn();
    };
    stops.push(
      this.clock.after(maxMs, once),
      ...GESTURES.map((type) =>
        this.browserWindow.on(type, once, { passive: true }),
      ),
    );
    return cancel;
  }
}
