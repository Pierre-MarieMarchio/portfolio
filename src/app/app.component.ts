import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PAGES_TEXTS } from '@app/i18n';
import { ObservatoryPageComponent } from '@app/pages/observatory';
import { OBSERVATORY_IDS } from '@app/features/observatory/models';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ObservatoryPageComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly mainId = OBSERVATORY_IDS.main;
  protected readonly texts = inject(PAGES_TEXTS);
}
