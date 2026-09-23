import { ErrorHandler, Service } from '@angular/core';

@Service({ autoProvided: false })
export class ConsoleErrorHandlerService implements ErrorHandler {
  public handleError(error: unknown): void {
    console.error(error);
  }
}
