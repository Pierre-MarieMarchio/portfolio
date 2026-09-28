import { Directive, ElementRef, inject, input, output } from '@angular/core';
import { isOnControl } from '@app/core/helpers';
import {
  DisplayFormatService,
  DocumentStylesService,
  MediaPreferencesService,
} from '@app/core/services';
import type {
  GlassGesture,
  GlassIntent,
  GlassPress,
  GlassRelease,
  GlassZone,
} from '../models/glass-gesture.model';

const DRAG_SLOP = 6;
const FOLD_REACH = 64;
const UNFOLD_REACH = 48;
const FOLD_SPEED = 0.6;
const SWIPE_REACH = 56;
const SWIPE_SLANT = 1.5;
const SWIPE_SPEED = 0.5;
const SWIPE_FOLLOW = 24;
const SPEED_WINDOW_MS = 80;

const sideIntentOf = (press: GlassPress): GlassIntent =>
  press.zone === 'bar' || press.isOnSideScroller || press.isFolded
    ? 'native'
    : 'swipe';

export const glassIntentOf = (
  press: GlassPress,
  dx: number,
  dy: number,
): GlassIntent => {
  if (Math.hypot(dx, dy) < DRAG_SLOP) {
    return 'pending';
  }
  if (Math.abs(dx) > Math.abs(dy)) {
    return sideIntentOf(press);
  }
  if (press.isFolded) {
    return press.zone === 'bar' && dy < 0 ? 'lift' : 'native';
  }
  return press.canPull && dy > 0 ? 'pull' : 'native';
};

const swipeOf = ({ dx, dy, vx }: GlassRelease): GlassGesture => {
  const isFlung = vx * dx > 0 && Math.abs(vx) > SWIPE_SPEED;
  const isFar = Math.abs(dx) >= SWIPE_REACH || isFlung;
  if (!isFar || Math.abs(dx) <= SWIPE_SLANT * Math.abs(dy)) {
    return 'none';
  }
  return dx < 0 ? 'next' : 'previous';
};

const pullOf = ({ dy, vy }: GlassRelease): GlassGesture =>
  dy >= FOLD_REACH || vy > FOLD_SPEED ? 'fold' : 'none';

const liftOf = ({ dy, vy }: GlassRelease): GlassGesture =>
  -dy >= UNFOLD_REACH || -vy > FOLD_SPEED ? 'unfold' : 'none';

export const glassGestureOf = (
  intent: GlassIntent,
  press: GlassPress,
  release: GlassRelease,
): GlassGesture => {
  switch (intent) {
    case 'pull': {
      return pullOf(release);
    }
    case 'lift': {
      return liftOf(release);
    }
    case 'pending': {
      return press.isFolded && press.zone === 'bar' ? 'unfold' : 'none';
    }
    case 'swipe': {
      return swipeOf(release);
    }
    default: {
      return 'none';
    }
  }
};

export const swipeFollowOf = (dx: number): number =>
  SWIPE_FOLLOW * Math.tanh(dx / (4 * SWIPE_FOLLOW));

interface Spot {
  readonly x: number;
  readonly y: number;
  readonly at: number;
}

interface Track extends GlassPress {
  readonly id: number;
  readonly start: Spot;
  readonly body: HTMLElement | null;
  readonly isFollowing: boolean;
  intent: GlassIntent;
  anchor: Spot;
  last: Spot;
}

const spotOf = (event: PointerEvent): Spot => ({
  x: event.clientX,
  y: event.clientY,
  at: event.timeStamp,
});

@Directive({
  selector: '[appGlassGestures]',
  host: {
    '(pointerdown)': 'press($event)',
    '(pointermove)': 'move($event)',
    '(pointercancel)': 'release($event)',
    '(touchmove)': 'hold($event)',
  },
})
export class GlassGesturesDirective {
  private readonly display = inject(DisplayFormatService);
  private readonly media = inject(MediaPreferencesService);
  private readonly styles = inject(DocumentStylesService);
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  public readonly appGlassGestures = input(false);

  public readonly glassGesture = output<GlassGesture>();

  private track: Track | null = null;
  private isClickSwallowed = false;

  constructor() {
    this.element.addEventListener('pointerup', (event) => this.release(event), {
      capture: true,
    });
    this.element.addEventListener('click', (event) => this.swallow(event), {
      capture: true,
    });
  }

  protected press(event: PointerEvent): void {
    if (this.display.format() !== 'phone') {
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
    const body = this.element.querySelector<HTMLElement>(
      '[data-glass-zone="body"]',
    );
    const isLowered = (this.element.parentElement?.scrollTop ?? 0) < 1;
    const start = spotOf(event);
    for (const moved of [this.element, body]) {
      moved?.classList.remove('glass-return');
    }
    this.track = {
      zone,
      isFolded: this.appGlassGestures(),
      canPull:
        isLowered &&
        (zone === 'bar' || (zone === 'body' && zoned.scrollTop < 1)),
      isOnSideScroller: this.isOnSideScroller(event.target as Element, zoned),
      id: event.pointerId,
      start,
      body,
      isFollowing: !this.media.reducedMotion(),
      intent: 'pending',
      anchor: start,
      last: start,
    };
  }

  protected move(event: PointerEvent): void {
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
    } else if (track.intent === 'swipe' && track.body) {
      track.body.style.transform = `translateX(${String(swipeFollowOf(dx))}px)`;
    }
  }

  protected release(event: PointerEvent): void {
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
            dx,
            dy,
            vx: pace && (event.clientX - track.anchor.x) / pace,
            vy: pace && (event.clientY - track.anchor.y) / pace,
          })
        : 'none';
    this.settle(gesture === 'none');
    if (gesture !== 'none') {
      event.stopPropagation();
      this.glassGesture.emit(gesture);
    }
  }

  protected hold(event: Event): void {
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

  private isOnSideScroller(from: Element | null, zoned: Element): boolean {
    for (
      let element = from;
      element && zoned.contains(element);
      element = element.parentElement
    ) {
      if (
        element.scrollWidth > element.clientWidth + 1 &&
        /auto|scroll/.test(this.styles.token('overflow-x', element))
      ) {
        return true;
      }
    }
    return false;
  }

  private settle(isReturning: boolean): void {
    for (const moved of [this.element, this.track?.body]) {
      if (moved?.style.transform) {
        moved.classList.toggle('glass-return', isReturning);
        moved.style.transform = '';
      }
    }
    this.track = null;
  }
}
