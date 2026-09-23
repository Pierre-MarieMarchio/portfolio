import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StationManager } from '@app/features/station/states';

/**
 * The address of the index, and nothing else: the window it opens is rendered by
 * the station, so a pinned one outlives the route. Declared in the
 * constructor, which runs when the outlet activates, before the station's
 * view is checked: the first client render sees what the server rendered.
 */
@Component({
  selector: 'app-projects-page',
  templateUrl: './projects-page.component.html',
  styleUrl: './projects-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'page' },
})
export class ProjectsPageComponent {
  constructor() {
    inject(StationManager).navigated('index');
  }
}
