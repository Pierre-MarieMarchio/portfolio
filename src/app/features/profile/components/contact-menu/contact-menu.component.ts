import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActionMenuComponent } from '@shared/mobile-nav/components';
import { ActionRowDirective } from '@shared/mobile-nav/directives';
import { SOCIAL_ICONS } from '@shared/ui/data';
import { LanguageItem, SocialLink } from '@shared/ui/models';
import { SHARED_TEXTS } from '@shared/ui/ports';
import { CONTACT_EMAIL, COPY_ICON } from '../../data';
import { PROFILE_TEXTS } from '../../ports';
import { CopyFeedbackService } from '../../services/copy-feedback.service';

@Component({
  selector: 'app-contact-menu',
  imports: [ActionMenuComponent, ActionRowDirective, RouterLink],
  providers: [CopyFeedbackService],
  templateUrl: './contact-menu.component.html',
  styleUrl: './contact-menu.component.scss',
})
export class ContactMenuComponent {
  public readonly links = input.required<readonly SocialLink[]>();
  public readonly language = input<LanguageItem | null>(null);

  private readonly feedback = inject(CopyFeedbackService);
  protected readonly texts = inject(PROFILE_TEXTS);
  protected readonly sharedTexts = inject(SHARED_TEXTS);
  protected readonly icons = SOCIAL_ICONS;
  protected readonly copyIcon = COPY_ICON;

  protected readonly open = signal(false);
  protected readonly isCopied = this.feedback.isCopied;
  protected readonly mail = computed(() =>
    this.links().find((link) => link.icon === 'email'),
  );
  protected readonly others = computed(() =>
    this.links().filter((link) => link.icon !== 'email'),
  );

  protected copy(): void {
    this.feedback.copy(CONTACT_EMAIL);
  }
}
