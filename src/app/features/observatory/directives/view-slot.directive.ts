import { Directive, effect, ElementRef, inject, input } from '@angular/core';
import type { ViewSlot } from '../models/observatory.model';
import { ViewWindowsService } from '../services/view-windows.service';

@Directive({ selector: '[appViewSlot]' })
export class ViewSlotDirective {
  public readonly appViewSlot = input.required<ViewSlot>();

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const windows = inject(ViewWindowsService);
    effect((onCleanup) => {
      onCleanup(windows.add(this.appViewSlot(), element));
    });
  }
}
