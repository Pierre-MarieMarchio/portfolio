import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { createEffect } from 'ngx-statewise';
import { LINKS } from '@app/features/common';
import {
  desktopEscaped,
  desktopPreviewClosed,
  desktopSelected,
  desktopSteppedBack,
  desktopWindowClosed,
} from './desktop.action';
import { DesktopState } from './desktop.state';
import {
  ParentView,
  parentOf,
  stepBack,
  StepBackGesture,
  windowOf,
} from '../../rules/view.rules';

@Service()
export class DesktopEffect {
  private readonly router = inject(Router);
  private readonly state = inject(DesktopState);
  private readonly links = inject(LINKS);

  public readonly closeEffect = createEffect(desktopWindowClosed, (window) => {
    const view = this.state.view();
    const parent = parentOf(view);
    return parent !== null && windowOf(view) === window
      ? this.go(parent)
      : undefined;
  });

  public readonly escapeEffect = createEffect(desktopEscaped, () =>
    this.stepBack('escape'),
  );

  public readonly stepBackEffect = createEffect(desktopSteppedBack, () =>
    this.stepBack('void'),
  );

  private stepBack(gesture: StepBackGesture) {
    const step = stepBack(gesture, {
      view: this.state.view(),
      selection: this.state.selected(),
      preview: this.state.preview(),
    });
    switch (step?.kind) {
      case 'deselect': {
        return desktopSelected(null);
      }
      case 'close-preview': {
        return desktopPreviewClosed();
      }
      case 'navigate': {
        return this.go(step.to);
      }
      case undefined: {
        return;
      }
    }
  }

  private async go(view: ParentView): Promise<undefined> {
    await this.router.navigateByUrl(
      view === 'home' ? this.links.home() : this.links.index(),
    );
    return undefined;
  }
}
