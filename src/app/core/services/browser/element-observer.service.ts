import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, PLATFORM_ID, Service } from '@angular/core';

interface SnapChangingEvent extends Event {
  readonly snapTargetInline: Element | null;
}

@Service()
export class ElementObserverService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  public onResize(element: Element, callback: () => void): () => void {
    const view = this.view();
    if (!view || typeof view.ResizeObserver !== 'function') {
      return () => {};
    }
    const observer = new view.ResizeObserver(() => {
      callback();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }

  public onVisible(
    element: Element,
    threshold: number,
    callback: (isVisible: boolean) => void,
  ): () => void {
    const view = this.view();
    if (!view || typeof view.IntersectionObserver !== 'function') {
      return () => {};
    }
    const observer = new view.IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          callback(entry.isIntersecting);
        }
      },
      { threshold },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }

  public onSnapChanging(
    element: Element,
    callback: (target: Element | null) => void,
  ): () => void {
    if (!this.supportsSnapChanging(element)) {
      return () => {};
    }
    const listener = (event: Event): void => {
      callback((event as SnapChangingEvent).snapTargetInline);
    };
    element.addEventListener('scrollsnapchanging', listener);
    return () => {
      element.removeEventListener('scrollsnapchanging', listener);
    };
  }

  public hasSnapChanging(): boolean {
    return this.supportsSnapChanging(this.document.documentElement);
  }

  public async whenStill(element: Element): Promise<void> {
    if (!this.isBrowser || typeof element.getAnimations !== 'function') {
      return;
    }
    await Promise.allSettled(
      element.getAnimations().map((animation) => animation.finished),
    );
  }

  private view(): (Window & typeof globalThis) | null {
    return this.isBrowser ? this.document.defaultView : null;
  }

  private supportsSnapChanging(element: Element): boolean {
    return 'onscrollsnapchanging' in element;
  }
}
