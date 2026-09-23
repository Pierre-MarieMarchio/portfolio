import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PAGES_TEXTS } from './i18n';
import { DesktopPageComponent } from './pages/desktop/desktop-page.component';
import { DESKTOP_IDS } from './features/desktop/models/desktop-ids.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DesktopPageComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly mainId = DESKTOP_IDS.main;
  protected readonly texts = inject(PAGES_TEXTS);
}
