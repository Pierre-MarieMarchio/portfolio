import { isPlatformBrowser } from '@angular/common';
import {
  afterRenderEffect,
  computed,
  DestroyRef,
  DOCUMENT,
  inject,
  Injector,
  PLATFORM_ID,
  Service,
  signal,
} from '@angular/core';
import type { DisplayFormat } from '../../models/display-format.model';
import {
  displayFormatOf,
  SERVER_DISPLAY_FORMAT,
} from '../../rules/display-format.rules';
import { BrowserWindowService } from '../browser/browser-window.service';
import {
  COARSE_POINTER_QUERY,
  MediaPreferencesService,
  NO_HOVER_QUERY,
} from '../browser/media-preferences.service';

@Service()
export class DisplayFormatService {
  private readonly browserWindow = inject(BrowserWindowService);
  private readonly media = inject(MediaPreferencesService);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly viewport = signal(this.browserWindow.size());
  private readonly hasCoarsePointer = signal(this.media.hasCoarsePointer());
  private readonly cannotHover = signal(this.media.cannotHover());
  private isPublished = false;

  public readonly format = computed<DisplayFormat>(() => {
    const viewport = this.viewport();
    return viewport
      ? displayFormatOf({
          ...viewport,
          hasCoarsePointer: this.hasCoarsePointer(),
          cannotHover: this.cannotHover(),
        })
      : SERVER_DISPLAY_FORMAT;
  });

  constructor() {
    const readViewport = (): void => {
      this.viewport.set(this.browserWindow.size());
    };
    const stops = [
      this.browserWindow.on('resize', readViewport),
      this.browserWindow.on('orientationchange', readViewport),
      this.media.watch(COARSE_POINTER_QUERY, (isCoarse) => {
        this.hasCoarsePointer.set(isCoarse);
      }),
      this.media.watch(NO_HOVER_QUERY, (isHoverless) => {
        this.cannotHover.set(isHoverless);
      }),
    ];
    inject(DestroyRef).onDestroy(() => {
      for (const stop of stops) {
        stop();
      }
    });
  }

  public publishOnRoot(): void {
    if (!this.isBrowser || this.isPublished) {
      return;
    }
    this.isPublished = true;
    const root = this.document.documentElement;
    afterRenderEffect(
      () => {
        root.dataset['format'] = this.format();
      },
      { injector: this.injector },
    );
  }
}
