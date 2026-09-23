import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { PAGES_TEXTS } from '@app/i18n';
import { Arrival } from '@shared/ui/arrival';
import { LandingHeadingDirective } from '@shared/ui/landing-focus';
import { STATION_IDS } from '../station.ids';

/**
 * The home page's title, top left: the name, and the trade as the page's
 * heading. It arrives with the rest of the home page (see `Arrival`), held
 * by its opacity alone: it takes no pointer, and it keeps the landing focus.
 */
@Component({
  selector: 'app-home-title',
  imports: [LandingHeadingDirective],
  templateUrl: './home-title.component.html',
  styleUrl: './home-title.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-arrival]': 'arrival()' },
})
export class HomeTitleComponent {
  public readonly arrival = input<Arrival>('timed');

  protected readonly headingId = STATION_IDS.homeTitle;
  protected readonly texts = inject(PAGES_TEXTS);
}
