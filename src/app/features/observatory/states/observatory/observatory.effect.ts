import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { createEffect } from 'ngx-statewise';
import { LINKS } from '@app/features/common';
import {
  observatoryEscaped,
  observatoryPreviewClosed,
  observatorySelected,
  observatorySteppedBack,
  observatoryWindowClosed,
} from './observatory.action';
import { ObservatoryState } from './observatory.state';
import {
  ParentView,
  parentOf,
  stepBack,
  StepBackGesture,
  windowOf,
} from '../../rules/view.rules';

@Service()
export class ObservatoryEffect {
  private readonly router = inject(Router);
  private readonly state = inject(ObservatoryState);
  private readonly links = inject(LINKS);

  public readonly closeEffect = createEffect(
    observatoryWindowClosed,
    (window) => {
      const view = this.state.view();
      const parent = parentOf(view);
      return parent !== null && windowOf(view) === window
        ? this.go(parent)
        : undefined;
    },
  );

  public readonly escapeEffect = createEffect(observatoryEscaped, () =>
    this.stepBack('escape'),
  );

  public readonly stepBackEffect = createEffect(observatorySteppedBack, () =>
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
        return observatorySelected(null);
      }
      case 'close-preview': {
        return observatoryPreviewClosed();
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
