import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PAGES_TEXTS } from './i18n';
import { DesktopPageComponent } from './pages/desktop/desktop-page.component';
import { DESKTOP_IDS } from './features/desktop/models/desktop-ids.model';

/**
 * Mounts the station, once, above the router: whatever must survive a
 * navigation (the object, the chrome, a pinned window) lives in it.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DesktopPageComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  /** The skip link leads to the station's content. */
  protected readonly mainId = DESKTOP_IDS.main;
  protected readonly texts = inject(PAGES_TEXTS);
}
