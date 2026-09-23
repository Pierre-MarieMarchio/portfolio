import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AnimationState {
  public readonly paused = signal(false);
}
