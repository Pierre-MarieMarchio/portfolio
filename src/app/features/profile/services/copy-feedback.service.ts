import { DestroyRef, inject, Service, signal } from '@angular/core';
import { ClipboardService, ClockService } from '@app/core/services';

const COPIED_FOR_MS = 4000;

@Service({ autoProvided: false })
export class CopyFeedbackService {
  private readonly clipboard = inject(ClipboardService);
  private readonly clock = inject(ClockService);
  private forget: () => void = () => {};

  public readonly isCopied = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.forget();
    });
  }

  public copy(text: string): void {
    void this.clipboard.copy(text).then((isDone) => {
      if (isDone) {
        this.said();
      }
    });
  }

  private said(): void {
    this.forget();
    this.isCopied.set(true);
    this.forget = this.clock.after(COPIED_FOR_MS, () => {
      this.isCopied.set(false);
    });
  }
}
