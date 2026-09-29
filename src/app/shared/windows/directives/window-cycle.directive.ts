import { DestroyRef, Directive, inject } from '@angular/core';
import { BrowserWindowService } from '@app/core/services';
import { cycleTarget, isTypingTarget } from '../rules/window-cycle.rules';
import { WindowStackService } from '../services/window-stack.service';

const TITLE_SELECTOR = '[data-window-title]';

@Directive({ selector: '[appWindowCycle]' })
export class WindowCycleDirective {
  private readonly stack = inject(WindowStackService);
  private readonly browserWindow = inject(BrowserWindowService);

  constructor() {
    const stop = this.browserWindow.on('keydown', (event) => {
      this.onKeydown(event);
    });
    inject(DestroyRef).onDestroy(stop);
  }

  private onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'F6' || isTypingTarget(event.target)) {
      return;
    }
    const target = cycleTarget(
      this.stack.shownFrontToBack(),
      event.shiftKey ? -1 : 1,
    );
    const title = target?.querySelector<HTMLElement>(TITLE_SELECTOR);
    if (!title) {
      return;
    }
    event.preventDefault();
    title.focus({ preventScroll: true });
  }
}
