import { Directive, inject } from '@angular/core';
import { BottomSheetComponent } from '@shared/mobile-nav/components';
import { WINDOW_FOLD, WindowFold } from '@shared/windows/ports';

@Directive({
  selector: 'app-bottom-sheet[appWindowSheet]',
  providers: [{ provide: WINDOW_FOLD, useExisting: WindowSheetDirective }],
})
export class WindowSheetDirective implements WindowFold {
  private readonly sheet = inject(BottomSheetComponent, { self: true });

  public readonly isActive = (): boolean => this.sheet.isActive();

  public readonly isFolded = (): boolean => this.sheet.detent() === 'folded';

  public readonly toggle = (): void => {
    this.sheet.toggle();
  };

  public readonly hold = (handle: HTMLElement): (() => void) =>
    this.sheet.hold(handle);
}
