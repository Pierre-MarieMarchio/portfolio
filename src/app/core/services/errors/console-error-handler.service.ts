import { ErrorHandler, Service } from '@angular/core';

/**
 * The one channel every failure reaches: Angular's own, and ngx-statewise's
 * (a misrouted dispatch, an effect that promised an action and produced none,
 * and the cause an effect reports before returning its `failure`).
 *
 * It logs, in every build. The site has no error service to send to, and the
 * console is where a failure on the deployed page can still be read. The
 * showcase keeps failures as state instead; that store was dropped here
 * because no view ever rendered it. The day one does, the state comes back
 * behind this class, and nothing that reports has to change.
 */
@Service({ autoProvided: false })
export class ConsoleErrorHandlerService implements ErrorHandler {
  public handleError(error: unknown): void {
    console.error(error);
  }
}
