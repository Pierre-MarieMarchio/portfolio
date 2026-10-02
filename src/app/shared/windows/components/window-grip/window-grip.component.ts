import { Component, computed, inject } from '@angular/core';
import { WINDOW_FOLD } from '../../ports/window-fold.port';
import { WINDOW_TEXTS } from '../../ports/window-texts.port';

@Component({
  selector: 'app-window-grip',
  templateUrl: './window-grip.component.html',
  styleUrl: './window-grip.component.scss',
})
export class WindowGripComponent {
  private readonly fold = inject(WINDOW_FOLD, { optional: true });
  private readonly texts = inject(WINDOW_TEXTS);

  protected readonly isFolded = computed(
    () => (this.fold?.isActive() ?? false) && (this.fold?.isFolded() ?? false),
  );
  protected readonly label = computed(() => {
    const words = this.texts().phone;
    return this.isFolded() ? words.unfold : words.fold;
  });

  protected toggle(): void {
    this.fold?.toggle();
  }
}
