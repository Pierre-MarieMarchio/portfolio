import { booleanAttribute, Directive, inject, input } from '@angular/core';
import { ActionMenuComponent } from '../components/action-menu/action-menu.component';

@Directive({
  selector: '[appActionRow]',
  host: {
    class: 'action-row',
    '(click)': 'onClick()',
  },
})
export class ActionRowDirective {
  private readonly menu = inject(ActionMenuComponent, { optional: true });

  public readonly keepsOpen = input(false, { transform: booleanAttribute });

  protected onClick(): void {
    if (!this.keepsOpen()) {
      this.menu?.dismiss();
    }
  }
}
