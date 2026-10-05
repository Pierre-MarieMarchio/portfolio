import { inject, Service } from '@angular/core';
import { createEffect } from 'ngx-statewise';
import { LINKS } from '@app/features/common';
import {
  observatoryEscaped,
  observatoryPreviewClosed,
  observatorySelected,
  observatorySteppedBack,
  observatoryWindowClosed,
} from './observatory.action';
import { Router } from '@angular/router';
import { SessionHistoryService } from '@app/core/services';
import { ObservatoryState } from './observatory.state';
import { closeTargetOf, ParentView, stepBack } from '../../rules/view.rules';

@Service()
export class ObservatoryEffect {
  private readonly history = inject(SessionHistoryService);
  private readonly router = inject(Router);
  private readonly state = inject(ObservatoryState);
  private readonly links = inject(LINKS);

  public readonly closeEffect = createEffect(
    observatoryWindowClosed,
    (window) => {
      const target = closeTargetOf(window, this.state.view());
      return target === null ? undefined : this.go(target);
    },
  );

  public readonly escapeEffect = createEffect(observatoryEscaped, () =>
    this.stepBack(),
  );

  public readonly stepBackEffect = createEffect(observatorySteppedBack, () =>
    this.stepBack(),
  );

  private stepBack() {
    const step = stepBack({
      view: this.state.view(),
      selection: this.state.selected(),
      preview: this.state.preview(),
    });
    switch (step) {
      case 'deselect': {
        return observatorySelected(null);
      }
      case 'close-preview': {
        return observatoryPreviewClosed();
      }
      case null: {
        return;
      }
    }
  }

  private async go(view: ParentView): Promise<undefined> {
    const parent = view === 'home' ? this.links.home() : this.links.index();
    if (!this.history.backTo(parent)) {
      await this.router.navigateByUrl(parent, { replaceUrl: true });
    }
    return undefined;
  }
}
