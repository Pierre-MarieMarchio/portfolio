import {
  afterRenderEffect,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
} from '@angular/core';
import {
  BrowserWindowService,
  ClockService,
  DisplayFormatService,
  DocumentStylesService,
  ElementObserverService,
  FormatCodeService,
  MediaPreferencesService,
} from '@app/core/services';
import type {
  FrameCode,
  FrameMode,
  FramePlace,
  FrameRect,
  FrameTracking,
  FramedWindow,
  WindowControlView,
  WindowParts,
} from '../models/window-frame.model';
import { WINDOW_TEXTS } from '../ports/window-texts.port';
import { WindowStackService } from '../services/window-stack.service';

const FRAME_ANIMATION_MS = 280;

export const loadWindowFrame = (): Promise<FrameCode> =>
  Promise.all([
    import('../trackers/window-frame.tracker'),
    import('../rules/window-controls.rules'),
  ]).then(([tracker, controls]) => ({
    track: (framed) => new tracker.WindowFrameTracker(framed),
    controlsOf: controls.frameControlsOf,
  }));

const translateOf = (place: FramePlace | null): string | null =>
  place ? `translate(${String(place.dx)}px,${String(place.dy)}px)` : null;

const pixels = (value: number | null | undefined): string | null =>
  value == null ? null : `${String(value)}px`;

const NO_CONTROLS: readonly WindowControlView[] = [];

@Directive({
  selector: '[appWindowFrame]',
  host: {
    '[style.transform]': 'transform()',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[attr.data-frame]': 'mode()',
    '[attr.data-frame-animating]': 'animating() || null',
  },
})
export class WindowFrameDirective {
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly browserWindow = inject(BrowserWindowService);
  private readonly styles = inject(DocumentStylesService);
  private readonly observer = inject(ElementObserverService);
  private readonly media = inject(MediaPreferencesService);
  private readonly display = inject(DisplayFormatService);
  private readonly clock = inject(ClockService);
  private readonly texts = inject(WINDOW_TEXTS);
  private readonly stack = inject(WindowStackService, { optional: true });
  private readonly code = inject(FormatCodeService).load(
    ['desktop', 'tablet'],
    loadWindowFrame,
  );
  private readonly place = signal<FramePlace | null>(null);
  private readonly framedMode = signal<FrameMode | null>(null);
  private readonly parts = signal<WindowParts | null>(null);
  private readonly liveHandlers = new Set<(rect: FrameRect | null) => void>();
  protected readonly animating = signal(false);
  private tracker: FrameTracking | null = null;
  private stopAnimating: () => void = () => {};

  public readonly mode = this.framedMode.asReadonly();
  public readonly isActive = computed(() => this.display.format() !== 'phone');
  public readonly controls = computed(() => {
    const code = this.code();
    const parts = this.parts();
    return code && parts && this.isActive()
      ? code.controlsOf(this.texts(), this.framedMode(), parts.maximizable())
      : NO_CONTROLS;
  });

  protected readonly transform = computed(() => translateOf(this.place()));
  protected readonly width = computed(() => pixels(this.place()?.width));
  protected readonly height = computed(() => pixels(this.place()?.height));

  constructor() {
    effect((onCleanup) => {
      const code = this.code();
      const parts = this.parts();
      if (!this.isActive()) {
        untracked(() => {
          this.paint(null);
          this.commit(null, null);
        });
        return;
      }
      if (!code || !parts) {
        return;
      }
      const tracker = untracked(() => code.track(this.framed(parts)));
      this.tracker = tracker;
      onCleanup(() => {
        tracker.stop();
        this.tracker = null;
      });
    });
    afterRenderEffect({
      write: () => {
        const parts = this.parts();
        parts?.ceiling();
        parts?.anchor();
        parts?.stable();
        this.place();
        untracked(() => this.tracker?.fitHeight());
      },
    });
    inject(DestroyRef).onDestroy(() => {
      this.stopAnimating();
    });
  }

  public onLive(handler: (rect: FrameRect | null) => void): () => void {
    this.liveHandlers.add(handler);
    return () => {
      this.liveHandlers.delete(handler);
    };
  }

  public hold(parts: WindowParts): () => void {
    this.parts.set(parts);
    return () => {
      if (this.parts() === parts) {
        this.parts.set(null);
      }
    };
  }

  public snapTo(zone: 'left' | 'right'): void {
    this.tracker?.snapTo(zone);
  }

  public toggleMaximize(): void {
    this.tracker?.toggleMaximize();
    this.animate();
  }

  public cascade(): void {
    if (this.tracker && this.framedMode() === null) {
      this.tracker.cascadeFrom(this.stack?.frontShownOf(this.element) ?? null);
    }
  }

  private animate(): void {
    this.stopAnimating();
    if (this.media.reducedMotion()) {
      this.animating.set(false);
      return;
    }
    this.animating.set(true);
    this.stopAnimating = this.clock.after(FRAME_ANIMATION_MS, () => {
      this.animating.set(false);
    });
  }

  private paint(place: FramePlace | null): void {
    const style = this.element.style;
    style.transform = translateOf(place) ?? '';
    style.width = pixels(place?.width) ?? '';
    style.height = pixels(place?.height) ?? '';
  }

  private commit(place: FramePlace | null, mode: FrameMode | null): void {
    this.place.set(place);
    this.framedMode.set(mode);
  }

  private framed(parts: WindowParts): FramedWindow {
    return {
      element: this.element,
      parts,
      viewport: () => this.browserWindow.size(),
      token: (name, element) => this.styles.token(name, element),
      onResize: (element, handler) => this.observer.onResize(element, handler),
      reducedMotion: () => this.media.reducedMotion(),
      place: () => untracked(this.place),
      mode: () => untracked(this.framedMode),
      paint: (place) => {
        this.paint(place);
      },
      commit: (place, mode) => {
        this.commit(place, mode);
      },
      live: (rect) => {
        for (const handler of this.liveHandlers) {
          handler(rect);
        }
      },
      onWindow: (type, handler, options) =>
        this.browserWindow.on(type, handler, options),
    };
  }
}
