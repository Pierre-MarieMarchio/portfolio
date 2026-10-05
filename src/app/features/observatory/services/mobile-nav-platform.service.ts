import { inject, Service } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import {
  BrowserWindowService,
  ClockService,
  DisplayFormatService,
  ElementObserverService,
  HapticsService,
  MediaPreferencesService,
  SessionHistoryService,
} from '@app/core/services';
import { MobileNavPlatform } from '@shared/mobile-nav/ports';

@Service({ autoProvided: false })
export class MobileNavPlatformService implements MobileNavPlatform {
  private readonly display = inject(DisplayFormatService);
  private readonly media = inject(MediaPreferencesService);
  private readonly clock = inject(ClockService);
  private readonly browserWindow = inject(BrowserWindowService);
  private readonly observer = inject(ElementObserverService);
  private readonly sessionHistory = inject(SessionHistoryService);
  private readonly haptics = inject(HapticsService);
  private readonly router = inject(Router);

  public isCompact(): boolean {
    return this.display.format() === 'phone';
  }

  public reducedMotion(): boolean {
    return this.media.reducedMotion();
  }

  public nextFrame(fn: () => void): () => void {
    return this.clock.nextFrame(() => {
      fn();
    });
  }

  public after(ms: number, fn: () => void): () => void {
    return this.clock.after(ms, fn);
  }

  public hasScrollEnd(): boolean {
    return this.browserWindow.supportsEvent('scrollend');
  }

  public hasSnapChanging(): boolean {
    return this.observer.hasSnapChanging();
  }

  public onResize(element: Element, fn: () => void): () => void {
    return this.observer.onResize(element, fn);
  }

  public onVisible(
    element: Element,
    fn: (isVisible: boolean) => void,
  ): () => void {
    return this.observer.onVisible(element, 0, fn);
  }

  public onSnapChanging(
    element: Element,
    fn: (target: Element | null) => void,
  ): () => void {
    return this.observer.onSnapChanging(element, fn);
  }

  public whenStill(element: Element): Promise<void> {
    return this.observer.whenStill(element);
  }

  public closesOnBack(): boolean {
    return this.sessionHistory.hasCloseWatcher();
  }

  public watchClose(fn: () => void): () => void {
    return this.sessionHistory.watchClose(fn);
  }

  public historyState(): unknown {
    return this.sessionHistory.state();
  }

  public pushHistory(state: unknown): void {
    this.sessionHistory.push(state);
  }

  public historyBack(steps: number): void {
    this.sessionHistory.back(steps);
  }

  public onHistoryPop(fn: (state: unknown) => void): () => void {
    return this.sessionHistory.onPop(fn);
  }

  public vibrate(ms: number): void {
    this.haptics.vibrate(ms);
  }

  public onLeave(fn: () => void): () => void {
    const watching = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        fn();
      }
    });
    return () => {
      watching.unsubscribe();
    };
  }
}
