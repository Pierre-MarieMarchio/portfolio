import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StationManager } from '@app/features/station/states';

/**
 * The address of the home page, and nothing else: the window it opens is rendered by
 * the station, so a pinned one outlives the route. Declared in the
 * constructor, which runs when the outlet activates, before the station's
 * view is checked: the first client render sees what the server rendered.
 */
@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'page' },
})
export class HomePageComponent {
  constructor() {
    inject(StationManager).navigated('home');
  }
}
