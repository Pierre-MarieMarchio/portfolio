import { defineUpdater } from 'ngx-statewise';
import { animationPauseToggled } from './animation.action';
import { AnimationState } from './animation.state';

export const animationUpdater = defineUpdater(AnimationState, (on) => {
  on(animationPauseToggled, (state) => {
    state.paused.update((paused) => !paused);
  });
});
