import { Component, inject, input } from '@angular/core';
import { DESKTOP_TEXTS } from '../../ports/desktop-texts.port';
import { Entrance } from '@shared/ui/models';
import { ViewHeadingDirective } from '@shared/ui/directives';
import { DESKTOP_IDS } from '../../models/desktop-ids.model';

/**
 * The home page's title, top left: the name, and the trade as the page's
 * heading. It arrives with the rest of the home page (see `Arrival`), held
 * by its opacity alone: it takes no pointer, and it keeps the landing focus.
 */
@Component({
  selector: 'app-home-title',
  imports: [ViewHeadingDirective],
  templateUrl: './home-title.component.html',
  styleUrl: './home-title.component.scss',
  host: { '[attr.data-arrival]': 'arrival()' },
})
export class HomeTitleComponent {
  public readonly arrival = input<Entrance>('timed');

  protected readonly headingId = DESKTOP_IDS.homeTitle;
  protected readonly texts = inject(DESKTOP_TEXTS);
}
