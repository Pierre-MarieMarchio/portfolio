import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, PLATFORM_ID, Service } from '@angular/core';

interface SnapChangingEvent extends Event {
  readonly snapTargetInline: Element | null;
}

@Service()
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

  public onSnapChanging(
    el: Element,
    fn: (target: Element | null) => void,
  ): () => void {
    if (!this.supportsSnapChanging(el)) {
      return () => {};
    }
    const listener = (event: Event): void => {
      fn((event as SnapChangingEvent).snapTargetInline);
    };
    el.addEventListener('scrollsnapchanging', listener);
    return () => {
      el.removeEventListener('scrollsnapchanging', listener);
    };
  }

  public hasSnapChanging(): boolean {
    return this.supportsSnapChanging(this.document.documentElement);
  }

  public async whenStill(el: Element): Promise<void> {
    if (!this.isBrowser || typeof el.getAnimations !== 'function') {
      return;
    }
    await Promise.allSettled(
      el.getAnimations().map((animation) => animation.finished),
    );
  }

  private view(): (Window & typeof globalThis) | null {
    return this.isBrowser ? this.document.defaultView : null;
  }

  private supportsSnapChanging(el: Element): boolean {
    return 'onscrollsnapchanging' in el;
  }
}
