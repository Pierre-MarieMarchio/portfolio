import {
  Component,
  computed,
  contentChildren,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MOBILE_NAV_PLATFORM } from '../../ports/mobile-nav-platform.port';
import { clampPage, isAt, offsetOfPage, pageAt } from '../../rules/pager.rules';
import { PagerPageComponent } from '../pager-page/pager-page.component';

const SETTLE_MS = 120;

@Component({
  selector: 'app-pager',
  templateUrl: './pager.component.html',
  styleUrl: './pager.component.scss',
  host: {
    '(scroll)': 'awaitSettle()',
    '(scrollend)': 'settle()',
  },
})
export class PagerComponent {
  private readonly platform = inject(MOBILE_NAV_PLATFORM);
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  public readonly index = input(0);

  public readonly indexChange = output<number>();

  private readonly pages = contentChildren(PagerPageComponent);
  private readonly settled = signal<number | null>(null);
  private readonly current = computed(() =>
    clampPage(this.settled() ?? this.index(), this.pages().length),
  );

  private stopFrame: () => void = () => {};
  private stopTimer: () => void = () => {};
  private isHeading = false;
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
      const target = clampPage(this.index(), this.pages().length);
      untracked(() => {
        this.goTo(target);
      });
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
    const { scrollLeft, clientWidth } = this.element;
    if (clientWidth === 0) {
      return;
    }
    const place = pageAt(scrollLeft, clientWidth, this.pages().length);
    if (this.isHeading || !isAt(scrollLeft, this.offsetOf(place))) {
      return;
    }
    this.settled.set(place);
    if (place !== clampPage(this.index(), this.pages().length)) {
      this.indexChange.emit(place);
    }
  }

  private goTo(target: number): void {
    this.stopFrame();
    this.isHeading = false;
    if (this.settled() === null ? target === 0 : this.isShowing(target)) {
      this.settled.set(target);
      return;
    }
    this.isHeading = true;
    this.stopFrame = this.platform.nextFrame(() => {
      this.isHeading = false;
      this.scrollTo(target);
    });
  }

  private scrollTo(target: number): void {
    if (this.isShowing(target)) {
      this.settled.set(target);
      return;
    }
    const isInstant = this.settled() === null || this.platform.reducedMotion();
    this.element.scrollTo({
      left: this.offsetOf(target),
      behavior: isInstant ? 'instant' : 'smooth',
    });
    if (isInstant) {
      this.settled.set(target);
    }
  }

  private realign(): void {
    const width = this.element.clientWidth;
    if (width === this.width) {
      return;
    }
    this.width = width;
    const place = this.current();
    if (width > 0 && !this.isHeading && !this.isShowing(place)) {
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
