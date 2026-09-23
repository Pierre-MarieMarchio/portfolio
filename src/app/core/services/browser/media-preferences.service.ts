import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MediaPreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  public reducedMotion(): boolean {
    return this.matches('(prefers-reduced-motion: reduce)', true);
  }

  public cannotHover(): boolean {
    return this.matches('(hover: none)', false);
  }

  public watch(
    query: string,
    handler: (isMatching: boolean) => void,
  ): () => void {
    const list = this.mediaQuery(query);
    if (!list) {
      return () => {};
    }
    const listener = (event: MediaQueryListEvent): void => {
      handler(event.matches);
    };
    list.addEventListener('change', listener);
    return () => {
      list.removeEventListener('change', listener);
    };
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

  private view(): Window | null {
    return this.isBrowser ? this.document.defaultView : null;
  }
}
