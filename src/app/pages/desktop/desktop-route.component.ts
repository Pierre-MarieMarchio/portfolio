import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DesktopView } from '@app/features/desktop/models';
import { DesktopManager } from '@app/features/desktop/states';

export interface DesktopRouteData {
  readonly view: DesktopView;
}

@Component({
  selector: 'app-desktop-route',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopRouteComponent {
  public readonly slug = input<string | null>(null);

  constructor() {
    const desktop = inject(DesktopManager);
    const { snapshot } = inject(ActivatedRoute);
    const { view } = snapshot.data as DesktopRouteData;

    desktop.syncRoute(view, snapshot.paramMap.get('slug'));

    effect(() => {
      const slug = this.slug() ?? null;
      untracked(() => {
        if (desktop.view() !== view || desktop.slug() !== slug) {
          desktop.syncRoute(view, slug);
        }
      });
    });
  }
}
