import { DestroyRef, Directive, inject, input } from '@angular/core';
import { BrowserWindowService, CursorService } from '@app/core/services';
import { SpaceSceneEngine } from '../engine/space-scene.engine';
import { isOnSky } from '../rules/sky-touch.rules';
import { ClickAbsorberService } from '../services/click-absorber.service';

export type TurnableScene = Pick<SpaceSceneEngine, 'grab' | 'turn' | 'release'>;

@Directive({ selector: '[appTurnGesture]' })
export class TurnGestureDirective {
  private readonly browserWindow = inject(BrowserWindowService);
  private readonly cursor = inject(CursorService);
  private readonly absorber = inject(ClickAbsorberService);

  public readonly appTurnGesture = input<TurnableScene | null>(null);

  private readonly gesture: (() => void)[] = [];

  constructor() {
    const stopGrabbing = this.browserWindow.on(
      'pointerdown',
      (event) => {
        this.absorber.stop();
        if (event.isPrimary) {
          this.grab(event);
        }
      },
      { capture: true },
    );
    inject(DestroyRef).onDestroy(() => {
      stopGrabbing();
      this.endGesture();
      this.absorber.stop();
    });
  }

  private grab(event: PointerEvent): void {
    const scene = this.appTurnGesture();
    if (!scene || event.button !== 0 || !isOnSky(event)) {
      return;
    }
    if (!scene.grab(event.clientX, event.clientY)) {
      return;
    }
    this.endGesture();
    this.cursor.set('grabbing');
    const hand = event.pointerId;
    this.gesture.push(
      this.browserWindow.on(
        'pointermove',
        (move) => {
          if (move.pointerId === hand) {
            scene.turn(move.clientX, move.clientY);
          }
        },
        { passive: true },
      ),
      this.browserWindow.on('pointerup', (up) => {
        if (up.pointerId === hand) {
          this.release(scene);
        }
      }),
      this.browserWindow.on('pointercancel', (cancel) => {
        if (cancel.pointerId === hand) {
          this.release(scene);
        }
      }),
    );
  }

  private release(scene: TurnableScene): void {
    const wasDrag = scene.release();
    this.endGesture();
    if (wasDrag) {
      this.absorber.absorbNext();
    }
  }

  private endGesture(): void {
    for (const stop of this.gesture.splice(0)) {
      stop();
      this.cursor.set('');
    }
  }
}
