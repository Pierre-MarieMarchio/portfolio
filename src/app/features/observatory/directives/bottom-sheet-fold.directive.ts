import { Directive, inject } from '@angular/core';
import { BottomSheetComponent } from '@shared/mobile-nav/components';
import { WINDOW_FOLD, WindowFold } from '@shared/windows/ports';

@Directive({
  selector: 'app-bottom-sheet[appBottomSheetFold]',
  providers: [{ provide: WINDOW_FOLD, useExisting: BottomSheetFoldDirective }],
})
export class BottomSheetFoldDirective implements WindowFold {
  private readonly bottomSheet = inject(BottomSheetComponent, { self: true });

  public readonly isActive = (): boolean => this.bottomSheet.isActive();

  public readonly isFolded = (): boolean =>
    this.bottomSheet.detent() === 'folded';

  public readonly toggle = (): void => {
    this.bottomSheet.toggle();
  };

  public readonly attachHandle = (handle: HTMLElement): (() => void) =>
    this.bottomSheet.attachHandle(handle);
}
