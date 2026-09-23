import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, PLATFORM_ID, Service } from '@angular/core';

@Service()
export class CanvasContextsService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

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

  public pixelRatio(): number {
    const view = this.isBrowser ? this.document.defaultView : null;
    return view?.devicePixelRatio || 1;
  }
}
