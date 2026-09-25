import { DestroyRef, Directive, inject, input } from '@angular/core';
import { BrowserWindowService, DisplayFormatService } from '@app/core/services';
import { SpaceSceneEngine } from '../engine/space-scene.engine';
import { isOnScene, isOnSky } from '../rules/sky-touch.rules';
import { ClickAbsorberService } from '../services/click-absorber.service';

export type ZoomableScene = Pick<
  SpaceSceneEngine,
  'holdZoom' | 'stretchZoom' | 'releaseZoom' | 'lookCloser'
>;

const TAP_WITHIN_PX = 6;
const TAP_WITHIN_MS = 300;
const DOUBLE_TAP_WITHIN_MS = 320;
const DOUBLE_TAP_WITHIN_PX = 32;

interface Touch {
  x: number;
  y: number;
  readonly startX: number;
  readonly startY: number;
  readonly startTime: number;
  readonly isOnSky: boolean;
}

@Directive({ selector: '[appZoomGesture]' })
export class ZoomGestureDirective {
  private readonly browserWindow = inject(BrowserWindowService);
  private readonly display = inject(DisplayFormatService);
  private readonly absorber = inject(ClickAbsorberService);

  public readonly appZoomGesture = input<ZoomableScene | null>(null);

  private readonly touches = new Map<number, Touch>();
  private readonly following: (() => void)[] = [];
  private pinch: { readonly spread: number } | null = null;
  private hasPinched = false;
  private lastTap: { x: number; y: number; time: number } | null = null;

  constructor() {
    const stopTouching = this.browserWindow.on(
      'pointerdown',
      (event) => {
        this.press(event);
      },
      { capture: true },
    );
    inject(DestroyRef).onDestroy(() => {
      stopTouching();
      this.endGesture();
      this.absorber.stop();
    });
  }

  private press(event: PointerEvent): void {
    const scene = this.appZoomGesture();
    if (
      !scene ||
      event.pointerType !== 'touch' ||
      this.display.format() === 'desktop' ||
      !isOnScene(event)
    ) {
      return;
    }
    if (this.touches.size === 0) {
      this.follow(scene);
    }
    this.touches.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      startTime: event.timeStamp,
      isOnSky: isOnSky(event),
    });
    if (this.touches.size === 2 && !this.pinch) {
      this.startPinch(scene);
    }
  }

  private follow(scene: ZoomableScene): void {
    this.hasPinched = false;
    this.following.push(
      this.browserWindow.on(
        'pointermove',
        (move) => {
          this.move(scene, move);
        },
        { passive: true },
      ),
      this.browserWindow.on('pointerup', (up) => {
        this.lift(scene, up, true);
      }),
      this.browserWindow.on('pointercancel', (cancel) => {
        this.lift(scene, cancel, false);
      }),
    );
  }

  private startPinch(scene: ZoomableScene): void {
    const [a, b] = this.touches.values();
    if (!a || !b) {
      return;
    }
    const mid = midpoint(a, b);
    if (scene.holdZoom(mid.x, mid.y)) {
      this.pinch = { spread: Math.max(1, spread(a, b)) };
      this.hasPinched = true;
      this.lastTap = null;
    }
  }

  private move(scene: ZoomableScene, event: PointerEvent): void {
    const touch = this.touches.get(event.pointerId);
    if (!touch) {
      return;
    }
    touch.x = event.clientX;
    touch.y = event.clientY;
    const pinch = this.pinch;
    const [a, b] = this.touches.values();
    if (pinch && a && b) {
      const mid = midpoint(a, b);
      scene.stretchZoom(mid.x, mid.y, spread(a, b) / pinch.spread);
    }
  }

  private lift(scene: ZoomableScene, event: PointerEvent, isUp: boolean): void {
    const touch = this.touches.get(event.pointerId);
    if (!touch) {
      return;
    }
    this.touches.delete(event.pointerId);
    if (this.pinch) {
      this.pinch = null;
      scene.releaseZoom();
    }
    if (this.touches.size > 0) {
      return;
    }
    if (this.hasPinched) {
      this.absorber.absorbNext();
    } else if (isUp && touch.isOnSky && isTap(touch, event)) {
      this.tapped(scene, event);
    }
    this.endGesture();
  }

  private tapped(scene: ZoomableScene, event: PointerEvent): void {
    const last = this.lastTap;
    if (
      last &&
      event.timeStamp - last.time <= DOUBLE_TAP_WITHIN_MS &&
      Math.hypot(event.clientX - last.x, event.clientY - last.y) <=
        DOUBLE_TAP_WITHIN_PX
    ) {
      this.lastTap = null;
      scene.lookCloser();
      return;
    }
    this.lastTap = {
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
    };
  }

  private endGesture(): void {
    this.touches.clear();
    this.pinch = null;
    for (const stop of this.following.splice(0)) {
      stop();
    }
  }
}

function midpoint(a: Touch, b: Touch): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function spread(a: Touch, b: Touch): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isTap(touch: Touch, event: PointerEvent): boolean {
  return (
    event.timeStamp - touch.startTime <= TAP_WITHIN_MS &&
    Math.hypot(event.clientX - touch.startX, event.clientY - touch.startY) <=
      TAP_WITHIN_PX
  );
}
