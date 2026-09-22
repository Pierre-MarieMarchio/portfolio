import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavigationItem } from './navigation-item.model';

/**
 * The site's header: a name that leads home, and the pages.
 *
 * It knows no feature and no page. What it lists arrives as an input, so the
 * same shell serves whatever `app.navigation.ts` declares, and whoever
 * composes it decides what it says.
 */
@Component({
  selector: 'app-nav-shell',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-shell.component.html',
  styleUrl: './nav-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavShellComponent {
  public readonly brand = input.required<string>();
  public readonly items = input.required<readonly NavigationItem[]>();
}
