import { Component, inject, input, output } from '@angular/core';
import { MOBILE_NAV_TEXTS } from '../../ports/mobile-nav-texts.port';

@Component({
  selector: 'app-pager-dots',
  templateUrl: './pager-dots.component.html',
  styleUrl: './pager-dots.component.scss',
})
export class PagerDotsComponent {
  protected readonly texts = inject(MOBILE_NAV_TEXTS);

  public readonly count = input.required<number>();
  public readonly current = input.required<number>();

  public readonly chosen = output<number>();

  protected readonly places = (count: number): number[] =>
    Array.from({ length: count }, (_, index) => index);
}
