import { DestroyRef, effect, inject, Service, untracked } from '@angular/core';
import {
  NavigationSkipped,
  NavigationSkippedCode,
  Router,
} from '@angular/router';
import {
  BrowserWindowService,
  SessionHistoryService,
} from '@app/core/services';
import type { MinimizableWindow } from '../models';
import { LINKS } from '@app/features/common';
import { ObservatoryManager } from '@app/features/observatory/states';
import { TABS, tabOf, tabOfWindow, windowsOfTab } from '../rules';
import { parentOf, windowOf } from '../rules/view.rules';
import { HomeSheetService } from './home-sheet.service';
import { ViewWindowsService } from './view-windows.service';

@Service({ autoProvided: false })
export class TabNavigationService {
  private readonly observatory = inject(ObservatoryManager);
  private readonly links = inject(LINKS);
  private readonly homeSheet = inject(HomeSheetService);
  private readonly windows = inject(ViewWindowsService);
  private readonly history = inject(SessionHistoryService);
  private readonly router = inject(Router);

  private parked: string | null = null;
  private isParkedPosed = false;

  constructor() {
    const stopClicks = inject(BrowserWindowService).on(
      'click',
      () => {
        this.keepHomeBelow();
      },
      { capture: true },
    );
    effect(() => {
      if (this.homeSheet.isShown()) {
        untracked(() => {
          if (this.parked !== null) {
            if (this.isParkedPosed) {
              this.observatory.openPreview(this.parked);
            } else {
              this.observatory.hover(this.parked);
            }
            this.parked = null;
          }
        });
      }
    });
    const skips = this.router.events.subscribe((event) => {
      if (
        event instanceof NavigationSkipped &&
        event.code === NavigationSkippedCode.IgnoredSameUrlNavigation
      ) {
        this.restoreCurrentWindow();
      }
    });
    inject(DestroyRef).onDestroy(() => {
      stopClicks();
      skips.unsubscribe();
    });
  }

  public choose(address: string): void {
    if (!this.homeSheet.isPhone()) {
      this.chooseOnDesktop(address);
      return;
    }
    const view = this.observatory.view();
    if (address === this.links[tabOf(view)]()) {
      this.retouch();
    } else if (address === this.links.home()) {
      const position = this.history.position();
      if (position) {
        this.history.back(position);
      } else {
        this.open(address);
      }
    } else {
      const resume = this.observatory.resume();
      this.open(
        address === this.links.index() && resume
          ? this.links.sheet(resume.slug)
          : address,
      );
    }
  }

  public minimize(
    window: MinimizableWindow,
    bar: { focusRoute(route: string): void },
  ): void {
    bar.focusRoute(this.links[tabOfWindow(window)]());
    this.observatory.minimize(window);
  }

  public ascendToIndex(): void {
    void this.observatory.close('sheet');
  }

  private chooseOnDesktop(address: string): void {
    const tab = TABS.find((each) => this.links[each]() === address);
    const minimized = this.observatory.minimized();
    const restored = (tab ? windowsOfTab(tab) : []).filter(
      (window) => minimized[window],
    );
    if (restored.length > 0) {
      this.bringBack(restored);
      if (tab === tabOf(this.observatory.view())) {
        return;
      }
    }
    void this.router.navigateByUrl(address);
  }

  private restoreCurrentWindow(): void {
    const window = windowOf(this.observatory.view());
    if (
      this.homeSheet.isPhone() ||
      window === null ||
      window === 'preview' ||
      !this.observatory.minimized()[window]
    ) {
      return;
    }
    this.bringBack([window]);
  }

  private bringBack(windows: readonly MinimizableWindow[]): void {
    this.observatory.restore(windows);
    for (const window of windows) {
      this.windows.bringToFront(window);
    }
  }

  private open(address: string): void {
    void this.router.navigateByUrl(address, {
      replaceUrl: this.observatory.view() !== 'home',
    });
  }

  private keepHomeBelow(): void {
    const view = this.observatory.view();
    if (!this.homeSheet.isPhone()) {
      return;
    }
    if (view === 'home') {
      this.isParkedPosed = this.observatory.preview() !== null;
      this.parked = this.observatory.preview() ?? this.observatory.hovered();
    } else if (this.history.position() === 0) {
      const state = this.history.state();
      this.history.replace(this.links.home());
      if (parentOf(view) === 'index') {
        this.history.push(null, this.links.index());
      }
      this.history.push(state, this.router.url);
    }
  }

  private retouch(): void {
    const view = this.observatory.view();
    if (view === 'home') {
      this.homeSheet.settle('half');
    } else if (
      !this.windows.scrollToTop(windowOf(view)) &&
      parentOf(view) === 'index'
    ) {
      this.open(this.links.index());
    }
  }
}
