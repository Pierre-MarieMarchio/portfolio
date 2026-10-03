import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, PLATFORM_ID, Service } from '@angular/core';

const IDLE_TIMEOUT_MS = 2000;
const IDLE_FALLBACK_MS = 200;

@Service()
export class ClockService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  public now(): number {
    return this.view()?.performance.now() ?? 0;
  }

  public nextFrame(callback: (time: number) => void): () => void {
    const view = this.view();
    if (!view || typeof view.requestAnimationFrame !== 'function') {
      return () => {};
    }
    const id = view.requestAnimationFrame(callback);
    return () => {
      view.cancelAnimationFrame(id);
    };
  }

  public after(ms: number, callback: () => void): () => void {
    if (!this.isBrowser) {
      return () => {};
    }
    const timer = setTimeout(callback, ms);
    return () => {
      clearTimeout(timer);
    };
  }

  public whenIdle(callback: () => void): () => void {
    const view = this.view();
    if (!view) {
      return () => {};
    }
    if (typeof view.requestIdleCallback !== 'function') {
      return this.after(IDLE_FALLBACK_MS, callback);
    }
    const id = view.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
    return () => {
      view.cancelIdleCallback(id);
    };
  }

  private view(): Window | null {
    return this.isBrowser ? this.document.defaultView : null;
  }
}
