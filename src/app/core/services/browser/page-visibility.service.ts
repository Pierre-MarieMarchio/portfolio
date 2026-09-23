import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, PLATFORM_ID, Service } from '@angular/core';

@Service()
export class PageVisibilityService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  public isHidden(): boolean {
    return this.isBrowser ? this.document.hidden : true;
  }

  public watch(handler: (isHidden: boolean) => void): () => void {
    if (!this.isBrowser) {
      return () => {};
    }
    const document = this.document;
    const listener = (): void => {
      handler(document.hidden);
    };
    document.addEventListener('visibilitychange', listener);
    return () => {
      document.removeEventListener('visibilitychange', listener);
    };
  }
}
