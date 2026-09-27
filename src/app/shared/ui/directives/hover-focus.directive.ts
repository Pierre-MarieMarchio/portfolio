import { Directive, inject, output } from '@angular/core';
import { MediaPreferencesService } from '@app/core/services';

@Directive({
  selector: '[appHoverFocus]',
  host: {
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
  },
})
export class HoverFocusDirective {
  private readonly media = inject(MediaPreferencesService);
  private isPressedByTouch = false;
  private isFocusEntered = false;

  public readonly entered = output();
  public readonly exited = output();

  protected onPointerEnter(event: PointerEvent): void {
    if (this.isMouseHover(event)) {
      this.entered.emit();
    }
  }

  protected onPointerLeave(event: PointerEvent): void {
    if (this.isMouseHover(event)) {
      this.exited.emit();
    }
  }

  protected onPointerDown(event: PointerEvent): void {
    this.isPressedByTouch = event.pointerType !== 'mouse';
  }

  protected onFocus(): void {
    if (this.isPressedByTouch) {
      return;
    }
    this.isFocusEntered = true;
    this.entered.emit();
  }

  protected onBlur(): void {
    this.isPressedByTouch = false;
    if (this.isFocusEntered) {
      this.isFocusEntered = false;
      this.exited.emit();
    }
  }

  private isMouseHover(event: PointerEvent): boolean {
    return event.pointerType === 'mouse' && !this.media.cannotHover();
  }
}
