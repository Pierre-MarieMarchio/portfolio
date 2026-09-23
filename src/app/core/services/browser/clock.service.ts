import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, PLATFORM_ID, Service } from '@angular/core';

@Service()
export class ClockService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  public now(): number {
    return this.view()?.performance.now() ?? 0;
  }

  public nextFrame(fn: (time: number) => void): () => void {
    const view = this.view();
    if (!view || typeof view.requestAnimationFrame !== 'function') {
      return () => {};
    }
    const id = view.requestAnimationFrame(fn);
    return () => {
      view.cancelAnimationFrame(id);
    };
  }

  public after(ms: number, fn: () => void): () => void {
    if (!this.isBrowser) {
      return () => {};
    }
    const timer = setTimeout(fn, ms);
    return () => {
      clearTimeout(timer);
    };
  }

  private view(): Window | null {
    return this.isBrowser ? this.document.defaultView : null;
  }
}
