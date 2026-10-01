import { Provider } from '@angular/core';
import { SessionHistoryService } from '@app/core/services';

export class SessionHistoryDouble {
  public place: number | null = 0;
  public readonly stateNow: unknown = { navigationId: 1 };
  public readonly pushed: { state: unknown; address: string | undefined }[] =
    [];
  public readonly replaced: string[] = [];
  public readonly steps: number[] = [];

  public readonly position = (): number | null => this.place;

  public readonly state = (): unknown => this.stateNow;

  public readonly push = (state: unknown, address?: string): void => {
    this.pushed.push({ state, address });
    this.place = (this.place ?? 0) + 1;
  };

  public readonly replace = (address: string): void => {
    this.replaced.push(address);
  };

  public readonly back = (steps: number): void => {
    this.steps.push(steps);
  };
}

export const provideSessionHistoryDouble = (
  history: SessionHistoryDouble,
): Provider => ({ provide: SessionHistoryService, useValue: history });
