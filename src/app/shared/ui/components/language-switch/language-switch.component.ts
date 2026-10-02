import { Component, computed, inject, input } from '@angular/core';
import { DisplayFormatService } from '@app/core/services';
import { RouterLink } from '@angular/router';
import { SHARED_TEXTS } from '../../ports';
import { LanguageItem } from '../../models/language-item.model';

@Component({
  selector: 'app-language-switch',
  imports: [RouterLink],
  templateUrl: './language-switch.component.html',
  styleUrl: './language-switch.component.scss',
})
export class LanguageSwitchComponent {
  public readonly languages = input.required<readonly LanguageItem[]>();

  private readonly display = inject(DisplayFormatService);
  protected readonly texts = inject(SHARED_TEXTS);
  protected readonly isPhone = computed(
    () => this.display.format() === 'phone',
  );
}
