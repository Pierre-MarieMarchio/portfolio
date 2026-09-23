import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BrowserWindowService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  public size(): { width: number; height: number } | null {
    const view = this.view();
    return view ? { width: view.innerWidth, height: view.innerHeight } : null;
  }

  public on<K extends keyof WindowEventMap>(
    type: K,
    handler: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): () => void {
    const view = this.view();
    if (!view) {
      return () => {};
    }
    view.addEventListener(type, handler, options);
    return () => {
      view.removeEventListener(type, handler, options);
    };
  }

  private view(): Window | null {
    return this.isBrowser ? this.document.defaultView : null;
  }
}
