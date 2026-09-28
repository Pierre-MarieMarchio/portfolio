import { isOnControl } from '@app/core/helpers';
import type {
  GlassIntent,
  GlassPress,
  GlassSurface,
  GlassZone,
} from '../models/glass-gesture.model';
import {
  DRAG_SLOP,
  glassGestureOf,
  glassIntentOf,
} from '../rules/glass-gesture.rules';

const SPEED_WINDOW_MS = 80;

interface Spot {
  readonly x: number;
  readonly y: number;
  readonly at: number;
}

interface Track extends GlassPress {
  readonly id: number;
  readonly start: Spot;
  readonly isFollowing: boolean;
  intent: GlassIntent;
  anchor: Spot;
  last: Spot;
}

const isAtTop = (from: Element | null, zoned: Element): boolean => {
  for (
    let element = from;
    element && zoned.contains(element);
    element = element.parentElement
  ) {
    if (element.scrollTop >= 1) {
      return false;
    }
  }
  return true;
};

const spotOf = (event: PointerEvent): Spot => ({
  x: event.clientX,
  y: event.clientY,
  at: event.timeStamp,
});

export class GlassGestureTracker {
  private track: Track | null = null;
  private isClickSwallowed = false;

  constructor(
    private readonly element: HTMLElement,
    private readonly surface: GlassSurface,
  ) {
    element.addEventListener('touchmove', (event) => this.hold(event), {
      passive: false,
    });
  }

  public take(event: Event): void {
    if (event.type === 'click') {
      this.swallow(event);
    } else if (event instanceof PointerEvent) {
      this.follow(event);
    }
  }

  private follow(event: PointerEvent): void {
    switch (event.type) {
      case 'pointerdown': {
        this.press(event);
        break;
      }
      case 'pointermove': {
        this.move(event);
        break;
      }
      default: {
        this.release(event);
      }
    }
  }

  private press(event: PointerEvent): void {
    if (!this.surface.isPhone()) {
      return;
    }
    this.isClickSwallowed = this.track !== null;
    this.settle(false);
    const target = event.target instanceof Element ? event.target : null;
    const zoned = target?.closest<HTMLElement>('[data-glass-zone]');
    if (zoned && !this.isClickSwallowed) {
      this.begin(event, zoned);
    }
  }

  private begin(event: PointerEvent, zoned: HTMLElement): void {
    const zone = zoned.dataset['glassZone'] as GlassZone;
    if (zone === 'bar' && isOnControl(event)) {
      return;
    }
    const isLowered = (this.element.parentElement?.scrollTop ?? 0) < 1;
    const start = spotOf(event);
    this.element.classList.remove('glass-return');
    this.track = {
      zone,
      isFolded: this.surface.isFolded(),
      canPull:
        isLowered &&
        (zone === 'bar' ||
          (zone === 'body' && isAtTop(event.target as Element, zoned))),
      id: event.pointerId,
      start,
      isFollowing: this.surface.isFollowing(),
      intent: 'pending',
      anchor: start,
      last: start,
    };
  }

  private move(event: PointerEvent): void {
    const track = this.track;
    if (track?.id !== event.pointerId) {
      return;
    }
    const dx = event.clientX - track.start.x;
    const dy = event.clientY - track.start.y;
    if (track.intent === 'pending') {
      track.intent = glassIntentOf(track, dx, dy);
    }
    this.isClickSwallowed ||= Math.hypot(dx, dy) > DRAG_SLOP;
    if (event.timeStamp - track.anchor.at > SPEED_WINDOW_MS) {
      track.anchor = track.last;
    }
    track.last = spotOf(event);
    if (!track.isFollowing) {
      return;
    }
    if (track.intent === 'pull') {
      this.element.style.transform = `translateY(${String(Math.max(0, dy))}px)`;
    }
  }

  private release(event: PointerEvent): void {
    const track = this.track;
    if (track?.id !== event.pointerId) {
      return;
    }
    const dx = event.clientX - track.start.x;
    const dy = event.clientY - track.start.y;
    const elapsed = event.timeStamp - track.anchor.at;
    const pace = elapsed > 0 && elapsed <= 2 * SPEED_WINDOW_MS ? elapsed : 0;
    this.isClickSwallowed ||= Math.hypot(dx, dy) > DRAG_SLOP;
    const gesture =
      event.type === 'pointerup'
        ? glassGestureOf(track.intent, track, {
            dy,
            vy: pace && (event.clientY - track.anchor.y) / pace,
          })
        : 'none';
    this.settle(gesture === 'none');
    if (gesture !== 'none') {
      event.stopPropagation();
      this.surface.answer(gesture);
    }
  }

  private hold(event: Event): void {
    if (this.track && this.track.intent !== 'native' && event.cancelable) {
      event.preventDefault();
    }
  }

  private swallow(event: Event): void {
    if (this.isClickSwallowed) {
      this.isClickSwallowed = false;
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private settle(isReturning: boolean): void {
    if (this.element.style.transform) {
      this.element.classList.toggle('glass-return', isReturning);
      this.element.style.transform = '';
    }
    this.track = null;
  }
}
