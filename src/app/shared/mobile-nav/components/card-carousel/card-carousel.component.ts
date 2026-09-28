import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { MOBILE_NAV_PLATFORM } from '../../ports/mobile-nav-platform.port';
import { MOBILE_NAV_TEXTS } from '../../ports/mobile-nav-texts.port';
import { cardAt, centredOffset } from '../../rules/carousel.rules';
import { clampPage, isAt } from '../../rules/pager.rules';

const SETTLE_MS = 120;

interface CardContext<T> {
  readonly $implicit: T;
  readonly index: number;
}

@Component({
  selector: 'app-card-carousel',
  imports: [NgTemplateOutlet],
  templateUrl: './card-carousel.component.html',
  styleUrl: './card-carousel.component.scss',
  host: {
    role: 'region',
    '[attr.aria-label]': 'label()',
  },
})
export class CardCarouselComponent<T> {
  private readonly platform = inject(MOBILE_NAV_PLATFORM);
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly texts = inject(MOBILE_NAV_TEXTS);

  public readonly items = input.required<readonly T[]>();
  public readonly active = input(0);
  public readonly label = input.required<string>();
  public readonly controls = input<string | null>(null);

  public readonly activeChange = output<number>();
  public readonly chosen = output<number>();

  protected readonly card =
    contentChild.required<TemplateRef<CardContext<T>>>(TemplateRef);
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  private readonly places = viewChildren<ElementRef<HTMLElement>>('place');
  private readonly settled = signal<number | null>(null);
  protected readonly current = computed(() =>
    clampPage(this.settled() ?? this.active(), this.items().length),
  );

  private stopFrame: () => void = () => {};
  private stopTimer: () => void = () => {};
  private isHeading = false;
  private width = 0;

  constructor() {
    effect(() => {
      const target = clampPage(this.active(), this.items().length);
      if (this.track() && this.places().length > 0) {
        untracked(() => {
          this.goTo(target);
        });
      }
    });
    const stopResize = this.platform.onResize(this.element, () => {
      this.realign();
    });
    inject(DestroyRef).onDestroy(() => {
      stopResize();
      this.stopFrame();
      this.stopTimer();
    });
  }

  protected awaitSettle(): void {
    if (this.platform.hasScrollEnd()) {
      return;
    }
    this.stopTimer();
    this.stopTimer = this.platform.after(SETTLE_MS, () => {
      this.settle();
    });
  }

  protected settle(): void {
    this.stopTimer();
    const scrollLeft = this.scrollLeft();
    const offsets = this.offsets();
    const place = cardAt(scrollLeft, offsets);
    if (this.isHeading || !isAt(scrollLeft, offsets[place] ?? 0)) {
      return;
    }
    this.settled.set(place);
    if (place !== clampPage(this.active(), this.items().length)) {
      this.activeChange.emit(place);
    }
  }

  protected show(target: number): void {
    this.stopFrame();
    this.isHeading = false;
    this.scrollTo(target, this.platform.reducedMotion() ? 'instant' : 'smooth');
  }

  private goTo(target: number): void {
    this.stopFrame();
    this.isHeading = false;
    if (this.isShowing(target)) {
      this.settled.set(target);
      return;
    }
    this.isHeading = true;
    this.stopFrame = this.platform.nextFrame(() => {
      this.isHeading = false;
      this.head(target);
    });
  }

  private head(target: number): void {
    if (this.isShowing(target)) {
      this.settled.set(target);
      return;
    }
    const isInstant = this.settled() === null || this.platform.reducedMotion();
    this.scrollTo(target, isInstant ? 'instant' : 'smooth');
    if (isInstant) {
      this.settled.set(target);
    }
  }

  private realign(): void {
    const width = this.track()?.nativeElement.clientWidth ?? 0;
    if (width === this.width) {
      return;
    }
    this.width = width;
    const place = this.current();
    if (!this.isHeading && !this.isShowing(place)) {
      this.scrollTo(place, 'instant');
    }
  }

  private scrollTo(target: number, behavior: ScrollBehavior): void {
    this.track()?.nativeElement.scrollTo({
      left: this.offsets()[target] ?? 0,
      behavior,
    });
  }

  private isShowing(target: number): boolean {
    return isAt(this.scrollLeft(), this.offsets()[target] ?? 0);
  }

  private scrollLeft(): number {
    return this.track()?.nativeElement.scrollLeft ?? 0;
  }

  private offsets(): number[] {
    const track = this.track()?.nativeElement;
    if (!track) {
      return [];
    }
    const { clientWidth, scrollWidth } = track;
    return this.places().map(({ nativeElement: place }) =>
      centredOffset(
        place.offsetLeft,
        place.offsetWidth,
        clientWidth,
        scrollWidth - clientWidth,
      ),
    );
  }
}
