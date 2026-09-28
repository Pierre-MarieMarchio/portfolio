import { SCENE_CONFIG } from '../models/scene-config.model';
import type {
  ClickAbsorber,
  LookableScene,
  SceneLook,
  WindowEvents,
} from '../models/scene-look.model';
import { isOnScene, isOnSky } from '../rules/gestures/sky-touch.rules';

const TAP_WITHIN_PX = SCENE_CONFIG.gestures.dragPx;
const TAP_WITHIN_MS = SCENE_CONFIG.gestures.tapMs;
const DOUBLE_TAP_WITHIN_MS = SCENE_CONFIG.gestures.doubleTapMs;
const DOUBLE_TAP_WITHIN_PX = SCENE_CONFIG.gestures.doubleTapPx;

interface Touch {
  x: number;
  y: number;
  readonly startX: number;
  readonly startY: number;
  readonly startTime: number;
  readonly isOnSky: boolean;
}

export class ZoomGestureTracker implements SceneLook {
  public readonly pan = null;

  private readonly touches = new Map<number, Touch>();
  private readonly following: (() => void)[] = [];
  private pinch: { readonly spread: number } | null = null;
  private hasPinched = false;
  private lastTap: { x: number; y: number; time: number } | null = null;

  private readonly stopTouching: () => void;

  constructor(
    private readonly scene: LookableScene,
    private readonly events: WindowEvents,
    private readonly absorber: ClickAbsorber,
  ) {
    this.stopTouching = events.onWindow(
      'pointerdown',
      (event) => {
        this.press(event);
      },
      { capture: true },
    );
  }

  public stop(): void {
    this.stopTouching();
    this.endGesture();
    this.absorber.stop();
  }

  private press(event: PointerEvent): void {
    const scene = this.scene;
    if (event.pointerType !== 'touch' || !isOnScene(event)) {
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

  private follow(scene: LookableScene): void {
    this.hasPinched = false;
    this.following.push(
      this.events.onWindow(
        'pointermove',
        (move) => {
          this.move(scene, move);
        },
        { passive: true },
      ),
      this.events.onWindow('pointerup', (up) => {
        this.lift(scene, up, true);
      }),
      this.events.onWindow('pointercancel', (cancel) => {
        this.lift(scene, cancel, false);
      }),
    );
  }

  private startPinch(scene: LookableScene): void {
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

  private move(scene: LookableScene, event: PointerEvent): void {
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

  private lift(scene: LookableScene, event: PointerEvent, isUp: boolean): void {
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

  private tapped(scene: LookableScene, event: PointerEvent): void {
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
