import { DestroyRef, effect, inject, Service, untracked } from '@angular/core';
import { Router } from '@angular/router';
import {
  BrowserWindowService,
  SessionHistoryService,
} from '@app/core/services';
import { LINKS } from '@app/features/common';
import { ObservatoryManager } from '@app/features/observatory/states';
import { tabOf } from '../rules';
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
            this.observatory.openPreview(this.parked);
            this.parked = null;
          }
        });
      }
    });
    inject(DestroyRef).onDestroy(stopClicks);
  }

  public choose(address: string): void {
    if (!this.homeSheet.isPhone()) {
      void this.router.navigateByUrl(address);
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
      this.parked = this.observatory.preview();
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
