import { Component, computed, inject, input } from '@angular/core';
import { SceneAnchorKind } from '@app/features/common';
import { SocialLinksComponent } from '@shared/ui/components';
import { LayoutAnchorDirective } from '@shared/ui/directives';
import { Entrance, SocialLink } from '@shared/ui/models';
import { CONTACT_ADDRESSES } from '../../data';
import { PROFILE_TEXTS } from '../../ports';

@Component({
  selector: 'app-contact-links',
  imports: [SocialLinksComponent, LayoutAnchorDirective],
  template: `
    <app-social-links
      [appLayoutAnchor]="anchor"
      [links]="links()"
      [arrival]="arrival()"
    >
      <ng-content />
    </app-social-links>
  `,
  styles: ':host { display: contents; }',
})
export class ContactLinksComponent {
  public readonly arrival = input.required<Entrance>();

  private readonly texts = inject(PROFILE_TEXTS);
  protected readonly anchor: SceneAnchorKind = 'chrome';

  protected readonly links = computed<readonly SocialLink[]>(() =>
    CONTACT_ADDRESSES.map((address) => ({
      ...address,
      label: this.texts().contact[address.icon],
    })),
  );
}
