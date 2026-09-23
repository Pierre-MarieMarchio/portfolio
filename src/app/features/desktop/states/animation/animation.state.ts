import { Service, signal } from '@angular/core';

@Service()
export class AnimationState {
  public readonly paused = signal(false);
}
