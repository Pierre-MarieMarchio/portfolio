import { isPlatformBrowser } from '@angular/common';
import { ErrorHandler, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isSerializable } from '../utils/json.utils';

/**
 * The base every stored preference extends: a feature service subclasses it
 * and names its own keys, so no key is spelt in two places.
 *
 * Guarded twice. On the server there is no storage at all, so a read answers
 * `null` and a write does nothing: a preference only exists once the page is
 * in a browser. In a browser with storage blocked, reads throw as well as
 * writes, and a read may happen at bootstrap, before anything can recover, so
 * each access is caught and reported to the `ErrorHandler`.
 */
@Injectable({ providedIn: 'root' })
export abstract class LocalStorageService {
  private readonly errorHandler = inject(ErrorHandler);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected setItem<T>(key: string, value: T): void {
    if (!this.isBrowser) {
      return;
    }

    const stringValue = isSerializable(value)
      ? JSON.stringify(value)
      : String(value);

    try {
      localStorage.setItem(key, stringValue);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  protected getItem<T = unknown>(key: string): T | string | null {
    const raw = this.readRaw(key);

    if (raw === null) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw;
    }
  }

  protected removeItem(key: string): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  /** A blocked read is a missing value, not a crash at startup. */
  private readRaw(key: string): string | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      return localStorage.getItem(key);
    } catch (error) {
      this.errorHandler.handleError(error);

      return null;
    }
  }
}
