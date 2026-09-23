import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';

/** What counts as the reader being there: any of these, anywhere. */
const INTENT = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/**
 * The browser, behind one door. While prerendering there is no `window`, no
 * `matchMedia` and no layout, so every method here answers a neutral value on
 * the server instead of throwing.
 *
 * Nothing else in the application touches `window` or `matchMedia` directly:
 * code that does is code that breaks the prerender the day it runs at startup.
 */
@Injectable({ providedIn: 'root' })
export class BrowserEnvironmentService {
  /**
   * Private: a caller that held the document could reach `defaultView` and
   * every global behind it. What the application needs of it is a method
   * here, each with its server answer.
   */
  private readonly document = inject(DOCUMENT);
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
    onChange: (isMatching: boolean) => void,
  ): () => void {
    const list = this.mediaQuery(query);

    if (!list) {
      return () => {};
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
      return () => {};
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
      return () => {};
    }
    const id = view.requestAnimationFrame(callback);
    return () => {
      view.cancelAnimationFrame(id);
    };
  }

  /**
   * Whether the primary pointer cannot hover (a touch screen): there, a
   * target that reveals on hover needs a first touch to reveal. `false` on
   * the server, where nothing is touched.
   */
  public cannotHover(): boolean {
    return this.matches('(hover: none)', false);
  }

  /** The device pixel ratio, capped by the caller; 1 on the server. */
  public devicePixelRatio(): number {
    return this.view()?.devicePixelRatio || 1;
  }

  /** A monotonic clock in milliseconds, for frame deltas; 0 on the server. */
  public now(): number {
    return this.view()?.performance.now() ?? 0;
  }

  /** Whether the tab is hidden. `true` on the server: nothing is on show. */
  public isHidden(): boolean {
    return this.isBrowser ? this.document.hidden : true;
  }

  /**
   * Calls back when the tab is hidden or shown again, and returns the
   * function that stops listening. Inert on the server.
   */
  public watchVisibility(onChange: (isHidden: boolean) => void): () => void {
    if (!this.isBrowser) {
      return () => {};
    }
    const document = this.document;
    const listener = (): void => {
      onChange(document.hidden);
    };
    document.addEventListener('visibilitychange', listener);
    return () => {
      document.removeEventListener('visibilitychange', listener);
    };
  }

  /**
   * Calls back when an element changes size, and returns the function that
   * stops observing. Inert on the server and where `ResizeObserver` lacks.
   */
  public observeResize(element: Element, onResize: () => void): () => void {
    const view = this.globals();
    if (!view || typeof view.ResizeObserver !== 'function') {
      return () => {};
    }
    const observer = new view.ResizeObserver(() => {
      onResize();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }

  /**
   * Calls back when an element enters or leaves the viewport, past
   * `threshold` of its area, and returns the function that stops observing.
   * Inert on the server and where `IntersectionObserver` lacks.
   */
  public observeIntersection(
    element: Element,
    threshold: number,
    onChange: (isIntersecting: boolean) => void,
  ): () => void {
    const view = this.globals();
    if (!view || typeof view.IntersectionObserver !== 'function') {
      return () => {};
    }
    const observer = new view.IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          onChange(entry.isIntersecting);
        }
      },
      { threshold },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }

  /**
   * A canvas's 2D context, or `null` on the server and wherever the browser
   * refuses one (blocked, out of memory, not implemented): the caller falls
   * back instead of throwing.
   */
  public context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    if (!this.isBrowser) {
      return null;
    }
    try {
      return canvas.getContext('2d');
    } catch {
      return null;
    }
  }

  /**
   * The computed value of a CSS property on an element, trimmed; empty on
   * the server, where nothing is laid out.
   */
  public computedStyle(element: Element, property: string): string {
    const view = this.view();
    return view
      ? view.getComputedStyle(element).getPropertyValue(property).trim()
      : '';
  }

  /**
   * A custom property of the document's root (a design token), trimmed;
   * empty on the server, where nothing is laid out.
   */
  public rootStyle(property: string): string {
    return this.computedStyle(this.document.documentElement, property);
  }

  /**
   * A duration token of the document's root (`--arrival-at: 8700ms`), in
   * milliseconds; `null` on the server, or when the token is missing or not
   * a duration. The CSS is the one place a choreography's timing is written:
   * without a script it plays alone, and the script reads the same value.
   */
  public rootDuration(property: string): number | null {
    const match = /^(\d+(?:\.\d+)?)(ms|s)$/.exec(this.rootStyle(property));
    if (!match?.[1]) {
      return null;
    }
    const value = Number.parseFloat(match[1]);
    return match[2] === 's' ? value * 1000 : value;
  }

  /**
   * Calls back once, at the reader's first gesture or after `timeoutMs`,
   * whichever comes first, and returns the function that cancels both.
   * Inert on the server, where no one is there.
   */
  public firstGesture(timeoutMs: number, callback: () => void): () => void {
    if (!this.isBrowser) {
      return () => {};
    }
    const stops: (() => void)[] = [];
    const cancel = (): void => {
      for (const stop of stops.splice(0)) {
        stop();
      }
    };
    const once = (): void => {
      cancel();
      callback();
    };
    const timer = setTimeout(once, timeoutMs);
    stops.push(
      ...INTENT.map((type) => this.listen(type, once, { passive: true })),
      () => {
        clearTimeout(timer);
      },
    );
    return cancel;
  }

  /**
   * The cursor the whole page shows, whatever it hovers, as a drag needs;
   * an empty string gives each element its own back. Inert on the server.
   */
  public setCursor(cursor: string): void {
    if (this.isBrowser) {
      this.document.body.style.cursor = cursor;
    }
  }

  /** Calls back once the web fonts have loaded. Inert on the server. */
  public whenFontsReady(callback: () => void): void {
    if (!this.isBrowser) {
      return;
    }
    // jsdom and old engines have no font loading API: nothing to wait for.
    const fonts = this.document.fonts as FontFaceSet | undefined;
    if (!fonts) {
      return;
    }
    void fonts.ready.then(() => {
      callback();
    });
  }

  private view(): Window | null {
    return this.isBrowser ? this.document.defaultView : null;
  }

  /** The window with its constructors (`ResizeObserver`…), which `Window` omits. */
  private globals(): (Window & typeof globalThis) | null {
    const view = this.view();
    return view ? (view as Window & typeof globalThis) : null;
  }

  private matches(query: string, isServerMatch: boolean): boolean {
    return this.mediaQuery(query)?.matches ?? isServerMatch;
  }

  private mediaQuery(query: string): MediaQueryList | null {
    const view = this.view();

    return typeof view?.matchMedia === 'function'
      ? view.matchMedia(query)
      : null;
  }
}
