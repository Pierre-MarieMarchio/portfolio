import { DestroyRef, Directive, inject, input } from '@angular/core';
import { BrowserWindowService, CursorService } from '@app/core/services';
import { SpaceSceneEngine } from '../engine/space-scene.engine';

export type TurnableScene = Pick<SpaceSceneEngine, 'grab' | 'turn' | 'release'>;

const OWN_GESTURES =
  '[data-panel], [data-scene-target], a, input, textarea, select';

@Directive({ selector: '[appTurnGesture]' })
export class TurnGestureDirective {
  private readonly browserWindow = inject(BrowserWindowService);
  private readonly cursor = inject(CursorService);

  public readonly appTurnGesture = input<TurnableScene | null>(null);

  private readonly gesture: (() => void)[] = [];
  private stopAbsorbing: () => void = () => {};

  constructor() {
    const stopGrabbing = this.browserWindow.on(
      'pointerdown',
      (event) => {
        this.stopAbsorbing();
        this.grab(event);
      },
      { capture: true },
    );
    inject(DestroyRef).onDestroy(() => {
      stopGrabbing();
      this.endGesture();
      this.stopAbsorbing();
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
    this.cursor.set('grabbing');
    this.gesture.push(
      this.browserWindow.on(
        'pointermove',
        (move) => {
          scene.turn(move.clientX, move.clientY);
        },
        { passive: true },
      ),
      this.browserWindow.on('pointerup', () => {
        this.release(scene);
      }),
      this.browserWindow.on('pointercancel', () => {
        this.release(scene);
      }),
    );
  }

  private release(scene: TurnableScene): void {
    const wasDrag = scene.release();
    this.endGesture();
    if (wasDrag) {
      this.absorbNextClick();
    }
  }

  private absorbNextClick(): void {
    this.stopAbsorbing();
    const stop = this.browserWindow.on(
      'click',
      (click) => {
        click.stopPropagation();
        click.preventDefault();
        this.stopAbsorbing();
      },
      { capture: true },
    );
    this.stopAbsorbing = () => {
      stop();
      this.stopAbsorbing = () => {};
    };
  }

  private endGesture(): void {
    for (const stop of this.gesture.splice(0)) {
      stop();
      this.cursor.set('');
    }
  }
}
