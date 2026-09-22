import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationItem } from './navigation-item.model';

/**
 * The page bar, top right: the language switch and the pages. It knows no
 * feature: what it lists and which entry is current arrive as inputs, so a
 * sheet can keep "Projets" lit (a sheet is a zoom of the index).
 *
 * Links, not the mockup's pressed buttons: the addresses are real paths, so
 * each entry stays crawlable, prerendered and openable in a new tab.
 */
@Component({
  selector: 'app-page-bar',
  imports: [RouterLink],
  templateUrl: './page-bar.component.html',
  styleUrl: './page-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageBarComponent {
  public readonly items = input.required<readonly NavigationItem[]>();
  /** The route of the entry to light, or `null` for none. */
  public readonly current = input<string | null>(null);
  /** The English texts were asked for: say they do not exist yet. */
  public readonly englishAsked = input(false);

  public readonly englishRequested = output();
}
