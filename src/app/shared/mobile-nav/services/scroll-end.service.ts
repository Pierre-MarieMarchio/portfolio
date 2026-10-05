import { DestroyRef, inject, Service } from '@angular/core';
import { BrowserWindowService, ClockService } from '@app/core/services';

const SETTLE_MS = 120;

@Service({ autoProvided: false })
export class ScrollEndService {
  private readonly clock = inject(ClockService);
  private readonly browserWindow = inject(BrowserWindowService);
  private stopTimer: () => void = () => {};

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.stopTimer();
    });
  }

  public expect(onEnd: () => void): void {
    if (this.browserWindow.supportsEvent('scrollend')) {
      return;
    }
    this.cancel();
    this.stopTimer = this.clock.after(SETTLE_MS, onEnd);
  }

  public cancel(): void {
    this.stopTimer();
  }
}
