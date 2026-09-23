import { Component, inject, input } from '@angular/core';
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

  protected readonly texts = inject(SHARED_TEXTS);
}
