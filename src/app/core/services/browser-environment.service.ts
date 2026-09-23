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

  /**
   * The size of the browser window, or `null` on the server: there is no
   * viewport while prerendering, and a caller that needs one has nothing to
   * lay out either.
   */
  public viewport(): { width: number; height: number } | null {
    const view = this.view();
    return view ? { width: view.innerWidth, height: view.innerHeight } : null;
  }

  /**
   * Listens to an event on the browser window, and returns the function that
   * stops listening. Inert on the server.
   *
   * Registered imperatively on purpose: in a zoneless application a listener
   * that no template declares schedules no render, which is what a 60 fps
   * gesture needs.
   */
  public listen<K extends keyof WindowEventMap>(
    type: K,
    listener: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): () => void {
    const view = this.view();
    if (!view) {
      return () => undefined;
    }
    view.addEventListener(type, listener, options);
    return () => {
      view.removeEventListener(type, listener, options);
    };
  }

  /**
   * Calls back at the next frame, and returns the function that cancels it.
   * Inert on the server, where no frame ever comes: a caller waiting for one
   * simply never runs, which is what a prerender wants.
   */
  public nextFrame(callback: (time: number) => void): () => void {
    const view = this.view();
    if (!view || typeof view.requestAnimationFrame !== 'function') {
      return () => undefined;
    }
    const id = view.requestAnimationFrame(callback);
    return () => {
      view.cancelAnimationFrame(id);
    };
  }

  private view(): Window | null {
    return this.isBrowser ? this.document.defaultView : null;
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
