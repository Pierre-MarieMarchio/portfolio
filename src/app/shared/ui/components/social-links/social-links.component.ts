import { Component, inject, input, signal } from '@angular/core';
import { SHARED_TEXTS } from '../../ports';
import { Entrance } from '../../models';
import { SOCIAL_ICONS } from '../../data/social-icons.data';
import { SocialLink } from '../../models/social-link.model';

@Component({
  selector: 'app-social-links',
  templateUrl: './social-links.component.html',
  styleUrl: './social-links.component.scss',
  host: { '[attr.data-arrival]': 'arrival()' },
})
export class SocialLinksComponent {
  public readonly links = input.required<readonly SocialLink[]>();
  public readonly arrival = input<Entrance>('timed');

  protected readonly icons = SOCIAL_ICONS;
  protected readonly texts = inject(SHARED_TEXTS);
  protected readonly panelId = 'contact-links';
  protected readonly open = signal(false);

  protected toggle(): void {
    this.open.update((open) => !open);
  }
}
