import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LINKS } from '@app/features/common';
import { ObservatoryWindow } from '../../models';
import { OBSERVATORY_TEXTS } from '../../ports';
import { ObservatoryManager } from '../../states';

@Component({
  selector: 'app-observatory-dock',
  imports: [RouterLink],
  templateUrl: './observatory-dock.component.html',
  styleUrl: './observatory-dock.component.scss',
})
export class ObservatoryDockComponent {
  private readonly station = inject(ObservatoryManager);
  private readonly links = inject(LINKS);
  protected readonly texts = inject(OBSERVATORY_TEXTS);

  protected readonly entries = computed(() =>
    this.station.docked().map((window) => ({
      window,
      label: this.texts().dock.windows[window],
      route: this.routeOf(window),
    })),
  );

  private routeOf(window: ObservatoryWindow): string {
    switch (window) {
      case 'about': {
        return this.links.about();
      }
      case 'index': {
        return this.links.index();
      }
      case 'sheet': {
        return this.links.sheet(this.station.lastSheet() ?? '');
      }
      case 'preview': {
        return this.links.home();
      }
    }
  }
}
