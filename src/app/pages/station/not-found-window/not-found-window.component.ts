import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { twoDigits } from '@app/core/utils/format.utils';
import { LINKS } from '@app/features/common';
import { PAGES_TEXTS } from '@app/i18n';
import { RouterLink } from '@angular/router';
import { WindowComponent } from '@shared/ui/window';
import { LandingHeadingDirective } from '@shared/ui/landing-focus';

/**
 * An address that leads nowhere, in the smallest window: it says so and
 * leads back to the index. Never a dead end.
 */
@Component({
  selector: 'app-not-found-window',
  imports: [LandingHeadingDirective, RouterLink, WindowComponent],
  templateUrl: './not-found-window.component.html',
  styleUrl: './not-found-window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundWindowComponent {
  /** How many sheets the index holds: the sentence counts them. */
  public readonly total = input.required<number>();

  public readonly closed = output();

  protected readonly count = computed(() => twoDigits(this.total()));
  protected readonly texts = inject(PAGES_TEXTS);
  protected readonly links = inject(LINKS);
}
