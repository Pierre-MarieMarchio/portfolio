import { ErrorHandler, inject, Injectable, isDevMode } from '@angular/core';
import { ReportedErrors } from '../services/reported-errors.service';

/**
 * Angular's default `ErrorHandler` hands everything to the console, which on
 * a deployed page means nowhere. This one keeps the failure as state, so a
 * view can render it like any other state, and still logs while developing.
 *
 * It is also the channel ngx-statewise reports to: a misrouted dispatch, an
 * effect that promised an action and produced none, and the cause an effect
 * reports before returning its `failure` all arrive here.
 */
@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private readonly reported = inject(ReportedErrors);

  public handleError(error: unknown): void {
    this.reported.record(error);

    if (isDevMode()) {
      console.error(error);
    }
  }
}
