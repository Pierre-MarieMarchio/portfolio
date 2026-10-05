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
import type {
  BottomSheetRelease,
  BottomSheetSample,
} from '../models/bottom-sheet.model';
import { speedOf } from '../rules/bottom-sheet.rules';
import { ScrollEndService } from '../services/scroll-end.service';

const KEPT_SAMPLES = 12;
const TOUCHES = ['touchstart', 'touchmove', 'touchend', 'touchcancel'] as const;

@Directive({
  selector: '[appScrollRelease]',
  providers: [ScrollEndService],
  host: {
    '(scroll)': 'onScroll($event)',
    '(scrollend)': 'settle()',
  },
})
export class ScrollReleaseDirective {
  private readonly scrollEnd = inject(ScrollEndService);
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  public readonly appScrollRelease = input(false);

  public readonly pressed = output();
  public readonly released = output<BottomSheetRelease>();
  public readonly settled = output();

  public isTouching = false;

  private samples: BottomSheetSample[] = [];
  private startY = 0;
  private lastY = 0;

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
    this.scrollEnd.expect(() => {
      this.settle();
    });
  }

  protected settle(): void {
    this.scrollEnd.cancel();
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
    } else {
      this.liftOff(event);
    }
  }

  private liftOff(event: TouchEvent): void {
    if (!this.isTouching || event.touches.length > 0) {
      return;
    }
    this.isTouching = false;
    this.released.emit({
      speed: speedOf(this.samples, event.timeStamp),
      pull: this.lastY - this.startY,
    });
  }
}
