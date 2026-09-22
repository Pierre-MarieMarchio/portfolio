import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { navigationItems } from './app.navigation';
import { NavShellComponent } from '@shared/ui/nav-shell';

/**
 * Composes the shell around the routed page. It is the one component above
 * the router outlet, so whatever must survive a navigation lives here.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavShellComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly siteName = environment.SITE_NAME;
  protected readonly navigationItems = navigationItems;
}
