import { Directive, effect, inject, untracked } from '@angular/core';
import { BottomSheetComponent } from '@shared/mobile-nav/components';
import { ProjectSheetService } from '../services';

@Directive({
  selector: 'app-bottom-sheet[appProjectSheet]',
  providers: [ProjectSheetService],
})
export class ProjectSheetDirective {
  private readonly bottomSheet = inject(BottomSheetComponent, { self: true });
  private readonly opening = inject(ProjectSheetService);

  constructor() {
    effect(() => {
      if (this.opening.openings() > 0) {
        untracked(() => {
          this.bottomSheet.detent.set('full');
        });
      }
    });
  }
}
