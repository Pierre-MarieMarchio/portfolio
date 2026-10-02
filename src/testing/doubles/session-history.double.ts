import { Provider } from '@angular/core';
import { SessionHistoryService } from '@app/core/services';

export class SessionHistoryDouble {
  public place: number | null = 0;
  public readonly addresses: (string | null)[] = [];
  public readonly stateNow: unknown = { navigationId: 1 };
  public readonly pushed: { state: unknown; address: string | undefined }[] =
    [];
  public readonly replaced: string[] = [];
  public readonly steps: number[] = [];

  public readonly position = (): number | null => this.place;

  public readonly addressAt = (position: number): string | null =>
    this.addresses[position] ?? null;

  public readonly backTo = (parent: string): boolean => {
    const position = this.place ?? 0;
    const current = this.addressAt(position);
    const below = this.addresses
      .slice(0, position)
      .map((address, at) => ({ address, at }))
      .reverse()
      .find(({ address }) => address !== current);
    const isParent = below !== undefined && below.address === parent;
    if (isParent) {
      this.steps.push(position - below.at);
    }
    return isParent;
  };

  public readonly state = (): unknown => this.stateNow;

  public readonly push = (state: unknown, address?: string): void => {
    this.pushed.push({ state, address });
    const next = (this.place ?? 0) + 1;
    this.addresses[next] = address ?? this.addresses[next - 1] ?? null;
    this.place = next;
  };

  public readonly replace = (address: string): void => {
    this.replaced.push(address);
    this.addresses[this.place ?? 0] = address;
  };

  public readonly back = (steps: number): void => {
    this.steps.push(steps);
  };
}

export const provideSessionHistoryDouble = (
  history: SessionHistoryDouble,
): Provider => ({ provide: SessionHistoryService, useValue: history });
