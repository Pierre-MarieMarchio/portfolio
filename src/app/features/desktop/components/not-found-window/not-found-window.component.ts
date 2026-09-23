import { Component, computed, inject, input, output } from '@angular/core';
import { twoDigits } from '@app/core/helpers';
import { LINKS } from '@app/features/common';
import { DESKTOP_TEXTS } from '../../ports/desktop-texts.port';
import { RouterLink } from '@angular/router';
import { WindowComponent } from '@shared/windows/components';
import { ViewHeadingDirective } from '@shared/ui/directives';

/**
 * An address that leads nowhere, in the smallest window: it says so and
 * leads back to the index. Never a dead end.
 */
@Component({
  selector: 'app-not-found-window',
  imports: [ViewHeadingDirective, RouterLink, WindowComponent],
  templateUrl: './not-found-window.component.html',
  styleUrl: './not-found-window.component.scss',
})
export class NotFoundWindowComponent {
  /** How many sheets the index holds: the sentence counts them. */
  public readonly total = input.required<number>();

  public readonly closed = output();

  protected readonly count = computed(() => twoDigits(this.total()));
  protected readonly texts = inject(DESKTOP_TEXTS);
  protected readonly links = inject(LINKS);
}
