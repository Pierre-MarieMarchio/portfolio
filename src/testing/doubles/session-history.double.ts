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

export class HistoryStackDouble {
  public hasWatcher = false;
  public entries: unknown[] = [{ navigationId: 1 }];
  public place = 0;
  public readonly backs: number[] = [];
  private pops: ((state: unknown) => void)[] = [];
  private pendingPops: unknown[] = [];
  private watchers: (() => void)[] = [];

  public readonly state = (): unknown => this.entries[this.place];

  public readonly push = (state: unknown): void => {
    this.entries = [...this.entries.slice(0, this.place + 1), state];
    this.place = this.entries.length - 1;
  };

  public readonly back = (steps: number): void => {
    this.backs.push(steps);
    this.place = Math.max(this.place - steps, 0);
    this.pendingPops.push(this.entries[this.place]);
  };

  public readonly onPop = (fn: (state: unknown) => void) => {
    this.pops.push(fn);
    return () => {
      this.pops = this.pops.filter((pop) => pop !== fn);
    };
  };

  public readonly watchClose = (fn: () => void): (() => void) => {
    this.watchers.push(fn);
    return () => {
      this.watchers = this.watchers.filter((watcher) => watcher !== fn);
    };
  };

  public readonly hasCloseWatcher = (): boolean => this.hasWatcher;

  public pressBack(): void {
    const watcher = this.hasWatcher ? this.watchers.pop() : undefined;
    if (watcher) {
      watcher();
      return;
    }
    this.place = Math.max(this.place - 1, 0);
    this.pop(this.entries[this.place]);
  }

  public deliverPops(): void {
    const pending = this.pendingPops;
    this.pendingPops = [];
    for (const state of pending) {
      this.pop(state);
    }
  }

  private pop(state: unknown): void {
    for (const fn of this.pops) {
      fn(state);
    }
  }
}

export const provideHistoryStack = (stack: HistoryStackDouble): Provider => ({
  provide: SessionHistoryService,
  useValue: stack,
});
