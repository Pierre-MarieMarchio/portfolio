import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { SHARED_TEXTS } from '../../ports';
import { Entrance } from '../../models';
import { SOCIAL_ICONS } from '../../data/social-icons.data';
import { SocialLink } from '../../models/social-link.model';

/**
 * The contact rail, fixed bottom right: one link per address, at 44px each,
 * and the object's pause when there is an object to pause. The addresses are
 * the caller's; the rail only draws them, with inlined icons (see
 * `CONTACT_ICONS`) rather than an icon font.
 */
@Component({
  selector: 'app-social-links',
  templateUrl: './social-links.component.html',
  styleUrl: './social-links.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-arrival]': 'arrival()' },
})
export class SocialLinksComponent {
  public readonly links = input.required<readonly SocialLink[]>();
  public readonly showPause = input(false);
  public readonly paused = input(false);
  /** Arrives with the home page's rest, at the end of the crossing. */
  public readonly arrival = input<Entrance>('timed');

  public readonly pauseToggled = output();

  protected readonly icons = SOCIAL_ICONS;
  protected readonly texts = inject(SHARED_TEXTS);

  protected readonly pauseLabel = computed(() =>
    this.paused()
      ? this.texts().contactRail.resume
      : this.texts().contactRail.pause,
  );
}
