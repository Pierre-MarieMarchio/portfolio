import { DestroyRef, inject, Service } from '@angular/core';
import {
  Event as RouterEvent,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { ClockService, SessionHistoryService } from '@app/core/services';
import {
  closedBy,
  layerOf,
  stepsBack,
  withLayer,
} from '../rules/back-layers.rules';

interface Layer {
  readonly depth: number;
  readonly onBack: () => void;
  readonly onLeave: () => void;
}

const ignore = (): void => {};

@Service({ autoProvided: false })
export class BackLayersService {
  private readonly history = inject(SessionHistoryService);
  private readonly router = inject(Router);
  private readonly clock = inject(ClockService);
  private layers: Layer[] = [];
  private swallowed = 0;
  private left = 0;
  private stopSweeping = ignore;
  private stops: (() => void)[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const stop of this.stops.splice(0)) {
        stop();
      }
    });
  }

  public push(onBack: () => void): () => void {
    return this.history.hasCloseWatcher() ? ignore : this.stack(onBack, onBack);
  }

  public claim(onBack: () => void, onLeave: () => void): () => void {
    return this.history.hasCloseWatcher()
      ? this.watch(onBack, onLeave)
      : this.stack(onBack, onLeave);
  }

  private watch(onBack: () => void, onLeave: () => void): () => void {
    let stopWatching = ignore;
    let stopLeaving = ignore;
    const stop = (): void => {
      stopWatching();
      stopLeaving();
      stopWatching = ignore;
      stopLeaving = ignore;
    };
    const close = (): void => {
      stop();
      onBack();
    };
    stopWatching = this.history.watchClose(close);
    stopLeaving = this.onLeave(() => {
      stop();
      onLeave();
    });
    return stop;
  }

  private stack(onBack: () => void, onLeave: () => void): () => void {
    this.listen();
    const layer = { depth: this.layers.length + 1, onBack, onLeave };
    this.layers = [...this.layers, layer];
    if (layer.depth > this.left) {
      this.history.push(withLayer(this.history.state(), layer.depth));
    }
    return () => {
      this.release(layer);
    };
  }

  private sweepSoon(): void {
    this.left = this.layers.length === 0 ? layerOf(this.history.state()) : 0;
    this.stopSweeping();
    let stopSecond = ignore;
    const stopFirst = this.clock.nextFrame(() => {
      stopSecond = this.clock.nextFrame(() => {
        this.sweep();
      });
    });
    this.stopSweeping = () => {
      stopFirst();
      stopSecond();
    };
  }

  private sweep(): void {
    this.stopSweeping();
    const above = this.left - Math.min(this.layers.length, this.left);
    this.left = 0;
    if (above > 0) {
      this.swallowed += 1;
      this.history.back(above);
    }
  }

  private release(layer: Layer): void {
    this.sweep();
    const steps = stepsBack(this.depths(), layer.depth);
    if (steps === 0) {
      return;
    }
    const closed = this.closeAbove(layer.depth - 1);
    this.swallowed += 1;
    this.history.back(steps);
    for (const above of closed.filter((open) => open !== layer)) {
      above.onBack();
    }
  }

  private listen(): void {
    if (this.stops.length > 0) {
      return;
    }
    this.stops = [
      this.history.onPop((state) => {
        this.popped(state);
      }),
      this.onFailure(() => {
        this.sweepSoon();
      }),
      () => {
        this.stopSweeping();
      },
      this.onLeave(() => {
        this.swallowed = 0;
        this.left = 0;
        this.stopSweeping();
        for (const layer of this.closeAbove(0)) {
          layer.onLeave();
        }
      }),
    ];
  }

  private onLeave(callback: () => void): () => void {
    return this.onNavigation(
      (event) => event instanceof NavigationStart,
      callback,
    );
  }

  private onFailure(callback: () => void): () => void {
    return this.onNavigation(
      (event) =>
        event instanceof NavigationCancel || event instanceof NavigationError,
      callback,
    );
  }

  public onArrive(callback: () => void): () => void {
    return this.onNavigation(
      (event) =>
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError,
      callback,
    );
  }

  private onNavigation(
    isWanted: (event: RouterEvent) => boolean,
    callback: () => void,
  ): () => void {
    const watching = this.router.events.subscribe((event) => {
      if (isWanted(event)) {
        callback();
      }
    });
    return () => {
      watching.unsubscribe();
    };
  }

  private popped(state: unknown): void {
    if (this.swallowed > 0) {
      this.swallowed -= 1;
      return;
    }
    this.backFrom(layerOf(state));
  }

  private backFrom(arrived: number): void {
    for (const layer of this.closeAbove(arrived)) {
      layer.onBack();
    }
  }

  private closeAbove(arrived: number): Layer[] {
    const closed = closedBy(this.depths(), arrived);
    const layers = closed.flatMap((depth) =>
      this.layers.filter((layer) => layer.depth === depth),
    );
    this.layers = this.layers.filter((layer) => layer.depth <= arrived);
    return layers;
  }

  private depths(): number[] {
    return this.layers.map((layer) => layer.depth);
  }
}
