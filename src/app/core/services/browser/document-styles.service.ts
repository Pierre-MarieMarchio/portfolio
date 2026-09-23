import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';

const DURATION = /^(\d+(?:\.\d+)?)(ms|s)$/;

@Injectable({ providedIn: 'root' })
export class DocumentStylesService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  public token(name: string, el?: Element): string {
    const view = this.isBrowser ? this.document.defaultView : null;
    return view
      ? view
          .getComputedStyle(el ?? this.document.documentElement)
          .getPropertyValue(name)
          .trim()
      : '';
  }

  public duration(name: string): number | null {
    const match = DURATION.exec(this.token(name));
    if (!match?.[1]) {
      return null;
    }
    const value = Number.parseFloat(match[1]);
    return match[2] === 's' ? value * 1000 : value;
  }

  public fontsReady(fn: () => void): void {
    if (!this.isBrowser) {
      return;
    }
    const fonts = this.document.fonts as FontFaceSet | undefined;
    if (!fonts) {
      return;
    }
    void fonts.ready.then(() => {
      fn();
    });
  }
}
