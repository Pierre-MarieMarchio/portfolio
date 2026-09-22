import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { refusalReason } from '../error-handling/refusal-reason';

/** One failure the application chose to surface rather than swallow. */
export interface ReportedError {
  readonly at: string;
  readonly message: string;
}

/**
 * What the application does with a failure instead of dropping it in the
 * console: keeps it as state. Everything reaches here through Angular's
 * `ErrorHandler`.
 */
@Injectable({ providedIn: 'root' })
export class ReportedErrors {
  /** Enough to see what just happened, few enough to stay readable. */
  private static readonly LIMIT = 20;

  private readonly reported = signal<readonly ReportedError[]>([]);

  public readonly all = this.reported.asReadonly();

  public record(error: unknown): void {
    const entry: ReportedError = {
      at: new Date().toISOString(),
      message: messageOf(error),
    };

    this.reported.update((known) =>
      [entry, ...known].slice(0, ReportedErrors.LIMIT),
    );
  }

  public clear(): void {
    this.reported.set([]);
  }
}

/**
 * `HttpErrorResponse` implements `Error` without extending it, so an
 * `instanceof Error` test never catches one and `String()` would render it as
 * `[object Object]`. It is asked first, and the server's words are preferred
 * over the transport's sentence.
 */
function messageOf(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return refusalReason(error, error.message);
  }

  if (error instanceof Error) {
    return error.message;
  }

  const { message } = (error ?? {}) as { message?: unknown };

  return typeof message === 'string' && message.length > 0
    ? message
    : String(error);
}
