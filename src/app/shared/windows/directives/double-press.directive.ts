import { Directive, output } from '@angular/core';
import { isOnControl } from '@app/core/helpers';

const TAP_SLOP = 10;
const TAPS_APART = 24;
const TAPS_WITHIN_MS = 350;

interface Tap {
  readonly x: number;
  readonly y: number;
  readonly at: number;
}

const distance = (from: Tap, to: Tap): number =>
  Math.hypot(to.x - from.x, to.y - from.y);

const tapOf = (event: PointerEvent): Tap => ({
  x: event.clientX,
  y: event.clientY,
  at: event.timeStamp,
});

@Directive({
  selector: '[appDoublePress]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(dblclick)': 'onDoubleClick($event)',
  },
})
export class DoublePressDirective {
  public readonly doublePressed = output();

  private isPressedByMouse = true;
  private press: Tap | null = null;
  private lastTap: Tap | null = null;

  protected onPointerDown(event: PointerEvent): void {
    this.isPressedByMouse = event.pointerType === 'mouse';
    this.press = isOnControl(event) ? null : tapOf(event);
  }

  protected onPointerUp(event: PointerEvent): void {
    const press = this.press;
    this.press = null;
    if (this.isPressedByMouse) {
      return;
    }
    const tap = tapOf(event);
    if (!press || distance(press, tap) > TAP_SLOP) {
      this.lastTap = null;
      return;
    }
    const last = this.lastTap;
    if (
      last &&
      tap.at - last.at <= TAPS_WITHIN_MS &&
      distance(last, tap) <= TAPS_APART
    ) {
      this.lastTap = null;
      this.doublePressed.emit();
      return;
    }
    this.lastTap = tap;
  }

  protected onDoubleClick(event: MouseEvent): void {
    if (this.isPressedByMouse && !isOnControl(event)) {
      this.doublePressed.emit();
    }
  }
}
