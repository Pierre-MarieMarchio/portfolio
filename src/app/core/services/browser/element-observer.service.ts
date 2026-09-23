import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ElementObserverService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  public onResize(el: Element, fn: () => void): () => void {
    const view = this.view();
    if (!view || typeof view.ResizeObserver !== 'function') {
      return () => {};
    }
    const observer = new view.ResizeObserver(() => {
      fn();
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }

  public onVisible(
    el: Element,
    threshold: number,
    fn: (isVisible: boolean) => void,
  ): () => void {
    const view = this.view();
    if (!view || typeof view.IntersectionObserver !== 'function') {
      return () => {};
    }
    const observer = new view.IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          fn(entry.isIntersecting);
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }

  private view(): (Window & typeof globalThis) | null {
    return this.isBrowser ? this.document.defaultView : null;
  }
}
