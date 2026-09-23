import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SHARED_TEXTS } from '../../ports';
import { Entrance } from '../../models/entrance.model';
import { NavigationItem } from '../../models/navigation-item.model';

@Component({
  selector: 'app-main-nav',
  imports: [RouterLink],
  templateUrl: './main-nav.component.html',
  styleUrl: './main-nav.component.scss',
  host: { '[attr.data-arrival]': 'arrival()' },
})
export class MainNavComponent {
  public readonly items = input.required<readonly NavigationItem[]>();
  public readonly current = input<string | null>(null);
  public readonly arrival = input<Entrance>('timed');

  protected readonly texts = inject(SHARED_TEXTS);
}
