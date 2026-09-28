import {
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import {
  DisplayFormatService,
  MediaPreferencesService,
  FormatCodeService,
} from '@app/core/services';
import type { GlassGesture, GlassSurface } from '../models/glass-gesture.model';
import type { GlassGestureTracker } from '../trackers/glass-gesture.tracker';

export const loadGlassGestures = () =>
  import('../trackers/glass-gesture.tracker');

@Directive({
  selector: '[appGlassGestures]',
  host: {
    '(pointerdown)': 'take($event)',
    '(pointermove)': 'take($event)',
    '(pointercancel)': 'take($event)',
  },
})
export class GlassGesturesDirective {
  private readonly display = inject(DisplayFormatService);
  private readonly media = inject(MediaPreferencesService);
  private readonly code = inject(FormatCodeService).load(
    ['phone'],
    loadGlassGestures,
  );
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  public readonly appGlassGestures = input(false);

  public readonly glassGesture = output<GlassGesture>();

  private readonly surface: GlassSurface = {
    isPhone: () => this.display.format() === 'phone',
    isFolded: () => this.appGlassGestures(),
    isFollowing: () => !this.media.reducedMotion(),
    answer: (gesture) => {
      this.glassGesture.emit(gesture);
    },
  };

  private tracker: GlassGestureTracker | null = null;
  private held: Event[] = [];

  constructor() {
    for (const type of ['pointerup', 'click']) {
      this.element.addEventListener(type, (event) => this.take(event), {
        capture: true,
      });
    }
    effect(() => {
      const code = this.code();
      if (code && !this.tracker) {
        untracked(() => {
          this.start(new code.GlassGestureTracker(this.element, this.surface));
        });
      }
    });
  }

  protected take(event: Event): void {
    if (this.tracker) {
      this.tracker.take(event);
    } else if (this.surface.isPhone()) {
      this.held.push(event);
    }
  }

  private start(tracker: GlassGestureTracker): void {
    this.tracker = tracker;
    for (const event of this.held) {
      tracker.take(event);
    }
    this.held = [];
  }
}
