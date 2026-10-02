import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
} from '@angular/core';
import type { SheetRelease, SheetSample } from '../models/bottom-sheet.model';
import { MOBILE_NAV_PLATFORM } from '../ports/mobile-nav-platform.port';
import { speedOf } from '../rules/bottom-sheet.rules';

const SETTLE_MS = 120;
const KEPT_SAMPLES = 12;
const TOUCHES = ['touchstart', 'touchmove', 'touchend', 'touchcancel'] as const;

@Directive({
  selector: '[appScrollRelease]',
  host: {
    '(scroll)': 'onScroll($event)',
    '(scrollend)': 'settle()',
  },
})
export class ScrollReleaseDirective {
  private readonly platform = inject(MOBILE_NAV_PLATFORM);
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  public readonly appScrollRelease = input(false);

  public readonly pressed = output();
  public readonly released = output<SheetRelease>();
  public readonly settled = output();

  public isTouching = false;

  private samples: SheetSample[] = [];
  private startY = 0;
  private lastY = 0;
  private stopTimer: () => void = () => {};

  constructor() {
    const listener = (event: Event): void => {
      this.onTouch(event as TouchEvent);
    };
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      afterNextRender(() => {
        for (const type of TOUCHES) {
          this.element.addEventListener(type, listener, { passive: true });
        }
      });
    }
    inject(DestroyRef).onDestroy(() => {
      this.stopTimer();
      for (const type of TOUCHES) {
        this.element.removeEventListener(type, listener);
      }
    });
  }

  protected onScroll(event: Event): void {
    if (!this.appScrollRelease()) {
      return;
    }
    if (this.isTouching) {
      this.samples = [
        ...this.samples,
        { top: this.element.scrollTop, at: event.timeStamp },
      ].slice(-KEPT_SAMPLES);
    }
    if (!this.platform.hasScrollEnd()) {
      this.stopTimer();
      this.stopTimer = this.platform.after(SETTLE_MS, () => {
        this.settle();
      });
    }
  }

  protected settle(): void {
    this.stopTimer();
    if (this.appScrollRelease() && !this.isTouching) {
      this.settled.emit();
    }
  }

  private onTouch(event: TouchEvent): void {
    if (!this.appScrollRelease()) {
      return;
    }
    if (event.type === 'touchstart') {
      this.isTouching = true;
      this.samples = [];
      this.startY = event.touches[0]?.clientY ?? 0;
      this.lastY = this.startY;
      this.pressed.emit();
    } else if (event.type === 'touchmove') {
      this.lastY = event.touches[0]?.clientY ?? this.lastY;
    } else if (this.isTouching && event.touches.length === 0) {
      this.isTouching = false;
      this.released.emit({
        speed: speedOf(this.samples, event.timeStamp),
        pull: this.lastY - this.startY,
      });
    }
  }
}
