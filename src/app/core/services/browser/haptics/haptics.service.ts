import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, PLATFORM_ID, Service } from '@angular/core';

@Service()
export class HapticsService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  public vibrate(ms: number): void {
    const navigator = this.isBrowser
      ? this.document.defaultView?.navigator
      : null;
    if (typeof navigator?.vibrate !== 'function') {
      return;
    }
    try {
      navigator.vibrate(ms);
    } catch {
      return;
    }
  }
}
