import type { SwipeHost } from '../models/swipe.model';
import { followOf, stepAfter } from '../rules/swipe-steps.rules';

const SLOP = 8;
const SETTLE_MS = 180;
const SWAP_WAIT_MS = 100;
const SETTLE_TIME = 'var(--t-duration)';
const POINTER_EVENTS = [
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointercancel',
] as const;

interface Gesture {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly at: number;
  readonly area: HTMLElement;
  travel: number;
  pane: number;
  isDecided: boolean;
}

const ignore = (): void => {};

export class SwipeStepsService {
  private gesture: Gesture | null = null;
  private isSettling = false;
  private stopFrame: () => void = ignore;
  private stopWait: () => void = ignore;

  constructor(private readonly host: SwipeHost) {
    for (const type of POINTER_EVENTS) {
      host.element.addEventListener(type, this.onPointer, { passive: true });
    }
  }

  public readonly stop = (): void => {
    this.stopFrame();
    this.stopWait();
    for (const type of POINTER_EVENTS) {
      this.host.element.removeEventListener(type, this.onPointer);
    }
  };

  private readonly onPointer = (event: Event): void => {
    if (!(event instanceof PointerEvent)) {
      return;
    }
    const gesture = this.gesture;
    if (event.type === 'pointerdown') {
      this.press(event);
    } else if (gesture?.id === event.pointerId) {
      if (event.type === 'pointermove') {
        this.move(gesture, event);
      } else {
        this.letGo(gesture, event);
      }
    }
  };

  private press(event: PointerEvent): void {
    const target = event.target instanceof Element ? event.target : null;
    const area = target?.closest<HTMLElement>(this.host.appSwipeSteps().area);
    if (
      area &&
      event.isPrimary &&
      event.pointerType !== 'mouse' &&
      !this.isSettling &&
      this.host.platform.isCompact()
    ) {
      this.gesture = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        at: event.timeStamp,
        area,
        travel: 0,
        pane: 0,
        isDecided: false,
      };
    }
  }

  private move(gesture: Gesture, event: PointerEvent): void {
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.isDecided && !this.decide(gesture, dx, dy)) {
      return;
    }
    gesture.travel = dx;
    if (!this.host.platform.reducedMotion()) {
      this.followNextFrame(gesture, dx);
    }
  }

  private decide(gesture: Gesture, dx: number, dy: number): boolean {
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SLOP) {
      return false;
    }
    gesture.isDecided = true;
    if (Math.abs(dy) >= Math.abs(dx)) {
      this.gesture = null;
      return false;
    }
    return true;
  }

  private followNextFrame(gesture: Gesture, dx: number): void {
    this.stopFrame();
    this.stopFrame = this.host.platform.nextFrame(() => {
      const { pane, at } = followOf(
        dx,
        gesture.area.clientWidth,
        this.host.appSwipeSteps().index,
        this.host.appSwipeSteps().count,
      );
      gesture.pane = pane;
      this.set({ '--swipe-pane': pane, '--swipe-at': at });
    });
  }

  private letGo(gesture: Gesture, event: PointerEvent): void {
    this.gesture = null;
    if (!gesture.isDecided) {
      return;
    }
    this.stopFrame();
    const { index, count } = this.host.appSwipeSteps();
    const step =
      event.type === 'pointercancel'
        ? 0
        : stepAfter({
            travel: gesture.travel,
            ms: event.timeStamp - gesture.at,
            width: gesture.area.clientWidth,
            index,
            count,
          });
    if (this.host.platform.reducedMotion()) {
      this.emit(step);
      return;
    }
    this.isSettling = true;
    if (step === 0) {
      this.set({
        '--swipe-t': SETTLE_TIME,
        '--swipe-pane': 0,
        '--swipe-at': index,
      });
      this.stopWait = this.host.platform.after(SETTLE_MS, () => {
        this.clear();
      });
      return;
    }
    this.set({ '--swipe-at': index + step });
    this.emit(step);
    this.afterSwap(() => {
      this.enterFrom(gesture.pane + step);
    });
  }

  private emit(step: number): void {
    if (step !== 0) {
      this.host.stepped.emit(step);
    }
  }

  private afterSwap(callback: () => void): void {
    let isDone = false;
    let stop = ignore;
    const run = (): void => {
      if (!isDone) {
        isDone = true;
        stop();
        callback();
      }
    };
    const stopRender = this.host.afterRender(run);
    const stopTimer = this.host.platform.after(SWAP_WAIT_MS, run);
    stop = () => {
      stopRender();
      stopTimer();
    };
    this.stopWait = stop;
  }

  private enterFrom(pane: number): void {
    this.set({ '--swipe-t': null, '--swipe-pane': pane });
    this.host.element.getBoundingClientRect();
    this.set({ '--swipe-t': SETTLE_TIME, '--swipe-pane': 0 });
    this.stopWait = this.host.platform.after(SETTLE_MS, () => {
      this.clear();
    });
  }

  private set(values: Readonly<Record<string, number | string | null>>): void {
    for (const [name, value] of Object.entries(values)) {
      if (value === null) {
        this.host.element.style.removeProperty(name);
      } else {
        this.host.element.style.setProperty(name, String(value));
      }
    }
  }

  private clear(): void {
    this.set({ '--swipe-t': null, '--swipe-pane': null, '--swipe-at': null });
    this.isSettling = false;
  }
}
