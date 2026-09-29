import {
  afterRenderEffect,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
} from '@angular/core';
import {
  BrowserWindowService,
  DisplayFormatService,
  DocumentStylesService,
  ElementObserverService,
  FormatCodeService,
  MediaPreferencesService,
} from '@app/core/services';
import type {
  FrameCode,
  FrameKeyControl,
  FrameMode,
  FramePlace,
  FrameRect,
  FrameTracking,
  FramedWindow,
  WindowControlView,
  WindowParts,
} from '../models/window-frame.model';
import { WINDOW_TEXTS } from '../ports/window-texts.port';

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
  private readonly texts = inject(WINDOW_TEXTS);
  private readonly code = inject(FormatCodeService).load(
    ['desktop', 'tablet'],
    loadWindowFrame,
  );
  private readonly place = signal<FramePlace | null>(null);
  private readonly framedMode = signal<FrameMode | null>(null);
  private readonly holding = signal<FrameKeyControl | null>(null);
  private readonly parts = signal<WindowParts | null>(null);
  private readonly liveHandlers = new Set<(rect: FrameRect | null) => void>();
  private tracker: FrameTracking | null = null;

  public readonly mode = this.framedMode.asReadonly();
  public readonly isActive = computed(() => this.display.format() !== 'phone');
  public readonly controls = computed(() => {
    const code = this.code();
    return code && this.parts() && this.isActive()
      ? code.controlsOf(this.texts(), this.framedMode(), this.holding())
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

  public press(control: FrameKeyControl | 'maximize', event: Event): void {
    this.tracker?.press(control, event);
  }

  public toggleMaximize(): void {
    this.tracker?.toggleMaximize();
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
    if (mode === null) {
      this.holding.set(null);
    }
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
      holding: () => untracked(this.holding),
      hold: (control) => {
        this.holding.set(control);
      },
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
