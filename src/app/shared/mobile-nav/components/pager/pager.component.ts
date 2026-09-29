import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  untracked,
} from '@angular/core';
import { MOBILE_NAV_PLATFORM } from '../../ports/mobile-nav-platform.port';
import {
  clampPage,
  indexOfChild,
  isAt,
  offsetOfPage,
  pageAt,
} from '../../rules/pager.rules';
import { PagerPageComponent } from '../pager-page/pager-page.component';

const SETTLE_MS = 120;
const TOUCHES = ['touchstart', 'touchend', 'touchcancel'] as const;

@Component({
  selector: 'app-pager',
  templateUrl: './pager.component.html',
  styleUrl: './pager.component.scss',
  host: {
    '(scroll)': 'onScroll()',
    '(scrollend)': 'settle()',
  },
})
export class PagerComponent {
  private readonly platform = inject(MOBILE_NAV_PLATFORM);
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  public readonly index = input(0);

  public readonly indexChange = output<number>();
  public readonly shownChange = output<number>();

  private readonly pages = contentChildren(PagerPageComponent);
  private readonly settled = signal<number | null>(null);
  private readonly headingTo = signal<number | null>(null);
  private readonly current = computed(() =>
    clampPage(
      this.headingTo() ?? this.settled() ?? this.index(),
      this.pages().length,
    ),
  );

  private stopFrame: () => void = () => {};
  private stopTimer: () => void = () => {};
  private stopTouch: () => void = () => {};
  private isHeading = false;
  private isTouching = false;
  private isScrolling = false;
  private pendingTarget: number | null = null;
  private width = 0;

  constructor() {
    effect(() => {
      const pages = this.pages();
      const current = this.current();
      for (const [index, page] of pages.entries()) {
        page.place(index, pages.length, index === current);
      }
    });
    effect(() => {
      const shown = this.current();
      untracked(() => {
        this.shownChange.emit(shown);
      });
    });
    effect(() => {
      const target = clampPage(this.index(), this.pages().length);
      untracked(() => {
        this.goTo(target);
      });
    });
    const stopResize = this.platform.onResize(this.element, () => {
      this.realign();
    });
    const stopSnap = this.platform.onSnapChanging(this.element, (target) => {
      this.showNearest(indexOfChild(this.element, target));
    });
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      afterNextRender(() => {
        for (const type of TOUCHES) {
          this.element.addEventListener(type, this.onTouch, {
            passive: true,
          });
        }
        this.stopTouch = () => {
          for (const type of TOUCHES) {
            this.element.removeEventListener(type, this.onTouch);
          }
        };
      });
    }
    inject(DestroyRef).onDestroy(() => {
      stopResize();
      stopSnap();
      this.stopTouch();
      this.stopFrame();
      this.stopTimer();
    });
  }

  protected onScroll(): void {
    this.isScrolling = true;
    if (!this.platform.hasSnapChanging() && this.element.clientWidth > 0) {
      this.showNearest(
        pageAt(
          this.element.scrollLeft,
          this.element.clientWidth,
          this.pages().length,
        ),
      );
    }
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
    if (this.isHeading) {
      return;
    }
    const { scrollLeft, clientWidth } = this.element;
    this.isScrolling = false;
    if (clientWidth === 0) {
      return;
    }
    const place = pageAt(scrollLeft, clientWidth, this.pages().length);
    this.commit(place);
    if (place !== clampPage(this.index(), this.pages().length)) {
      this.indexChange.emit(place);
    }
    this.resumePending();
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

  private showNearest(place: number | null): void {
    if (this.headingTo() !== null || place === null) {
      return;
    }
    const clamped = clampPage(place, this.pages().length);
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
      this.scrollTo(target);
    });
  }

  private scrollTo(target: number): void {
    if (this.isShowing(target)) {
      this.commit(target);
      return;
    }
    const isInstant = this.settled() === null || this.platform.reducedMotion();
    this.element.scrollTo({
      left: this.offsetOf(target),
      behavior: isInstant ? 'instant' : 'smooth',
    });
    if (isInstant) {
      this.commit(target);
    }
  }

  private realign(): void {
    if (this.isGestureActive()) {
      return;
    }
    const width = this.element.clientWidth;
    if (width === this.width) {
      return;
    }
    this.width = width;
    const place = this.current();
    if (width > 0 && this.headingTo() === null && !this.isShowing(place)) {
      this.element.scrollTo({
        left: this.offsetOf(place),
        behavior: 'instant',
      });
    }
  }

  private isShowing(target: number): boolean {
    return isAt(this.element.scrollLeft, this.offsetOf(target));
  }

  private offsetOf(target: number): number {
    const { clientWidth, scrollWidth } = this.element;
    return offsetOfPage(target, clientWidth, scrollWidth - clientWidth);
  }
}
