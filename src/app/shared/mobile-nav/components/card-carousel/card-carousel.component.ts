import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { MOBILE_NAV_PLATFORM } from '../../ports/mobile-nav-platform.port';
import { cardAt, centredOffset } from '../../rules/carousel.rules';
import { clampPage, indexOfChild, isAt } from '../../rules/pager.rules';
import { PagerDotsComponent } from '../pager-dots/pager-dots.component';

const SETTLE_MS = 120;
const TOUCHES = ['touchstart', 'touchend', 'touchcancel'] as const;

interface CardContext<T> {
  readonly $implicit: T;
  readonly index: number;
}

@Component({
  selector: 'app-card-carousel',
  imports: [NgTemplateOutlet, PagerDotsComponent],
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
  private readonly headingTo = signal<number | null>(null);
  protected readonly current = computed(() =>
    clampPage(
      this.headingTo() ?? this.settled() ?? this.active(),
      this.items().length,
    ),
  );

  private stopFrame: () => void = () => {};
  private stopTimer: () => void = () => {};
  private stopSnap: () => void = () => {};
  private stopTouch: () => void = () => {};
  private isHeading = false;
  private isTouching = false;
  private isScrolling = false;
  private pendingTarget: number | null = null;
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
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    afterNextRender(() => {
      const track = this.track()?.nativeElement;
      if (!track) {
        return;
      }
      this.stopSnap = this.platform.onSnapChanging(track, (target) => {
        this.showNearest(indexOfChild(track, target));
      });
      if (isBrowser) {
        for (const type of TOUCHES) {
          track.addEventListener(type, this.onTouch, { passive: true });
        }
        this.stopTouch = () => {
          for (const type of TOUCHES) {
            track.removeEventListener(type, this.onTouch);
          }
        };
      }
    });
    inject(DestroyRef).onDestroy(() => {
      stopResize();
      this.stopSnap();
      this.stopTouch();
      this.stopFrame();
      this.stopTimer();
    });
  }

  protected onScroll(): void {
    this.isScrolling = true;
    if (!this.platform.hasSnapChanging()) {
      this.showNearest(cardAt(this.scrollLeft(), this.offsets()));
    }
    if (this.platform.hasScrollEnd()) {
      return;
    }
    this.stopTimer();
    this.stopTimer = this.platform.after(SETTLE_MS, () => {
      this.settle();
    });
  }

  private readonly onTouch = (event: Event): void => {
    if (event.type === 'touchstart') {
      this.isTouching = true;
      this.stopFrame();
      this.isHeading = false;
      this.headingTo.set(null);
      return;
    }
    this.isTouching = false;
    this.resumePending();
  };

  protected settle(): void {
    this.stopTimer();
    if (this.isHeading) {
      return;
    }
    this.isScrolling = false;
    const place = cardAt(this.scrollLeft(), this.offsets());
    this.commit(place);
    if (place !== clampPage(this.active(), this.items().length)) {
      this.activeChange.emit(place);
    }
    this.resumePending();
  }

  protected show(target: number): void {
    this.stopFrame();
    if (this.isShowing(target)) {
      return;
    }
    this.headingTo.set(target);
    this.scrollTo(target, this.platform.reducedMotion() ? 'instant' : 'smooth');
  }

  private showNearest(place: number | null): void {
    if (this.headingTo() !== null || place === null) {
      return;
    }
    const clamped = clampPage(place, this.items().length);
    if (clamped !== this.settled()) {
      this.settled.set(clamped);
    }
  }

  private commit(target: number): void {
    this.headingTo.set(null);
    this.settled.set(target);
  }

  private isGestureActive(): boolean {
    return this.isTouching || this.isScrolling;
  }

  private resumePending(): void {
    if (this.isGestureActive()) {
      return;
    }
    this.realign();
    const pending = this.pendingTarget;
    this.pendingTarget = null;
    if (pending !== null) {
      this.goTo(pending);
    }
  }

  private goTo(target: number): void {
    if (this.isGestureActive()) {
      this.pendingTarget = target;
      return;
    }
    this.pendingTarget = null;
    this.stopFrame();
    this.headingTo.set(null);
    if (this.settled() === null ? target === 0 : this.isShowing(target)) {
      this.commit(target);
      return;
    }
    this.isHeading = true;
    this.headingTo.set(target);
    this.stopFrame = this.platform.nextFrame(() => {
      this.isHeading = false;
      this.head(target);
    });
  }

  private head(target: number): void {
    if (this.isShowing(target)) {
      this.commit(target);
      return;
    }
    const isInstant = this.settled() === null || this.platform.reducedMotion();
    this.scrollTo(target, isInstant ? 'instant' : 'smooth');
    if (isInstant) {
      this.commit(target);
    }
  }

  private realign(): void {
    if (this.isGestureActive()) {
      return;
    }
    const width = this.track()?.nativeElement.clientWidth ?? 0;
    if (width === this.width) {
      return;
    }
    this.width = width;
    const place = this.current();
    if (this.headingTo() === null && !this.isShowing(place)) {
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
