import { SkyPanMotion } from '../engine/motions/sky-pan.motion';
import type {
  LookableScene,
  SceneLook,
  WindowEvents,
} from '../models/scene-look.model';
import { wheelRatio } from '../rules/gestures/sky-look.rules';
import { isOnScene } from '../rules/gestures/sky-touch.rules';

const MIDDLE_BUTTON = 1;
const MIDDLE_BUTTON_HELD = 4;

export class SkyLookTracker implements SceneLook {
  public readonly pan = new SkyPanMotion();
  private readonly stops: (() => void)[];
  private drag: { x: number; y: number } | null = null;

  constructor(
    private readonly scene: LookableScene,
    events: WindowEvents,
  ) {
    this.stops = [
      events.onWindow(
        'wheel',
        (event) => {
          this.roll(event);
        },
        { passive: false },
      ),
      events.onWindow(
        'mousedown',
        (event) => {
          this.press(event);
        },
        { capture: true },
      ),
      events.onWindow(
        'mousemove',
        (event) => {
          this.move(event);
        },
        { passive: true },
      ),
      events.onWindow('mouseup', (event) => {
        this.lift(event);
      }),
    ];
  }

  public stop(): void {
    for (const stop of this.stops.splice(0)) {
      stop();
    }
    this.drag = null;
  }

  private roll(event: WheelEvent): void {
    if (!isOnScene(event)) {
      return;
    }
    event.preventDefault();
    const x = event.clientX - this.pan.x;
    const y = event.clientY - this.pan.y;
    if (this.scene.holdZoom(x, y)) {
      this.scene.stretchZoom(x, y, wheelRatio(event.deltaY, event.deltaMode));
      this.scene.releaseZoom();
    }
  }

  private press(event: MouseEvent): void {
    if (event.button !== MIDDLE_BUTTON || !isOnScene(event)) {
      return;
    }
    event.preventDefault();
    this.drag = { x: event.clientX, y: event.clientY };
  }

  private move(event: MouseEvent): void {
    const drag = this.drag;
    if (!drag) {
      return;
    }
    if ((event.buttons & MIDDLE_BUTTON_HELD) === 0) {
      this.drag = null;
      return;
    }
    this.pan.by(event.clientX - drag.x, event.clientY - drag.y);
    drag.x = event.clientX;
    drag.y = event.clientY;
    this.scene.request();
  }

  private lift(event: MouseEvent): void {
    if (event.button === MIDDLE_BUTTON) {
      this.drag = null;
    }
  }
}
