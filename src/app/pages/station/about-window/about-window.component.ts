import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { twoDigits } from '@app/core/helpers';
import { LINKS } from '@app/features/common';
import { PAGES_TEXTS } from '@app/i18n';
import { SegmentedComponent } from '@shared/ui/components';
import { SegmentedItem } from '@shared/ui/models';
import { WindowComponent } from '@shared/ui/components';
import { ViewHeadingDirective } from '@shared/ui/directives';

/**
 * Four parts, in the order of the questions a recruiter asks: who is it, can
 * he do it, how does he work, where does he come from. The words of each are
 * in the catalogue (`pages.about`), keyed by these names.
 */
const PARTS = ['profile', 'skills', 'method', 'path'] as const;

/**
 * "About", one part at a time, like the approaches of a sheet: the same
 * selector at the top, the same footer moving the reading on. The reader
 * learns the window once.
 */
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutWindowComponent {
  public readonly pinned = input(false);
  /**
   * The part on show, from 0; the station holds it, the constellations read
   * it. Out of range reads as the first.
   */
  public readonly part = input(0);

  public readonly pinToggled = output();
  public readonly closed = output();
  public readonly partChange = output<number>();

  protected readonly texts = inject(PAGES_TEXTS);
  protected readonly links = inject(LINKS);

  protected readonly about = computed(() => this.texts().about);
  protected readonly domains = computed(() =>
    this.about().skills.domains.map((domain, index) => ({
      ...domain,
      number: twoDigits(index + 1),
    })),
  );

  private readonly window = viewChild(WindowComponent);

  private readonly index = computed(() => {
    const part = this.part();
    return Number.isInteger(part) && part >= 0 && part < PARTS.length
      ? part
      : 0;
  });
  /** The part on show: its key, for the template's switch, and its words. */
  protected readonly current = computed(() => {
    const key = PARTS[this.index()] ?? 'profile';
    return { key, ...this.about()[key] };
  });

  /**
   * A heading mounted whatever the part: without it three views out of four
   * had no level one, and the arriving focus had no target.
   */
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

  constructor() {
    // A new part starts at its top; the first run is the arrival.
    let isFirst = true;
    effect(() => {
      this.part();
      if (isFirst) {
        isFirst = false;
        return;
      }
      untracked(() => this.window()?.scrollBodyTo(0));
    });
  }

  protected advance(): void {
    const next = this.next();
    if (next) {
      this.partChange.emit(next.index);
    }
  }
}
