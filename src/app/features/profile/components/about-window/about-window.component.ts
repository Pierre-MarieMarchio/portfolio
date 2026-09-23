import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { twoDigits } from '@app/core/helpers';
import { LINKS } from '@app/features/common';
import { PROFILE_TEXTS } from '../../ports/profile-texts.port';
import { SegmentedComponent } from '@shared/ui/components';
import { SegmentedItem } from '@shared/ui/models';
import { WindowComponent } from '@shared/windows/components';
import { ViewHeadingDirective } from '@shared/ui/directives';

const PARTS = ['profile', 'skills', 'method', 'path'] as const;

@Component({
  selector: 'app-about-window',
  imports: [
    ViewHeadingDirective,
    RouterLink,
    SegmentedComponent,
    WindowComponent,
  ],
  templateUrl: './about-window.component.html',
  styleUrl: './about-window.component.scss',
})
export class AboutWindowComponent {
  public readonly pinned = input(false);
  public readonly part = input(0);

  public readonly pinToggled = output();
  public readonly closed = output();
  public readonly partChange = output<number>();

  protected readonly texts = inject(PROFILE_TEXTS);
  protected readonly links = inject(LINKS);

  protected readonly about = computed(() => this.texts().about);
  protected readonly domains = computed(() =>
    this.about().skills.domains.map((domain, index) => ({
      ...domain,
      number: twoDigits(index + 1),
    })),
  );

  private readonly index = computed(() => {
    const part = this.part();
    return Number.isInteger(part) && part >= 0 && part < PARTS.length
      ? part
      : 0;
  });
  protected readonly current = computed(() => {
    const key = PARTS[this.index()] ?? 'profile';
    return { key, ...this.about()[key] };
  });

  protected readonly heading = computed(() =>
    this.about().title(this.current().title),
  );

  protected readonly parts = computed<readonly SegmentedItem<number>[]>(() =>
    PARTS.map((key, index) => ({
      value: index,
      label: this.about()[key].label,
      active: index === this.index(),
      aria: this.about().goTo(this.about()[key].title),
    })),
  );

  protected readonly next = computed(() => {
    const index = this.index() + 1;
    const key = PARTS[index];
    return key ? { index, label: this.about()[key].label } : null;
  });

  protected advance(): void {
    const next = this.next();
    if (next) {
      this.partChange.emit(next.index);
    }
  }
}
