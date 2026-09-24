import { inject, Service } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { animationPauseToggled } from './animation.action';
import { AnimationState } from './animation.state';
import { animationUpdater } from './animation.updater';

@Service()
export class AnimationManager {
  private readonly state = inject(AnimationState);
  private readonly statewise = injectStatewise(animationUpdater);

  public readonly paused = this.state.paused.asReadonly();

  public togglePause(): void {
    this.statewise.dispatch(animationPauseToggled());
  }
}
