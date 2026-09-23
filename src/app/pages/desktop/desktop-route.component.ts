import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DesktopView } from '@app/features/desktop/models';
import { DesktopManager } from '@app/features/desktop/states';

/** What a route declares for its marker: the view it is the address of. */
export interface ViewMarkerData {
  readonly view: Exclude<DesktopView, 'sheet'>;
}

/**
 * The address of a view, and nothing else: the station renders the window,
 * so a pinned one outlives the route. One marker for every view but the
 * sheet, told which by its route's `data.view`. It declares the view in its
 * constructor, which runs when the outlet activates, before the station's
 * view is checked: the first client render sees what the server rendered.
 *
 * No template and no style: it draws nothing.
 */
@Component({
  selector: 'app-desktop-route',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopRouteComponent {
  constructor() {
    const { view } = inject(ActivatedRoute).snapshot.data as ViewMarkerData;
    inject(DesktopManager).syncRoute(view);
  }
}
