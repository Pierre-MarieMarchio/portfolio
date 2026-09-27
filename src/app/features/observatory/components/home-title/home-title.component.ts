import { Component, inject, input } from '@angular/core';
import { OBSERVATORY_TEXTS } from '../../ports/observatory-texts.port';
import { Entrance } from '@shared/ui/models';
import { ViewHeadingDirective } from '@shared/ui/directives';
import { OBSERVATORY_IDS } from '../../models/observatory-ids.model';

@Component({
  selector: 'app-home-title',
  imports: [ViewHeadingDirective],
  templateUrl: './home-title.component.html',
  styleUrl: './home-title.component.scss',
  host: { '[attr.data-arrival]': 'arrival()' },
})
export class HomeTitleComponent {
  public readonly arrival = input<Entrance>('timed');

  protected readonly headingId = OBSERVATORY_IDS.homeTitle;
  protected readonly texts = inject(OBSERVATORY_TEXTS);
}
