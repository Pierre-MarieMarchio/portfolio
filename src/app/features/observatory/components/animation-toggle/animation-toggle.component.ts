import { Component, computed, inject } from '@angular/core';
import { OBSERVATORY_TEXTS } from '../../ports/observatory-texts.port';
import { AnimationManager } from '../../states';

@Component({
  selector: 'app-animation-toggle',
  templateUrl: './animation-toggle.component.html',
  styleUrl: './animation-toggle.component.scss',
})
export class AnimationToggleComponent {
  protected readonly animation = inject(AnimationManager);
  private readonly texts = inject(OBSERVATORY_TEXTS);

  protected readonly label = computed(() =>
    this.animation.paused()
      ? this.texts().animation.resume
      : this.texts().animation.pause,
  );
}
