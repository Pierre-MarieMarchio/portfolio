import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';

/**
 * The browser, behind one door. While prerendering there is no `window`, no
 * `matchMedia` and no layout, so every method here answers a neutral value on
 * the server instead of throwing.
 *
 * Nothing else in the application touches `window` or `matchMedia` directly:
 * code that does is code that breaks the prerender the day it runs at startup.
 */
@Injectable({ providedIn: 'root' })
export class BrowserEnvironment {
  public readonly document = inject(DOCUMENT);
  public readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Whether the reader asked for less motion. `true` on the server: the
   * prerendered page is what a reader without JavaScript keeps, and a page
   * that never animates is the safe one to ship.
   */
  public prefersReducedMotion(): boolean {
    return this.matches('(prefers-reduced-motion: reduce)', true);
  }

  /**
   * Calls back when a media query starts or stops matching, and returns the
   * function that stops listening. Inert on the server.
   */
  public watchMedia(
    query: string,
    onChange: (matches: boolean) => void,
  ): () => void {
    const list = this.mediaQuery(query);

    if (!list) {
      return () => undefined;
    }

    const listener = (event: MediaQueryListEvent): void => {
      onChange(event.matches);
    };

    list.addEventListener('change', listener);

    return () => {
      list.removeEventListener('change', listener);
    };
  }

  private matches(query: string, serverAnswer: boolean): boolean {
    return this.mediaQuery(query)?.matches ?? serverAnswer;
  }

  private mediaQuery(query: string): MediaQueryList | null {
    const view = this.document.defaultView;

    if (!this.isBrowser || typeof view?.matchMedia !== 'function') {
      return null;
    }

    return view.matchMedia(query);
  }
}
