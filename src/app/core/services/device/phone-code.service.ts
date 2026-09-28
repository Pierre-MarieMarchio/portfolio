import { effect, inject, Service, signal, Signal } from '@angular/core';
import { DisplayFormatService } from './display-format.service';

@Service()
export class PhoneCodeService {
  private readonly format = inject(DisplayFormatService).format;

  public load<T>(importer: () => Promise<T>): Signal<T | null> {
    const loaded = signal<T | null>(null);
    let isAsked = false;
    effect(() => {
      if (isAsked || this.format() !== 'phone') {
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
