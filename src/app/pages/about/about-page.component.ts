import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StationManager } from '@app/features/station/states';

/**
 * The address of "about", and nothing else: the window it opens is rendered by
 * the station, so a pinned one outlives the route. Declared in the
 * constructor, which runs when the outlet activates, before the station's
 * view is checked: the first client render sees what the server rendered.
 */
@Component({
  selector: 'app-about-page',
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'page' },
})
export class AboutPageComponent {
  constructor() {
    inject(StationManager).navigated('about');
  }
}
