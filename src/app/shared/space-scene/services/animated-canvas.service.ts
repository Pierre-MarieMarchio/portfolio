import { inject, Injectable } from '@angular/core';
import {
  BrowserWindowService,
  CanvasContextsService,
  ClockService,
  DocumentStylesService,
  ElementObserverService,
  MediaPreferencesService,
  PageVisibilityService,
} from '@app/core/services';

@Injectable({ providedIn: 'root' })
export class AnimatedCanvasService {
  private readonly contexts = inject(CanvasContextsService);
  private readonly clock = inject(ClockService);
  private readonly visibility = inject(PageVisibilityService);
  private readonly media = inject(MediaPreferencesService);
  private readonly styles = inject(DocumentStylesService);
  private readonly observer = inject(ElementObserverService);
  private readonly browserWindow = inject(BrowserWindowService);

  public context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    return this.contexts.context2d(canvas);
  }

  public pixelRatio(): number {
    return this.contexts.pixelRatio();
  }

  public nextFrame(fn: (time: number) => void): () => void {
    return this.clock.nextFrame(fn);
  }

  public now(): number {
    return this.clock.now();
  }

  public isHidden(): boolean {
    return this.visibility.isHidden();
  }

  public watchHidden(handler: (isHidden: boolean) => void): () => void {
    return this.visibility.watch(handler);
  }

  public reducedMotion(): boolean {
    return this.media.reducedMotion();
  }

  public watchMedia(
    query: string,
    handler: (isMatching: boolean) => void,
  ): () => void {
    return this.media.watch(query, handler);
  }

  public token(name: string, el?: Element): string {
    return this.styles.token(name, el);
  }

  public fontsReady(fn: () => void): void {
    this.styles.fontsReady(fn);
  }

  public onResize(el: Element, fn: () => void): () => void {
    return this.observer.onResize(el, fn);
  }

  public onVisible(
    el: Element,
    threshold: number,
    fn: (isVisible: boolean) => void,
  ): () => void {
    return this.observer.onVisible(el, threshold, fn);
  }

  public windowSize(): { width: number; height: number } | null {
    return this.browserWindow.size();
  }

  public onWindow<K extends keyof WindowEventMap>(
    type: K,
    handler: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): () => void {
    return this.browserWindow.on(type, handler, options);
  }
}
