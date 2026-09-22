import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WindowComponent } from '@shared/ui/window';

/**
 * An address that leads nowhere, in the smallest window: it says so and
 * leads back to the index. Never a dead end.
 */
@Component({
  selector: 'app-not-found-window',
  imports: [RouterLink, WindowComponent],
  templateUrl: './not-found-window.component.html',
  styleUrl: './not-found-window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundWindowComponent {
  public readonly closed = output();
}
