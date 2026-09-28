import { inject, Service, untracked } from '@angular/core';
import { DisplayFormatService, FormatCodeService } from '@app/core/services';
import type {
  LookableScene,
  SceneLook,
  StartLook,
} from '../models/scene-look.model';
import { AnimatedCanvasService } from './animated-canvas.service';
import { ClickAbsorberService } from './click-absorber.service';

export const loadTouchLook = (): Promise<StartLook> =>
  import('../trackers/zoom-gesture.tracker').then(
    (code) => (scene, events, absorber) =>
      new code.ZoomGestureTracker(scene, events, absorber),
  );

export const loadSkyLook = (): Promise<StartLook> =>
  import('../trackers/sky-look.tracker').then(
    (code) => (scene, events) => new code.SkyLookTracker(scene, events),
  );

@Service({ autoProvided: false })
export class SceneLookService {
  private readonly display = inject(DisplayFormatService);
  private readonly canvas = inject(AnimatedCanvasService);
  private readonly absorber = inject(ClickAbsorberService);
  private readonly touchLook = inject(FormatCodeService).load(
    ['phone', 'tablet'],
    loadTouchLook,
  );
  private readonly skyLook = inject(FormatCodeService).load(
    ['desktop'],
    loadSkyLook,
  );

  public start(scene: LookableScene): SceneLook | null {
    const start =
      this.display.format() === 'desktop' ? this.skyLook() : this.touchLook();
    return start
      ? untracked(() => start(scene, this.canvas, this.absorber))
      : null;
  }
}
