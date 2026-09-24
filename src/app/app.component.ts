import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PAGES_TEXTS } from './i18n';
import { ObservatoryPageComponent } from './pages/observatory/observatory-page.component';
import { OBSERVATORY_IDS } from './features/observatory/models/observatory-ids.model';

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
