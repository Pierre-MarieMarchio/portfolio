import { DestroyRef, Directive, inject, input, output } from '@angular/core';
import { BrowserEnvironmentService } from '@app/core/services';
import { SpaceSceneEngine } from '../engine/space-scene.engine';

export type TurnableScene = Pick<SpaceSceneEngine, 'grab' | 'turn' | 'release'>;

const OWN_GESTURES =
  '[data-panel], [data-object-body], a, input, textarea, select';

@Directive({ selector: '[appTurnGesture]' })
export class TurnGestureDirective {
  private readonly browser = inject(BrowserEnvironmentService);

  public readonly appTurnGesture = input<TurnableScene | null>(null);

  public readonly spun = output();

  private readonly gesture: (() => void)[] = [];

  constructor() {
    const stopGrabbing = this.browser.listen(
      'pointerdown',
      (event) => {
        this.grab(event);
      },
      { capture: true },
    );
    inject(DestroyRef).onDestroy(() => {
      stopGrabbing();
      this.endGesture();
    });
  }

  private grab(event: PointerEvent): void {
    const scene = this.appTurnGesture();
    const target = event.target instanceof Element ? event.target : null;
    if (
      !scene ||
      event.button !== 0 ||
      !target ||
      target.closest(OWN_GESTURES)
    ) {
      return;
    }
    if (!scene.grab(event.clientX, event.clientY)) {
      return;
    }
    this.endGesture();
    this.browser.setCursor('grabbing');
    this.gesture.push(
      this.browser.listen(
        'pointermove',
        (move) => {
          scene.turn(move.clientX, move.clientY);
        },
        { passive: true },
      ),
      this.browser.listen('pointerup', () => {
        this.release(scene);
      }),
      this.browser.listen('pointercancel', () => {
        this.release(scene);
      }),
    );
  }

  private release(scene: TurnableScene): void {
    const wasDrag = scene.release();
    this.endGesture();
    if (wasDrag) {
      this.spun.emit();
    }
  }

  private endGesture(): void {
    for (const stop of this.gesture.splice(0)) {
      stop();
      this.browser.setCursor('');
    }
  }
}
