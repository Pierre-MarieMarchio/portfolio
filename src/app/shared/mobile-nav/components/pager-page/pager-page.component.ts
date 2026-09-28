import { Component, computed, inject, signal } from '@angular/core';
import { MOBILE_NAV_TEXTS } from '../../ports/mobile-nav-texts.port';

interface PagePlace {
  readonly index: number;
  readonly count: number;
  readonly isCurrent: boolean;
}

@Component({
  selector: 'app-pager-page',
  templateUrl: './pager-page.component.html',
  styleUrl: './pager-page.component.scss',
  host: {
    role: 'group',
    '[attr.aria-label]': 'label()',
    '[attr.inert]': 'isCurrent() ? null : ""',
    '[attr.data-current]': 'isCurrent() || null',
  },
})
export class PagerPageComponent {
  private readonly texts = inject(MOBILE_NAV_TEXTS);
  private readonly placement = signal<PagePlace>({
    index: 0,
    count: 1,
    isCurrent: true,
  });

  protected readonly isCurrent = computed(() => this.placement().isCurrent);
  protected readonly label = computed(() => {
    const { index, count } = this.placement();
    return this.texts().pageOf(index + 1, count);
  });

  public place(index: number, count: number, isCurrent: boolean): void {
    this.placement.set({ index, count, isCurrent });
  }
}
