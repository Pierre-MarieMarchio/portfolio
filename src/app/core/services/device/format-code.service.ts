import { isPlatformBrowser } from '@angular/common';
import {
  effect,
  inject,
  PLATFORM_ID,
  Service,
  signal,
  Signal,
} from '@angular/core';
import type { DisplayFormat } from '../../models/display-format.model';
import { DisplayFormatService } from './display-format.service';

@Service()
export class FormatCodeService {
  private readonly format = inject(DisplayFormatService).format;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  public load<T>(
    formats: readonly DisplayFormat[],
    importer: () => Promise<T>,
  ): Signal<T | null> {
    const loaded = signal<T | null>(null);
    if (!this.isBrowser) {
      return loaded.asReadonly();
    }
    let isAsked = false;
    effect(() => {
      if (isAsked || !formats.includes(this.format())) {
        return;
      }
      isAsked = true;
      void importer().then(
        (code) => {
          loaded.set(code);
        },
        () => {
          isAsked = false;
        },
      );
    });
    return loaded.asReadonly();
  }
}
