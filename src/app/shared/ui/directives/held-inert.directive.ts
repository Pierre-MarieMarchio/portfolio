import { computed, Directive, input } from '@angular/core';
import { Entrance } from '../models';

@Directive({
  selector: '[appHeldInert]',
  host: { '[inert]': 'isHeld()' },
})
export class HeldInertDirective {
  public readonly appHeldInert = input<Entrance>('timed');

  protected readonly isHeld = computed(() => this.appHeldInert() === 'held');
}
