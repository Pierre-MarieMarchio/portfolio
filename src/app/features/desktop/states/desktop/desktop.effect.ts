import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { createEffect } from 'ngx-statewise';
import { LINKS } from '@app/features/common';
import { DesktopWindow } from '../../models';
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
} from '../../rules/view.rules';

/**
 * The station's way back, read off `stepBack`: every step is one notch,
 * never more, and never a dead end.
 *
 * The router lives here, at the boundary: the updater only records where
 * the reader is, and a navigation it caused comes back as `syncRoute`.
 */
@Injectable({ providedIn: 'root' })
export class DesktopEffect {
  private readonly router = inject(Router);
  private readonly state = inject(DesktopState);
  private readonly links = inject(LINKS);

  /** Closing the window of the view on show leaves for the view's parent. */
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
      selection: this.state.selection(),
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

  /** To a view's address, in the reader's language. */
  private async go(view: ParentView): Promise<undefined> {
    await this.router.navigateByUrl(
      view === 'home' ? this.links.home() : this.links.index(),
    );
    return undefined;
  }
}

/** The window a view shows its content in; the home page has none. */
function windowOf(view: string): DesktopWindow | null {
  switch (view) {
    case 'index':
    case 'about':
    case 'sheet': {
      return view;
    }
    case 'not-found': {
      return 'sheet';
    }
    default: {
      return null;
    }
  }
}
