import { Component, computed, inject, input } from '@angular/core';
import { SceneAnchorKind } from '@app/features/common';
import { SocialLinksComponent } from '@shared/ui/components';
import {
  HeldInertDirective,
  LayoutAnchorDirective,
} from '@shared/ui/directives';
import {
  Entrance,
  LanguageItem,
  RailAction,
  SocialLink,
} from '@shared/ui/models';
import { CONTACT_ADDRESSES, CONTACT_EMAIL, COPY_ICON } from '../../data';
import { PROFILE_TEXTS } from '../../ports';
import { CopyFeedbackService } from '../../services/copy-feedback.service';
import { ContactMenuComponent } from '../contact-menu/contact-menu.component';

@Component({
  selector: 'app-contact-links',
  imports: [
    ContactMenuComponent,
    HeldInertDirective,
    SocialLinksComponent,
    LayoutAnchorDirective,
  ],
  providers: [CopyFeedbackService],
  templateUrl: './contact-links.component.html',
  styleUrl: './contact-links.component.scss',
})
export class ContactLinksComponent {
  public readonly arrival = input.required<Entrance>();
  public readonly languages = input<readonly LanguageItem[]>([]);

  private readonly feedback = inject(CopyFeedbackService);
  protected readonly texts = inject(PROFILE_TEXTS);
  protected readonly anchor: SceneAnchorKind = 'chrome';
  protected readonly isCopied = this.feedback.isCopied;

  protected readonly links = computed<readonly SocialLink[]>(() =>
    CONTACT_ADDRESSES.map((address) => ({
      ...address,
      title: this.texts().contactTitle[address.icon],
      label: this.texts().contact[address.icon],
    })),
  );

  protected readonly language = computed(
    () => this.languages().find((language) => !language.current) ?? null,
  );

  protected readonly copyAction = computed<RailAction>(() => ({
    icon: COPY_ICON,
    label: this.texts().contactMenu.copy,
  }));

  protected copy(): void {
    this.feedback.copy(CONTACT_EMAIL);
  }
}
