import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StationView } from '@app/features/station/models';
import { StationManager } from '@app/features/station/states';

/** What a route declares for its marker: the view it is the address of. */
export interface ViewMarkerData {
  readonly view: Exclude<StationView, 'sheet'>;
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
  selector: 'app-view-marker',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewMarkerComponent {
  constructor() {
    const { view } = inject(ActivatedRoute).snapshot.data as ViewMarkerData;
    inject(StationManager).syncRoute(view);
  }
}
