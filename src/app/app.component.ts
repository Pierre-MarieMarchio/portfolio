import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StationComponent } from './pages/station/station.component';
import { STATION_IDS } from './pages/station/station.ids';

/**
 * Mounts the station, once, above the router: whatever must survive a
 * navigation (the object, the chrome, a pinned window) lives in it.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, StationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  /** The skip link leads to the station's content. */
  protected readonly mainId = STATION_IDS.main;
}
