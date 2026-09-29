import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, PLATFORM_ID, Service } from '@angular/core';

@Service()
export class CursorService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  public set(cursor: string): void {
    if (this.isBrowser) {
      this.document.body.style.cursor = cursor;
    }
  }

  public blockSelection(isBlocked: boolean): void {
    if (!this.isBrowser) {
      return;
    }
    this.document.body.style.userSelect = isBlocked ? 'none' : '';
    if (isBlocked) {
      this.document.getSelection()?.removeAllRanges();
    }
  }
}
