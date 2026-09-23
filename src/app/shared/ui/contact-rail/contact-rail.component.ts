import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { SHARED_TEXTS } from '@shared/ui/texts';
import { Arrival } from '@shared/ui/arrival';
import { CONTACT_ICONS } from './contact-icons';
import { ContactLink } from './contact-link.model';

/**
 * The contact rail, fixed bottom right: one link per address, at 44px each,
 * and the object's pause when there is an object to pause. The addresses are
 * the caller's; the rail only draws them, with inlined icons (see
 * `CONTACT_ICONS`) rather than an icon font.
 */
@Component({
  selector: 'app-contact-rail',
  templateUrl: './contact-rail.component.html',
  styleUrl: './contact-rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-arrival]': 'arrival()' },
})
export class ContactRailComponent {
  public readonly links = input.required<readonly ContactLink[]>();
  public readonly showPause = input(false);
  public readonly paused = input(false);
  /** Arrives with the home page's rest, at the end of the crossing. */
  public readonly arrival = input<Arrival>('timed');

  public readonly pauseToggled = output();

  protected readonly icons = CONTACT_ICONS;
  protected readonly texts = inject(SHARED_TEXTS);

  protected readonly pauseLabel = computed(() =>
    this.paused()
      ? this.texts().contactRail.resume
      : this.texts().contactRail.pause,
  );
}
