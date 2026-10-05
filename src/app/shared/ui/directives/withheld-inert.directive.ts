import { computed, Directive, input } from '@angular/core';
import { Entrance } from '../models';

@Directive({
  selector: '[appWithheldInert]',
  host: { '[inert]': 'isWithheld()' },
})
export class WithheldInertDirective {
  public readonly appWithheldInert = input<Entrance>('timed');

  protected readonly isWithheld = computed(
    () => this.appWithheldInert() === 'withheld',
  );
}
