import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ClipboardService, ClockService } from '@app/core/services';
import { ActionMenuComponent } from '@shared/mobile-nav/components';
import { ActionRowDirective } from '@shared/mobile-nav/directives';
import { SOCIAL_ICONS } from '@shared/ui/data';
import { SocialLink } from '@shared/ui/models';
import { SHARED_TEXTS } from '@shared/ui/ports';
import { CONTACT_EMAIL } from '../../data';
import { PROFILE_TEXTS } from '../../ports';

const COPIED_FOR_MS = 4000;

const COPY_ICON =
  'M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1M19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5M19 21H8V7H19V21Z';

@Component({
  selector: 'app-contact-menu',
  imports: [ActionMenuComponent, ActionRowDirective],
  templateUrl: './contact-menu.component.html',
  styleUrl: './contact-menu.component.scss',
})
export class ContactMenuComponent {
  public readonly links = input.required<readonly SocialLink[]>();

  private readonly clipboard = inject(ClipboardService);
  private readonly clock = inject(ClockService);
  protected readonly texts = inject(PROFILE_TEXTS);
  protected readonly sharedTexts = inject(SHARED_TEXTS);
  protected readonly icons = SOCIAL_ICONS;
  protected readonly copyIcon = COPY_ICON;

  protected readonly open = signal(false);
  protected readonly isCopied = signal(false);
  protected readonly mail = computed(() =>
    this.links().find((link) => link.icon === 'email'),
  );
  protected readonly others = computed(() =>
    this.links().filter((link) => link.icon !== 'email'),
  );

  private forget: () => void = () => {};

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.forget();
    });
  }

  protected copy(): void {
    void this.clipboard.copy(CONTACT_EMAIL).then((isDone) => {
      if (isDone) {
        this.said();
      }
    });
  }

  private said(): void {
    this.forget();
    this.isCopied.set(true);
    this.forget = this.clock.after(COPIED_FOR_MS, () => {
      this.isCopied.set(false);
    });
  }
}
