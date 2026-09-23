import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DesktopManager } from '@app/features/desktop/states';

/**
 * The address of a sheet. The sheet itself is rendered by the station; this
 * marker says which one. The tab is named by the route's resolver. Like
 * `ViewMarkerComponent`, it draws nothing.
 */
@Component({
  selector: 'app-project-detail-route',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailRouteComponent {
  /** Bound from `:slug` by `withComponentInputBinding()`. */
  public readonly slug = input.required<string>();

  constructor() {
    const station = inject(DesktopManager);

    // Declared at once, before the station's view is checked: inputs are not
    // bound yet, the snapshot already holds the slug.
    station.syncRoute(
      'sheet',
      inject(ActivatedRoute).snapshot.paramMap.get('slug'),
    );

    // From one sheet to the next the outlet keeps this component: the slug
    // input is what changes then.
    effect(() => {
      const slug = this.slug();
      untracked(() => {
        if (station.view() !== 'sheet' || station.slug() !== slug) {
          station.syncRoute('sheet', slug);
        }
      });
    });
  }
}
